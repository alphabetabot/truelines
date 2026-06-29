/** Fetch today's slate and call Claude for daily picks. */
import { getPacificDateKey } from './_newsletter-send-guard.js'
import {
  PICK_METRICS_PROMPT_RULES,
  filterBettableGames,
  rankGamesByDataQuality,
} from './_pick-metrics.js'
import {
  analyzeMlbSlate,
  selectMlbEnginePicks,
  formatEngineBlockForPrompt,
  engineAnalysisToPick,
} from './_mlb-engine/index.js'
import {
  appendGameStatsBlock,
  applySportContext,
  loadSportContextBundle,
} from './_sport-context.js'

const ODDS_API_KEY = process.env.ODDS_API_KEY || process.env.VITE_ODDS_API_KEY
const BOOKMAKERS = 'draftkings,fanduel,betmgm,williamhill_us,pinnacle,bet365'
const BOOK_LABELS = {
  draftkings: 'DraftKings',
  fanduel: 'FanDuel',
  betmgm: 'BetMGM',
  williamhill_us: 'Caesars',
  pinnacle: 'Pinnacle',
  bet365: 'Bet365',
}

const BALLPARK_FACTORS = {
  'Coors Field': 'Extreme hitter-friendly: high altitude and thin air',
  'Yankee Stadium': 'Slight hitter-friendly: short right-field porch',
  'Dodger Stadium': 'Slight pitcher-friendly',
  'Kauffman Stadium': 'Pitcher-friendly: large outfield',
  'T-Mobile Park': 'Pitcher-friendly: marine layer',
  'Camden Yards': 'Hitter-friendly: short right-field dimensions',
  'Wrigley Field': 'Wind-dependent run environment',
  'American Family Field': 'Neutral retractable-roof environment',
  'Nationals Park': 'Neutral run environment',
  'Truist Park': 'Slight hitter-friendly',
  'Oracle Park': 'Pitcher-friendly: marine layer and large foul territory',
  'Petco Park': 'Pitcher-friendly: spacious outfield',
}

async function getMLBStats(teamId, teamName) {
  try {
    const res = await fetch(`https://statsapi.mlb.com/api/v1/standings?leagueId=103,104`)
    const data = await res.json()
    for (const division of data.records || []) {
      for (const tr of division.teamRecords || []) {
        if (tr.team.id === teamId || tr.team.name === teamName) {
          return {
            wins: tr.wins || 0,
            losses: tr.losses || 0,
            runDiff: tr.runDifferential || 0,
          }
        }
      }
    }
    return { wins: 0, losses: 0, runDiff: 0 }
  } catch {
    return { wins: 0, losses: 0, runDiff: 0 }
  }
}

