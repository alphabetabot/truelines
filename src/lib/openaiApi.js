async function callGPT(messages, systemPrompt, maxTokens = 1024) {
  const res = await fetch('/api/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export async function analyzeGameGPT(game) {
  const system = `You are a sharp sports betting analyst with expertise in line movement, 
market inefficiencies, and statistical modeling. Provide concise, data-driven analysis.
Format with clear sections. No generic gambling disclaimers.`

  const messages = [{
    role: 'user',
    content: `Analyze this game and its betting lines:\n\n${formatGameForAI(game)}\n\nProvide:
1. **Line Movement Analysis** - What do the current lines suggest about sharp money?
2. **Key Angles** - Public vs sharp tendencies, situational factors
3. **Best Value** - Where is the value in the current lines?
4. **Line Shopping Edge** - Best book for each bet type`,
  }]

  return callGPT(messages, system, 1200)
}

export async function getGPTPick(game) {
  const system = `You are a professional sports handicapper. Make specific, confident picks with clear reasoning.
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
  const system = `You are an elite sports betting analyst. Review the slate and identify the TOP 3-5 best bets.
Focus on line value and market inefficiencies. Be specific. No fluff.`

  const slate = games.slice(0, 15).map(g => formatGameForAI(g)).join('\n\n---\n\n')

  const messages = [{
    role: 'user',
    content: `Today's slate:\n\n${slate}\n\nIdentify TOP 3-5 BEST BETS. For each:
**Pick #N: [Team/Side] - [Sport]**
- Bet: [type] at [odds] via [best book]
- Confidence: [★ rating]
- Reasoning: [sharp, concise edge]

End with **Fade of the Day**.`,
  }]

  return callGPT(messages, system, 1500)
}
