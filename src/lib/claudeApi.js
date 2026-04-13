// All Claude calls go through the local backend proxy — API key stays server-side
const PROXY_URL = '/api/claude'

async function callClaude(messages, systemPrompt, maxTokens = 1024) {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-opus-4-5-20251101',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.content[0].text
}

export async function analyzeGame(game) {
  const system = `You are TrueLines AI, an expert sports betting analyst with deep knowledge of line movement, 
market inefficiencies, and statistical modeling. You provide sharp, data-driven analysis. 
Be concise, direct, and professional. Format your response with clear sections.
Do NOT give generic disclaimers about gambling being risky - the user knows this.`

  const oddsSnapshot = formatGameForAI(game)

  const messages = [
    {
      role: 'user',
      content: `Analyze this game and its betting lines:\n\n${oddsSnapshot}\n\nProvide:
1. **Line Movement Analysis** - What do the current lines suggest about sharp money?
2. **Key Angles** - Public vs sharp tendencies, situational factors
3. **Best Value** - Where is the value in the current lines?
4. **Line Shopping Edge** - Best book for each bet type based on the odds shown`,
    },
  ]

  return callClaude(messages, system, 1200)
}

export async function getAIPick(game) {
  const system = `You are TrueLines AI, a professional sports handicapper. 
You analyze betting lines and make specific, confident picks with clear reasoning.
Format your picks clearly with: Pick, Odds, Book, Confidence (1-5 stars), and Brief Reasoning.
Be direct and decisive. No hedging. No gambling disclaimers.`

  const oddsSnapshot = formatGameForAI(game)

  const messages = [
    {
      role: 'user',
      content: `Based on these lines, give me your best bet(s) for this game:\n\n${oddsSnapshot}\n\nFormat:
**Pick:** [Team/Side/Total]
**Bet:** [Spread/ML/Over/Under] at [Odds] via [Book]
**Confidence:** [★★★★☆]
**Edge:** [2-3 sentence reasoning why this is the best value]`,
    },
  ]

  return callClaude(messages, system, 600)
}

export async function getDailyPicks(games) {
  const system = `You are TrueLines AI, an elite sports betting analyst. 
You review the entire slate of games and identify the TOP 3-5 best bets of the day.
Focus on line value, steam moves, and market inefficiencies.
Be specific with picks, books, and reasoning. No fluff.`

  const slate = games
    .slice(0, 15)
    .map(g => formatGameForAI(g))
    .join('\n\n---\n\n')

  const messages = [
    {
      role: 'user',
      content: `Here is today's betting slate:\n\n${slate}\n\nIdentify the TOP 3-5 BEST BETS of the day. 
For each pick provide:
**Pick #N: [Team/Side] - [Sport]**
- Bet: [type] at [odds] via [best book]
- Confidence: [★ rating]
- Reasoning: [sharp, concise edge]

End with a brief **Fade of the Day** (most public bet to avoid).`,
    },
  ]

  return callClaude(messages, system, 1500)
}

export async function analyzeLineMovement(game, historicalNote) {
  const system = `You are TrueLines AI, specializing in line movement analysis and sharp money detection.`

  const messages = [
    {
      role: 'user',
      content: `Analyze line movement for:\n${formatGameForAI(game)}\n\nContext: ${historicalNote}\n\nWhat does this movement tell us?`,
    },
  ]

  return callClaude(messages, system, 600)
}

function formatGameForAI(game) {
  const lines = [
    `${game.away} @ ${game.home}`,
    `Time: ${new Date(game.commenceTime).toLocaleString()}`,
    `Sport: ${game.sport}`,
    '',
    'MONEYLINE:',
  ]

  const books = Object.entries(game.bookmakers || {})
  books.forEach(([book, markets]) => {
    const h2h = markets.h2h
    if (h2h) {
      const home = h2h.find(o => o.name === game.home)
      const away = h2h.find(o => o.name === game.away)
      if (home && away) {
        lines.push(`  ${book}: ${game.away} ${away.price > 0 ? '+' : ''}${away.price} / ${game.home} ${home.price > 0 ? '+' : ''}${home.price}`)
      }
    }
  })

  lines.push('', 'SPREAD:')
  books.forEach(([book, markets]) => {
    const spread = markets.spreads
    if (spread) {
      const home = spread.find(o => o.name === game.home)
      const away = spread.find(o => o.name === game.away)
      if (home && away) {
        lines.push(`  ${book}: ${game.away} ${away.point > 0 ? '+' : ''}${away.point} (${away.price > 0 ? '+' : ''}${away.price}) / ${game.home} ${home.point > 0 ? '+' : ''}${home.point} (${home.price > 0 ? '+' : ''}${home.price})`)
      }
    }
  })

  lines.push('', 'TOTAL:')
  books.forEach(([book, markets]) => {
    const total = markets.totals
    if (total) {
      const over = total.find(o => o.name === 'Over')
      const under = total.find(o => o.name === 'Under')
      if (over && under) {
        lines.push(`  ${book}: O${over.point} (${over.price > 0 ? '+' : ''}${over.price}) / U${under.point} (${under.price > 0 ? '+' : ''}${under.price})`)
      }
    }
  })

  return lines.join('\n')
}
