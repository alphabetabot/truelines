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
    baseball_mlb: `For MLB you MUST analyze: starting pitcher matchup (ERA, WHIP, K/9, opp AVG), ballpark factors (pitcher vs hitter friendly), weather (wind speed/direction is critical for totals, temp affects carry), bullpen strength, team batting vs LHP/RHP splits, recent form last 10 games, and how all these affect the total.`,
    basketball_nba: `For NBA analyze: home/away splits, pace of play, offensive/defensive ratings, injury reports, back-to-back situations, rest advantage, key player matchups, recent form, and referee tendencies for pace/fouls.`,
    basketball_ncaab: `For NCAAB analyze: home court advantage (massive in college), tempo, key player matchups, travel fatigue, coaching tendencies, conference familiarity, and line movement indicating sharp action.`,
    americanfootball_nfl: `For NFL analyze: offensive/defensive rankings, injury report (especially QB, OL, CB), weather (wind over 15mph kills passing games, cold affects kicking), home field advantage, divisional familiarity, coaching matchup, rest/travel, and recent ATS record.`,
    americanfootball_ncaaf: `For NCAAF analyze: talent gap, home field advantage, key player injuries, weather, coaching matchup, offensive scheme vs defensive scheme, and line movement.`,
    icehockey_nhl: `For NHL analyze: goalie matchup (save%, GAA), power play/penalty kill percentages, home/away splits, back-to-back situations, line combinations, recent form, and team shooting percentages.`,
    soccer_epl: `For EPL analyze: home/away form, key injuries/suspensions, head-to-head record, squad depth, European competition fatigue, manager tactics, and weather.`,
    soccer_usa_mls: `For MLS analyze: home field advantage (travel distances are huge), turf vs grass preference, key player availability, form guide, and conference standings implications.`,
    mma_mixed_martial_arts: `For MMA analyze: fighting styles (striker vs grappler), reach/size advantages, recent form, camp quality, weight cut issues, judges tendencies for the venue, and how the matchup plays stylistically.`,
  }

  const sportContext = sportContexts[game.sport] || 'Analyze all relevant matchup factors, recent form, injuries, and situational angles.'

  const system = `You are Vega, TrueOddsIQ's AI analyst and an elite sports betting analyst with deep knowledge of line movement, market inefficiencies, injury impacts, and statistical modeling. You think like a sharp bettor.

For this game: ${sportContext}

Always include: line movement interpretation, public vs sharp money signals, best value bet, and best book for each bet type.
Be concise, direct, data-driven. No fluff. No generic gambling disclaimers.`

  const oddsSnapshot = formatGameForAI(game, pitchers)

  const messages = [
    {
      role: 'user',
      content: `Analyze this game and its betting lines:\n\n${oddsSnapshot}\n\nProvide a sharp, complete analysis covering:
1. **Matchup Breakdown** - Key factors that determine the outcome (pitchers/QBs/goalies/etc, injuries, form, situational edges)
2. **Line Movement & Sharp Money** - What do the current lines tell us? Any steam moves or reverse line movement?
3. **Environmental Factors** - Weather, venue, home/away splits, travel, rest advantages
4. **Best Bet** - The single best value play with reasoning
5. **Line Shopping Edge** - Which book has the best number for each bet type`,
    },
  ]

  return callClaude(messages, system, 1200)
}

export async function getAIPick(game, pitchers = {}) {
  const system = `You are Vega, TrueOddsIQ's AI analyst — a professional sports handicapper who thinks like a sharp bettor.
Analyze the matchup, lines, injuries, weather, venue, and situational factors to make a specific confident pick.
Format: Pick, Odds, Book, Confidence (1-5 stars), Reasoning (include key factors like pitcher matchup, weather, injuries, line value).
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
  const system = `You are Vega, TrueOddsIQ's AI analyst and an elite sports betting analyst. 
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
  const system = `You are Vega, TrueOddsIQ's AI analyst specializing in line movement analysis and sharp money detection.`

  const messages = [
    {
      role: 'user',
      content: `Analyze line movement for:\n${formatGameForAI(game)}\n\nContext: ${historicalNote}\n\nWhat does this movement tell us?`,
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