async function getPitcherStats(pitcherId, pitcherName) {
  try {
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/people?personIds=${pitcherId}&hydrate=stats(group=pitching,type=season),currentTeam`
    )
    const data = await res.json()
    const person = data.people?.[0]
    const seasonStats = person?.stats?.find(s =>
      s.group?.displayName === 'pitching' && s.type?.displayName === 'season'
    )
    const stats = seasonStats?.splits?.[0]?.stat
    if (stats) {
      return {
        era: stats.era ? parseFloat(stats.era).toFixed(2) : 'N/A',
        wins: stats.wins || 0,
        losses: stats.losses || 0,
        ip: stats.inningsPitched || 0,
        gs: stats.gamesStarted || stats.gamesPlayed || 0,
        gamesStarted: stats.gamesStarted || stats.gamesPlayed || 0,
        k9: stats.strikeoutsPer9Inn ? parseFloat(stats.strikeoutsPer9Inn).toFixed(1) : 'N/A',
        bb9: stats.walksPer9Inn ? parseFloat(stats.walksPer9Inn).toFixed(1) : 'N/A',
        whip: stats.whip ? parseFloat(stats.whip).toFixed(2) : 'N/A',
        oppAvg: stats.avg || 'N/A',
        hr9: stats.homeRunsPer9 ? parseFloat(stats.homeRunsPer9).toFixed(1) : 'N/A',
      }
    }
    return { era: 'N/A', wins: 0, losses: 0, ip: 0, gs: 0, gamesStarted: 0, k9: 'N/A', bb9: 'N/A', whip: 'N/A', oppAvg: 'N/A', hr9: 'N/A' }
  } catch {
    console.warn(`Pitcher stats fetch failed for ${pitcherName || pitcherId}`)
    return { era: 'N/A', wins: 0, losses: 0, ip: 0, gs: 0, gamesStarted: 0, k9: 'N/A', bb9: 'N/A', whip: 'N/A', oppAvg: 'N/A', hr9: 'N/A' }
  }
}

async function getTodaysGames() {
  const today = getPacificDateKey(new Date())
  const games = []

  try {
    const res = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=probablePitcher,team,weather,venue`)
    const data = await res.json()
    data.dates?.forEach(d => {
      d.games?.forEach(g => {
        games.push({
          sport: 'MLB',
          away: g.teams?.away?.team?.name,
          awayId: g.teams?.away?.team?.id,
          home: g.teams?.home?.team?.name,
          homeId: g.teams?.home?.team?.id,
          venue: g.venue?.name,
          weather: g.weather,
          awayPitcher: g.teams?.away?.probablePitcher?.fullName,
          awayPitcherId: g.teams?.away?.probablePitcher?.id,
          homePitcher: g.teams?.home?.probablePitcher?.fullName,
          homePitcherId: g.teams?.home?.probablePitcher?.id,
          gameTime: g.gameDateTime,
        })
      })
    })
  } catch { console.warn('MLB fetch failed') }

  try {
    const mlbOddsRes = await fetch(`https://api.the-odds-api.com/v4/sports/baseball_mlb/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=${BOOKMAKERS}`)
    const mlbOddsData = await mlbOddsRes.json()
    if (Array.isArray(mlbOddsData)) {
      mlbOddsData.forEach(g => {
        const existingGame = games.find(eg => eg.sport === 'MLB' && eg.away === g.away_team && eg.home === g.home_team)
        if (existingGame) {
          existingGame.bookmakers = g.bookmakers
        } else {
          games.push({
            sport: 'MLB',
            away: g.away_team,
            home: g.home_team,
            bookmakers: g.bookmakers,
            commence_time: g.commence_time
          })
        }
      })
    }
  } catch { console.warn('MLB odds fetch failed') }

  try {
    const nbaRes = await fetch(`https://api.the-odds-api.com/v4/sports/basketball_nba/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=${BOOKMAKERS}`)
    const nbaData = await nbaRes.json()
    nbaData?.forEach(g => games.push({ 
      sport: 'NBA', 
      away: g.away_team, 
      home: g.home_team, 
      bookmakers: g.bookmakers, 
      commence_time: g.commence_time,
      awayId: g.away_team?.toLowerCase().replace(/\s+/g, ''),
      homeId: g.home_team?.toLowerCase().replace(/\s+/g, '')
    }))
  } catch { console.warn('NBA fetch failed') }

  try {
    const nhlRes = await fetch(`https://api.the-odds-api.com/v4/sports/icehockey_nhl/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=${BOOKMAKERS}`)
    const nhlData = await nhlRes.json()
    nhlData?.forEach(g => games.push({ 
      sport: 'NHL', 
      away: g.away_team, 
      home: g.home_team, 
      bookmakers: g.bookmakers, 
      commence_time: g.commence_time,
      awayId: g.away_team?.toLowerCase().replace(/\s+/g, ''),
      homeId: g.home_team?.toLowerCase().replace(/\s+/g, '')
    }))
  } catch { console.warn('NHL fetch failed') }

  return games
}

function formatOdds(price) {
  if (price === null || price === undefined || price === 'N/A') return 'N/A'
  const n = Number(price)
  if (Number.isNaN(n)) return String(price)
  return n > 0 ? `+${n}` : `${n}`
}

function bookName(key) {
  return BOOK_LABELS[key] || key
}

function getMarket(bookmaker, key) {
  return bookmaker?.markets?.find(m => m.key === key)
}

