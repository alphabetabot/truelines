import { getAuthHeaders } from './authHeaders'

async function callGPT(messages, systemPrompt, maxTokens = 1024) {
  const authHeaders = await getAuthHeaders()
  const res = await fetch('/api/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GPT API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

function formatGameForAI(game, pitchers = {}) {
  const isMLB = game.sport === 'baseball_mlb'

  function getPitcher(teamName) {
    if (!pitchers || !teamName) return null
    const direct = pitchers[teamName]
    if (direct) return direct
    const lastWord = teamName.split(' ').slice(-1)[0]
    const match = Object.entries(pitchers).find(([k]) =>
      teamName.includes(k) || k.includes(lastWord)
    )
    return match ? match[1] : null
  }

  const awayP = isMLB ? getPitcher(game.away) : null
  const homeP = isMLB ? getPitcher(game.home) : null

  const pitcherLines = isMLB ? [
    '',
    'STARTING PITCHERS:',
    `  ${game.away}: ${awayP ? `${awayP.name} (${awayP.wins}-${awayP.losses}, ${awayP.era} ERA)` : 'TBD'}`,
    `  ${game.home}: ${homeP ? `${homeP.name} (${homeP.wins}-${homeP.losses}, ${homeP.era} ERA)` : 'TBD'}`,
  ] : []

  return _formatGameForAI(game, pitcherLines)
}

function _formatGameForAI(game, extraLines = []) {
  const lines = [
    `${game.away} @ ${game.home}`,
    `Time: ${new Date(game.commenceTime).toLocaleString()}`,
    `Sport: ${game.sport}`,
    ...extraLines,
    '',
    'MONEYLINE:',
  ]
  const books = Object.entries(game.bookmakers || {})
  books.forEach(([book, markets]) => {
    const h2h = markets.h2h
    if (h2h) {
      const home = h2h.find(o => o.name === game.home)
      const away = h2h.find(o => o.name === game.away)
      if (home && away)
        lines.push(`  ${book}: ${game.away} ${away.price > 0 ? '+' : ''}${away.price} / ${game.home} ${home.price > 0 ? '+' : ''}${home.price}`)
    }
  })
  lines.push('', 'SPREAD:')
  books.forEach(([book, markets]) => {
    const spread = markets.spreads
    if (spread) {
      const home = spread.find(o => o.name === game.home)
      const away = spread.find(o => o.name === game.away)
      if (home && away)
        lines.push(`  ${book}: ${game.away} ${away.point > 0 ? '+' : ''}${away.point} (${away.price > 0 ? '+' : ''}${away.price}) / ${game.home} ${home.point > 0 ? '+' : ''}${home.point} (${home.price > 0 ? '+' : ''}${home.price})`)
    }
  })
  lines.push('', 'TOTAL:')
  books.forEach(([book, markets]) => {
    const total = markets.totals
    if (total) {
      const over = total.find(o => o.name === 'Over')
      const under = total.find(o => o.name === 'Under')
      if (over && under)
        lines.push(`  ${book}: O${over.point} (${over.price > 0 ? '+' : ''}${over.price}) / U${under.point} (${under.price > 0 ? '+' : ''}${under.price})`)
    }
  })
  return lines.join('\n')
}

export async function analyzeGameGPT(game, pitchers = {}) {
  const system = `You are a sports betting research analyst. Use only the supplied odds and matchup context.
Do not claim access to betting splits, sharp money, injuries, or historical line movement unless the user message provides that data. Provide concise, data-driven analysis and note important missing inputs.
Format with clear sections. No generic gambling disclaimers.`

  const messages = [{
    role: 'user',
    content: `Analyze this game and its betting lines:\n\n${formatGameForAI(game, pitchers)}\n\nProvide:
1. **Current Market Snapshot** - Compare the listed prices without inferring historical movement
2. **Key Angles** - Available matchup context and any notable data gaps
3. **Best Value** - Where the listed prices create the clearest line-shopping value
4. **Line Shopping Edge** - Best book for each bet type`,
  }]

  return callGPT(messages, system, 1200)
}

export async function getGPTPick(game) {
  const system = `You are a sports betting research analyst. Make specific picks only from the supplied odds snapshot and matchup context.
Do not invent injuries, betting splits, sharp money, or historical line movement.
Format picks clearly. Be direct and decisive. No hedging. No gambling disclaimers.`

  const messages = [{
    role: 'user',
    content: `Based on these lines, give me your best bet:\n\n${formatGameForAI(game)}\n\nFormat:
**Pick:** [Team/Side/Total]
**Bet:** [Spread/ML/Over/Under] at [Odds] via [Book]
**Confidence:** [★★★★☆]
**Edge:** [2-3 sentence reasoning]`,
  }]

  return callGPT(messages, system, 600)
}

export async function getDailyPicksGPT(games) {
  const system = `You are a sports betting research analyst. Review the slate and identify the top research picks supported by current listed prices.
Focus on line-shopping value and supplied matchup context. Do not claim steam moves, sharp money, betting splits, injuries, or historical line movement unless supplied. Be specific. No fluff.`

  const slate = games.slice(0, 15).map(g => formatGameForAI(g)).join('\n\n---\n\n')

  const messages = [{
    role: 'user',
    content: `Today's slate:\n\n${slate}\n\nIdentify up to 3-5 best research picks. For each:
**Pick #N: [Team/Side] - [Sport]**
- Bet: [type] at [odds] via [best book]
- Confidence: [★ rating]
- Reasoning: [concise edge based on listed prices and supplied context]

End with **Fade of the Day** only if the listed prices clearly support one; otherwise say no fade identified from the available data.`,
  }]

  return callGPT(messages, system, 1500)
}
