// All Claude calls go through the local backend proxy — API key stays server-side
import { getAuthHeaders } from './authHeaders'

const PROXY_URL = '/api/claude'

async function callClaude(messages, systemPrompt, maxTokens = 1024) {
  const authHeaders = await getAuthHeaders()
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
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

export async function analyzeGame(game, pitchers = {}) {
  const isMLB = game.sport === 'baseball_mlb'
  const sportContexts = {
    baseball_mlb: `For MLB, use the supplied probable pitcher stats, venue, weather, and current odds when present. If pitcher, weather, bullpen, lineup, injury, or historical trend data is missing, say it is not available rather than guessing.`,
    basketball_nba: `For NBA, use current moneyline, spread, and total prices plus basic home/away context. Do not invent injuries, rest data, pace metrics, or ratings unless they are explicitly included in the supplied data.`,
    basketball_ncaab: `For NCAAB, use current prices and basic matchup context. Do not infer travel, tempo, injuries, or market movement unless supplied.`,
    americanfootball_nfl: `For NFL, use current prices and basic matchup context. Do not invent injury reports, weather, rankings, or rest/travel details unless supplied.`,
    americanfootball_ncaaf: `For NCAAF, use current prices and basic matchup context. Do not invent injuries, schemes, or market movement unless supplied.`,
    icehockey_nhl: `For NHL, use current prices and basic matchup context. Do not invent goalie confirmations, special-teams metrics, line combinations, or recent form unless supplied.`,
    soccer_epl: `For EPL, use current prices and basic matchup context. Do not invent injuries, suspensions, squad depth, travel, or tactics unless supplied.`,
    soccer_usa_mls: `For MLS, use current prices and basic matchup context. Do not invent availability, form, or travel details unless supplied.`,
    mma_mixed_martial_arts: `For MMA, use current prices and basic matchup context. Do not invent camp, weight-cut, judge, or form details unless supplied.`,
  }

  const sportContext = sportContexts[game.sport] || 'Use the supplied odds and matchup context only. Do not invent injuries, form, or situational angles.'

  const system = `You are Vega, TrueOddsIQ's AI analyst. Your job is to compare current sportsbook prices, explain what the available data supports, and be explicit about missing inputs.

For this game: ${sportContext}

Do not claim access to betting splits, sharp money, injury feeds, or historical line movement unless the user message provides that data. Focus on price comparison, implied probability, available MLB pitcher/weather context, and the best listed book for each bet type.
Be concise, direct, data-driven. No fluff. No generic gambling disclaimers.`

  const oddsSnapshot = formatGameForAI(game, pitchers)

  const messages = [
    {
      role: 'user',
      content: `Analyze this game and its betting lines:\n\n${oddsSnapshot}\n\nProvide a complete analysis covering:
1. **Matchup Context** - Use only the teams, sport, start time, and any supplied pitcher/weather/venue details
2. **Current Market Snapshot** - Compare the listed moneyline, spread, and total prices without inferring historical movement
3. **Data Gaps** - Briefly state important context not provided, such as injuries or betting splits, if relevant
4. **Best Bet** - The single best value play supported by the listed prices and available context
5. **Line Shopping Edge** - Which book has the best listed number for each bet type`,
    },
  ]

  return callClaude(messages, system, 1200)
}

export async function getAIPick(game, pitchers = {}) {
  const system = `You are Vega, TrueOddsIQ's AI analyst. Use only the supplied odds and matchup context to make a specific research pick.
Do not invent injuries, betting splits, sharp money, or historical line movement. If context is missing, keep the confidence modest and explain the limitation.
Format: Pick, Odds, Book, Confidence (1-5 stars), Reasoning (include available factors like price differences, pitcher matchup, weather, or venue when supplied).
Be direct. No hedging. No disclaimers.`

  const oddsSnapshot = formatGameForAI(game, pitchers)

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
  const system = `You are Vega, TrueOddsIQ's AI analyst.
You review the available slate and identify the top research picks supported by current listed prices.
Focus on line-shopping value and clearly available matchup context. Do not claim steam moves, sharp money, betting splits, injuries, or historical line movement unless supplied in the slate.
Be specific with picks, books, and reasoning. No fluff.`

  const slate = games
    .slice(0, 15)
    .map(g => formatGameForAI(g))
    .join('\n\n---\n\n')

  const messages = [
    {
      role: 'user',
      content: `Here is today's betting slate:\n\n${slate}\n\nIdentify up to 3-5 best research picks of the day.
For each pick provide:
**Pick #N: [Team/Side] - [Sport]**
- Bet: [type] at [odds] via [best book]
- Confidence: [★ rating]
- Reasoning: [concise edge based on listed prices and supplied context]

End with a brief **Fade of the Day** only if the listed prices clearly support one; otherwise say no fade identified from the available data.`,
    },
  ]

  return callClaude(messages, system, 1500)
}

export async function analyzeLineMovement(game, historicalNote) {
  const system = `You are Vega, TrueOddsIQ's AI analyst. Analyze only the historical line information supplied by the user and do not infer sharp money or public betting splits without explicit data.`

  const messages = [
    {
      role: 'user',
      content: `Analyze the supplied line-history note for:\n${formatGameForAI(game)}\n\nContext: ${historicalNote}\n\nWhat can and cannot be concluded from this supplied movement?`,
    },
  ]

  return callClaude(messages, system, 600)
}

function getPitcher(pitchers, teamName) {
  if (!pitchers || !teamName) return null
  const direct = pitchers[teamName]
  if (direct) return direct
  const lastWord = teamName.split(' ').slice(-1)[0]
  const match = Object.entries(pitchers).find(([k]) =>
    teamName.includes(k) || k.includes(lastWord)
  )
  return match ? match[1] : null
}

function formatGameForAI(game, pitchers = {}) {
  const isMLB = game.sport === 'baseball_mlb'
  const awayPitcher = isMLB ? getPitcher(pitchers, game.away) : null
  const homePitcher = isMLB ? getPitcher(pitchers, game.home) : null

  const lines = [
    `${game.away} @ ${game.home}`,
    `Time: ${new Date(game.commenceTime).toLocaleString()}`,
    `Sport: ${game.sport}`,
  ]

  if (isMLB) {
    // Ballpark info
    const venueName = awayPitcher?.venueName || homePitcher?.venueName || 'Unknown Ballpark'
    const weather = awayPitcher?.weather || homePitcher?.weather
    const weatherStr = weather
      ? `${weather.condition || ''} ${weather.temp ? weather.temp + '°F' : ''} ${weather.wind ? '| Wind: ' + weather.wind : ''}`.trim()
      : 'Dome/Unknown'

    lines.push('')
    lines.push(`BALLPARK: ${venueName}`)
    lines.push(`WEATHER: ${weatherStr}`)
    lines.push('')
    lines.push('STARTING PITCHERS:')

    if (awayPitcher) {
      lines.push(`  ${game.away}: ${awayPitcher.name}`)
      lines.push(`    Season: ${awayPitcher.wins}-${awayPitcher.losses}, ${awayPitcher.era} ERA, ${awayPitcher.whip} WHIP, ${awayPitcher.strikeoutsPer9} K/9`)
      lines.push(`    Opp AVG: ${awayPitcher.oppAvg}, HR/9: ${awayPitcher.homeRunsPer9}`)
    } else {
      lines.push(`  ${game.away}: TBD`)
    }

    if (homePitcher) {
      lines.push(`  ${game.home}: ${homePitcher.name}`)
      lines.push(`    Season: ${homePitcher.wins}-${homePitcher.losses}, ${homePitcher.era} ERA, ${homePitcher.whip} WHIP, ${homePitcher.strikeoutsPer9} K/9`)
      lines.push(`    Opp AVG: ${homePitcher.oppAvg}, HR/9: ${homePitcher.homeRunsPer9}`)
    } else {
      lines.push(`  ${game.home}: TBD`)
    }
  }

  lines.push('')
  lines.push('MONEYLINE:')

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