function bestOutcome(game, marketKey, outcomeName, preferPoint = null) {
  const outcomes = []
  for (const book of game.bookmakers || []) {
    const market = getMarket(book, marketKey)
    const outcome = market?.outcomes?.find(o =>
      o.name === outcomeName && (preferPoint == null || Number(o.point) === Number(preferPoint))
    )
    if (outcome?.price != null) {
      outcomes.push({
        book: bookName(book.key),
        price: outcome.price,
        point: outcome.point,
      })
    }
  }

  if (!outcomes.length) return null
  return outcomes.sort((a, b) => b.price - a.price)[0]
}

function collectOutcomePoints(game, marketKey, outcomeName) {
  const points = []
  for (const book of game.bookmakers || []) {
    const market = getMarket(book, marketKey)
    const outcome = market?.outcomes?.find(o => o.name === outcomeName)
    if (outcome?.point != null) points.push(Number(outcome.point))
  }
  return points
}

function bestSpread(game, teamName) {
  const candidates = []
  for (const book of game.bookmakers || []) {
    const market = getMarket(book, 'spreads')
    const outcome = market?.outcomes?.find(o => o.name === teamName)
    if (outcome?.point != null && outcome?.price != null) {
      candidates.push({ book: bookName(book.key), point: outcome.point, price: outcome.price })
    }
  }

  if (!candidates.length) return null
  return candidates.sort((a, b) => {
    if (b.point !== a.point) return b.point - a.point
    return b.price - a.price
  })[0]
}

function bestTotal(game, side) {
  const candidates = []
  for (const book of game.bookmakers || []) {
    const market = getMarket(book, 'totals')
    const outcome = market?.outcomes?.find(o => o.name === side)
    if (outcome?.point != null && outcome?.price != null) {
      candidates.push({ book: bookName(book.key), point: outcome.point, price: outcome.price })
    }
  }

  if (!candidates.length) return null
  return candidates.sort((a, b) => {
    if (side === 'Over' && a.point !== b.point) return a.point - b.point
    if (side === 'Under' && a.point !== b.point) return b.point - a.point
    return b.price - a.price
  })[0]
}

function oddsRange(game, marketKey, outcomeName) {
  const prices = []
  for (const book of game.bookmakers || []) {
    const outcome = getMarket(book, marketKey)?.outcomes?.find(o => o.name === outcomeName)
    if (outcome?.price != null) prices.push(outcome.price)
  }
  if (prices.length < 2) return null
  return `${formatOdds(Math.min(...prices))} to ${formatOdds(Math.max(...prices))}`
}

function ballparkInfo(venue) {
  if (!venue) return null
  const match = Object.entries(BALLPARK_FACTORS).find(([name]) =>
    venue.includes(name) || name.includes(venue)
  )
  return match ? match[1] : 'Standard run environment'
}

function enrichOdds(game) {
  if (!game.bookmakers?.length) return game

  const awayML = bestOutcome(game, 'h2h', game.away)
  const homeML = bestOutcome(game, 'h2h', game.home)
  const awaySpread = bestSpread(game, game.away)
  const homeSpread = bestSpread(game, game.home)
  const over = bestTotal(game, 'Over')
  const under = bestTotal(game, 'Under')
  const totalPoints = collectOutcomePoints(game, 'totals', 'Over')

  return {
    ...game,
    bestOdds: { awayML, homeML, awaySpread, homeSpread, over, under },
    oddsSummary: [
      `ML best: ${game.away} ${awayML ? `${formatOdds(awayML.price)} ${awayML.book}` : 'N/A'} (range ${oddsRange(game, 'h2h', game.away) || 'N/A'})`,
      `${game.home} ${homeML ? `${formatOdds(homeML.price)} ${homeML.book}` : 'N/A'} (range ${oddsRange(game, 'h2h', game.home) || 'N/A'})`,
      awaySpread ? `${game.away} spread: ${awaySpread.point} (${formatOdds(awaySpread.price)}) ${awaySpread.book}` : null,
      homeSpread ? `${game.home} spread: ${homeSpread.point} (${formatOdds(homeSpread.price)}) ${homeSpread.book}` : null,
      over ? `Total: Over ${over.point} (${formatOdds(over.price)}) ${over.book}` : null,
      under ? `Under ${under.point} (${formatOdds(under.price)}) ${under.book}` : null,
      totalPoints.length >= 2 ? `Total line range: ${Math.min(...totalPoints)}-${Math.max(...totalPoints)}` : null,
    ].filter(Boolean).join(' | '),
  }
}

function pacificDateKey(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function gameDate(game) {
  const value = game.gameTime || game.commence_time
  return value ? new Date(value) : null
}

function isGameOnPacificDate(game, targetDateKey) {
  const date = gameDate(game)
  if (!date || Number.isNaN(date.getTime())) return true
  return pacificDateKey(date) === targetDateKey
}

function balancedSlate(games, maxGames = 24) {
  const bySport = {
    NBA: games.filter(g => g.sport === 'NBA'),
    NHL: games.filter(g => g.sport === 'NHL'),
    MLB: games.filter(g => g.sport === 'MLB'),
  }

  const selected = []
  const seen = new Set()
  const add = (game) => {
    const key = `${game.sport}:${game.away}@${game.home}:${game.gameTime || game.commence_time || ''}`
    if (!seen.has(key)) {
      seen.add(key)
      selected.push(game)
    }
  }

  // Guarantee playoff sports make the slate when they are playing today.
  ;['NBA', 'NHL'].forEach(sport => bySport[sport].slice(0, 4).forEach(add))

  const remaining = rankGamesByDataQuality(
    [...games].sort((a, b) => (gameDate(a)?.getTime() || 0) - (gameDate(b)?.getTime() || 0))
  )

  for (const game of remaining) {
    if (selected.length >= maxGames) break
    add(game)
  }

  return selected.slice(0, maxGames)
}

async function generatePicks(games) {
  const now = new Date()
  const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const todayKey = pacificDateKey(now)
  
  const dated = games.filter(g => isGameOnPacificDate(g, todayKey))
  const bettable = filterBettableGames(dated)
  const todaysGames = balancedSlate(bettable)

  if (todaysGames.length === 0) {
    return { picksText: 'No bettable games with multi-book odds for today', slate: [] }
  }
  
  const contextBundle = await loadSportContextBundle()

  const gamesWithStats = await Promise.all(todaysGames.map(async g => {
    let stats = {}
    if (g.sport === 'MLB') {
      if (g.awayPitcherId) {
        const awayStats = await getPitcherStats(g.awayPitcherId)
        stats.awayPitcher = awayStats
      }
      if (g.homePitcherId) {
        const homeStats = await getPitcherStats(g.homePitcherId)
        stats.homePitcher = homeStats
      }
      if (g.awayId) stats.awayTeam = await getMLBStats(g.awayId, g.away)
      if (g.homeId) stats.homeTeam = await getMLBStats(g.homeId, g.home)
    }
    stats = applySportContext({ ...g, stats }, contextBundle)
    return enrichOdds({ ...g, stats })
  }))

  const slate = gamesWithStats.map(g => {
    let line = `${g.sport}: ${g.away} @ ${g.home}`
    if (g.venue) line += ` | ${g.venue}`
    if (g.venue) line += ` | Ballpark: ${ballparkInfo(g.venue)}`
    if (g.stats?.weatherReport) line += ` | Weather: ${g.stats.weatherReport}`
    else if (g.weather?.temp) line += ` | ${g.weather.temp}F ${g.weather.condition || ''} ${g.weather.wind || ''}`
    if (g.awayPitcher) line += ` | SP: ${g.awayPitcher} vs ${g.homePitcher || 'TBD'}`
    if (g.sport === 'NHL' && (g.stats?.awayGoalie || g.stats?.homeGoalie)) {
      line += ` | G: ${g.stats.awayGoalie || 'TBD'} vs ${g.stats.homeGoalie || 'TBD'}`
    }
    if (g.stats?.awayStanding?.record) line += ` | ${g.away} ${g.stats.awayStanding.record}`
    if (g.stats?.homeStanding?.record) line += ` | ${g.home} ${g.stats.homeStanding.record}`
    if (g.oddsSummary) line += ` | ${g.oddsSummary}`
    return line
  }).join('\n')

  const gameMap = gamesWithStats.map((g, idx) => ({
    index: idx,
    matchup: `${g.away} @ ${g.home}`,
    sport: g.sport,
    away: g.away,
    home: g.home,
    bestOdds: g.bestOdds,
    oddsSummary: g.oddsSummary || 'N/A',
  }))
  
  if (gameMap.length === 0) {
    return { picksText: 'No games found for today', slate: [] }
  }

  let statsContext = '=== REAL SEASON STATS, WEATHER, INJURIES (League + ESPN feeds) ===\n\n'
  gamesWithStats.forEach(g => {
    statsContext += appendGameStatsBlock(g, ballparkInfo)
  })

  const gameReference = gameMap.map(gm => `${gm.sport}: ${gm.matchup} | ${gm.oddsSummary}`).join('\n')

  const mlbAnalyses = analyzeMlbSlate(gamesWithStats)
  const mlbEnginePicks = selectMlbEnginePicks(mlbAnalyses, { max: 3 })
  const mlbEngineBlock = formatEngineBlockForPrompt(mlbAnalyses)
  const mlbPreselected = mlbEnginePicks.map(engineAnalysisToPick)

  const systemPrompt = `You are Vega, TrueOddsIQ's sports betting analyst. You must be precise, evidence-based, and honest about missing data. Never invent stats, injuries, line movement, public betting splits, or sharp-money claims.`

  const mlbEngineSection = mlbAnalyses.length
    ? `
VEGA MLB PROBABILITY ENGINE (authoritative for MLB sides — do NOT override BET/LEAN sides or odds):
${mlbEngineBlock}

MLB PRE-SELECTED ACTIONABLE PLAYS (only these MLB games may be published as picks):
${mlbPreselected.length
  ? mlbPreselected.map((p, i) => `${i + 1}. ${p.game} — ${p.recommendation} ${p.pickSelection} at ${p.odds} | Edge ${p.pickMeta.calculated_edge}%`).join('\n')
  : 'None — no MLB game cleared BET/LEAN thresholds today. Do NOT force an MLB pick.'}

MLB games marked PASS or AVOID must NOT appear as picks. Never pick based only on win probability — price must beat the market.
`
    : ''

  const prompt = `Today is ${date}.
${mlbEngineSection}
${statsContext}

${statsContext}
Today's slate (MLB, NBA, NHL):
${slate}

CRITICAL RULES:
1. ONLY cite stats you know for certain. NEVER make up statistics, estimates, player names, or team records.
2. For MLB: Cite pitcher ERA, K/9, WHIP, team records, weather, ballpark, and listed injuries from STATS.
3. For NBA: Cite team records, PPG/OPP PPG, home/road splits, last-10, streak, and injury report from STATS. For NHL: cite records, GF/GA, goalies, injuries, and home/road splits from STATS.
4. EVERY pick's Edge explanation MUST reference specific real information.
5. Use exact numbers. Avoid vague claims unless tied to supplied numbers.
6. If a game shows odds as "N/A" or no odds available, SKIP that game entirely.
7. Only pick games that have actual numerical odds in the reference list.
8. Cross-book odds ranges are NOT line movement. Do not call them steam, public money, or reverse line movement.
9. Prefer bets where the best available price is clearly listed with a book. Put that exact best book and price in the Bet line.
10. SPORT MIX: The slate can include MLB, NBA, and NHL on the same day. When NBA or NHL games appear in MATCHUP REFERENCE with valid odds, include at least one NBA or NHL pick among your 3. Do not choose only MLB picks when playoff basketball or hockey games are available with valid odds.

${PICK_METRICS_PROMPT_RULES}

MATCHUP REFERENCE (LIVE MULTI-BOOK ODDS):
${gameReference}

Output 0 to 3 actionable picks total — never force a pick when edge is insufficient.
- MLB: ONLY publish games from MLB PRE-SELECTED ACTIONABLE PLAYS above (BET or LEAN). Use the exact side and odds shown.
- NBA/NHL: Select only when you see a genuine price edge (confidence 4+). Include at least one NBA/NHL pick when playoff games are on the slate with valid odds and MLB pre-selections leave room.
- If no game qualifies, output zero picks and state "No qualifying plays today" — do not invent picks.

CRITICAL: Each pick MUST include:
1. Full matchup on its own line: "[Away Team] @ [Home Team]"
2. Your pick with actual odds and book from MATCHUP REFERENCE or MLB engine
3. Example matchup line: "Pirates @ Rockies"
4. If odds show as "N/A", skip that game and move to next
5. Moneyline picks must end in "ML" (example: "Dodgers ML"). Totals must include the number (example: "Under 8.5"). Spreads must include the number (example: "Yankees -1.5").
6. Add a line: "- Recommendation: BET or LEAN" (from engine for MLB; your assessment for NBA/NHL)
7. Never publish PASS or AVOID plays.

Format EXACTLY like this:

TOP PICK OF THE DAY
[Away Team] @ [Home Team]
**[SPORT] Pick: [Team/Total/Spread]**
- Bet: [type] at [odds] via [best book]
- Confidence: [rating out of 5]
- Edge: [4-6 sentences — full email write-up with specific stats, matchup context, and why this is the best bet today]

---

PICK #2
[Away Team] @ [Home Team]
**[SPORT] Pick: [Team/Total/Spread]**
- Bet: [type] at [odds] via [best book]
- Confidence: [rating out of 5]
- Edge: [2-3 sentences of specific analysis]

---

PICK #3
[Away Team] @ [Home Team]
**[SPORT] Pick: [Team/Total/Spread]**
- Bet: [type] at [odds] via [best book]
- Confidence: [rating out of 5]
- Edge: [2-3 sentences of specific analysis]

Only pick games with genuine edge vs the market price. Be specific with stats and reasoning. Output up to 3 picks — fewer is fine when edge is thin. Picks #2 and #3 are for Premium subscribers on the site; only the TOP PICK goes in the free newsletter email.`

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2200,
        temperature: 0.1,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!apiRes.ok) {
      console.error('Claude API error:', apiRes.status, apiRes.statusText)
      if (mlbPreselected.length) {
        return {
          picksText: buildFallbackPicksText(mlbPreselected),
          slate: gamesWithStats,
          mlbAnalyses: mlbAnalyses.map(a => a.analysis),
          mlbEnginePicks: mlbPreselected,
          engineFallback: true,
        }
      }
      return { picksText: '', slate: gamesWithStats, mlbAnalyses: [], mlbEnginePicks: [] }
    }

    const data = await apiRes.json()
    const picksText = data.content?.[0]?.text || ''
    return {
      picksText,
      slate: gamesWithStats,
      mlbAnalyses: mlbAnalyses.map(a => a.analysis),
      mlbEnginePicks: mlbPreselected,
    }
  } catch (err) {
    console.error('Claude API fetch error:', err.message)
    if (mlbPreselected.length) {
      return {
        picksText: buildFallbackPicksText(mlbPreselected),
        slate: gamesWithStats,
        mlbAnalyses: mlbAnalyses.map(a => a.analysis),
        mlbEnginePicks: mlbPreselected,
        engineFallback: true,
      }
    }
    return { picksText: '', slate: gamesWithStats, mlbAnalyses: [], mlbEnginePicks: [] }
  }
}

function buildFallbackPicksText(enginePicks) {
  const sections = enginePicks.map((pick, index) => {
    const header = index === 0 ? 'TOP PICK OF THE DAY' : `PICK #${index + 1}`
    return `${header}
${pick.game}
**MLB Pick: ${pick.pickSelection}**
- Bet: ${pick.bet}
- Recommendation: ${pick.recommendation}
- Confidence: ${pick.confidence}/5
- Edge: ${pick.edge}`
  })
  return sections.join('\n\n---\n\n')
}

export { getTodaysGames, generatePicks }
