import { Resend } from 'resend'
import { postTweet } from './post-to-x.js'
import { getSupabase } from './supabase-client.js'
import { extractPicksFromResponse, storePicks } from './store-picks.js'
import { sendNewsletterEmail, unsubscribeUrl } from './newsletter-utils.js'
import {
  NEWSLETTER_CRON_SCHEDULE,
  claimDailyNewsletterSend,
  completeNewsletterSend,
  getPacificDateKey,
  releaseNewsletterClaim,
  uniqueSubscriberEmails,
} from './newsletter-send-guard.js'
import {
  PICK_METRICS_PROMPT_RULES,
  filterBettableGames,
  rankGamesByDataQuality,
  validatePicksAgainstSlate,
} from './pick-metrics.js'
import {
  appendGameStatsBlock,
  applySportContext,
  loadSportContextBundle,
} from './sport-context.js'

const resend = new Resend(process.env.RESEND_API_KEY)
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
        k9: stats.strikeoutsPer9Inn ? parseFloat(stats.strikeoutsPer9Inn).toFixed(1) : 'N/A',
        whip: stats.whip ? parseFloat(stats.whip).toFixed(2) : 'N/A',
        oppAvg: stats.avg || 'N/A',
        hr9: stats.homeRunsPer9 ? parseFloat(stats.homeRunsPer9).toFixed(1) : 'N/A',
      }
    }
    return { era: 'N/A', wins: 0, losses: 0, ip: 0, k9: 'N/A', whip: 'N/A', oppAvg: 'N/A', hr9: 'N/A' }
  } catch {
    console.warn(`Pitcher stats fetch failed for ${pitcherName || pitcherId}`)
    return { era: 'N/A', wins: 0, losses: 0, ip: 0, k9: 'N/A', whip: 'N/A', oppAvg: 'N/A', hr9: 'N/A' }
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

  const systemPrompt = `You are Vega, TrueOddsIQ's sports betting analyst. You must be precise, evidence-based, and honest about missing data. Never invent stats, injuries, line movement, public betting splits, or sharp-money claims.`

  const prompt = `Today is ${date}.

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

Give exactly 3 picks to BET (not fades or passes). Always lead with your single best bet clearly marked.

CRITICAL: Each pick MUST include:
1. Full matchup on its own line: "[Away Team] @ [Home Team]"
2. Your pick with actual odds and book from MATCHUP REFERENCE
3. Example matchup line: "Pirates @ Rockies"
4. If odds show as "N/A", skip that game and move to next
5. Moneyline picks must end in "ML" (example: "Dodgers ML"). Totals must include the number (example: "Under 8.5"). Spreads must include the number (example: "Yankees -1.5").
6. Every pick is an actionable bet to place — never list a "fade", "avoid", or "pass" section.

Format EXACTLY like this:

TOP PICK OF THE DAY
[Away Team] @ [Home Team]
**[SPORT] Pick: [Team/Total/Spread]**
- Bet: [type] at [odds] via [best book]
- Confidence: [rating out of 5]
- Edge: [2-3 sentences of specific analysis]

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

Only pick games with genuine edge. Be specific with stats and reasoning. Output exactly 3 picks — no fourth section.`

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
      return { picksText: '', slate: gamesWithStats }
    }

    const data = await apiRes.json()
    return {
      picksText: data.content?.[0]?.text || '',
      slate: gamesWithStats,
    }
  } catch (err) {
    console.error('Claude API fetch error:', err.message)
    return { picksText: '', slate: gamesWithStats }
  }
}

function buildEmail(picksText, date, unsubscribeHref = 'https://trueoddsiq.com/unsubscribe') {
  const lines = picksText.split('\n').map(line => {
    if (line.includes('@') && line.includes('→')) {
      const [matchup, pick] = line.split('→')
      return `<div style="background:#f1f5f9;border-left:3px solid #f59e0b;padding:12px 14px;border-radius:6px;margin:12px 0;">
        <p style="margin:0 0 4px;font-size:14px;color:#0f172a;font-weight:600;">${matchup.trim()}</p>
        <p style="margin:0;font-size:15px;color:#f59e0b;font-weight:700;">${pick.trim()}</p>
      </div>`
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      const t = line.slice(2, -2)
      const color = '#f59e0b'
      return `<p style="font-weight:900;font-size:16px;color:${color};margin:20px 0 6px;">${t}</p>`
    }
    if (line.startsWith('- ')) {
      const content = line.slice(2)
      const highlighted = content.replace(/([+-]\d+)/g, '<span style="color:#f59e0b;font-weight:700;">$1</span>')
      return `<p style="margin:3px 0;padding-left:14px;color:#475569;font-size:14px;">• ${highlighted}</p>`
    }
    if (!line.trim()) return '<div style="height:8px"></div>'
    return `<p style="margin:3px 0;color:#475569;font-size:14px;">${line}</p>`
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#0f172a;border-radius:16px 16px 0 0;padding:24px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:26px;font-weight:900;">TrueOdds<span style="color:#f59e0b;">IQ</span></h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">Daily AI Picks | ${date} | MLB | NBA | NHL</p>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;">
    <div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:12px 14px;border-radius:6px;margin-bottom:16px;font-size:12px;color:#92400e;line-height:1.6;">
      <strong>Odds from DraftKings as of ${date}:</strong> These picks use live DraftKings odds. Shop other books (FanDuel, BetMGM, Caesars) for better lines. AI-generated for informational purposes only. Always bet responsibly. Must be 21+.
    </div>
    ${lines}
    <div style="text-align:center;margin-top:24px;">
      <a href="https://trueoddsiq.com/picks" style="background:#0f172a;color:#fff;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;display:inline-block;">View Full Analysis and Live Odds</a>
    </div>
  </div>
  <div style="background:#f8fafc;border-radius:0 0 16px 16px;padding:14px;text-align:center;border:1px solid #e2e8f0;border-top:none;">
    <p style="margin:0;color:#94a3b8;font-size:11px;">TrueOddsIQ | trueoddsiq.com | Must be 21+ | Gambling problem? <a href="tel:18004264537" style="color:#16a34a;">1-800-GAMBLER</a></p>
    <p style="margin:4px 0 0;"><a href="${unsubscribeHref}" style="color:#94a3b8;font-size:11px;">Unsubscribe</a></p>
  </div>
</div></body></html>`
}

export default async function handler(req, res) {
  const secret = req.headers['x-newsletter-secret']
  const isVercelCron = req.headers['authorization'] === `Bearer ${process.env.CRON_SECRET}`
  const forceSend = req.query?.force === 'true' || req.body?.force === true

  if (!isVercelCron && secret !== process.env.NEWSLETTER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const todayKey = getPacificDateKey(new Date())
  const cronSchedule = req.headers['x-vercel-cron-schedule'] || null
  let claimedSend = false
  let emailsDelivered = 0

  // Block cron-job.org / manual hits — only Vercel 0 14 UTC (or ?force=true for recovery).
  if (!forceSend && !isVercelCron) {
    return res.json({
      sent: 0,
      skipped: true,
      reason: 'external_trigger_disabled',
      message:
        'Daily newsletter only runs via Vercel cron (0 14 UTC, ~7 AM Pacific). Remove duplicate newsletter jobs on cron-job.org.',
    })
  }

  if (isVercelCron && !forceSend && cronSchedule && cronSchedule !== NEWSLETTER_CRON_SCHEDULE) {
    console.warn(`Ignoring newsletter cron on unexpected schedule: ${cronSchedule}`)
    return res.json({
      sent: 0,
      skipped: true,
      reason: 'unexpected_cron_schedule',
      schedule: cronSchedule,
      expected: NEWSLETTER_CRON_SCHEDULE,
      message:
        'Duplicate or legacy cron schedule blocked (e.g. 0 15 UTC). Delete extra newsletter crons in Vercel → Settings → Cron Jobs.',
    })
  }

  if (!forceSend) {
    const claim = await claimDailyNewsletterSend(getSupabase(), todayKey, { cronSchedule })
    if (!claim.claimed) {
      const message =
        claim.reason === 'already_sent_today'
          ? 'Newsletter already sent today — duplicate run skipped'
          : claim.reason === 'send_in_progress'
            ? 'Newsletter send already in progress — duplicate run skipped'
            : claim.reason === 'table_missing'
              ? 'Newsletter dedup table missing — run create-newsletter-send-log.sql in Supabase'
              : 'Newsletter not claimed'
      console.log(`Newsletter claim skipped for ${todayKey}:`, claim.reason, cronSchedule)
      if (claim.tableMissing) {
        return res.status(503).json({
          sent: 0,
          error: 'newsletter_daily_sends table missing',
          message,
          date: todayKey,
        })
      }
      return res.json({
        sent: 0,
        skipped: true,
        reason: claim.reason || 'not_claimed',
        date: todayKey,
        cronSchedule,
        sentAt: claim.sentAt,
        message,
      })
    }
    claimedSend = true
  }

  let picksText = ''

  try {
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    const games = await getTodaysGames()
    if (!games.length) return res.json({ sent: 0, message: 'No games today' })

    const generated = await generatePicks(games)
    picksText = typeof generated === 'string' ? generated : generated.picksText
    const slate = typeof generated === 'string' ? [] : generated.slate || []

    if (!picksText || picksText.trim().length < 100) {
      console.warn('No valid picks generated')
      return res.json({ sent: 0, message: 'No picks generated' })
    }

    if (picksText.includes('cannot responsibly') || picksText.includes('cannot generate') || picksText.includes('insufficient data')) {
      console.warn('Claude refused picks')
      return res.json({ sent: 0, message: 'Claude refused to generate picks' })
    }

    const extracted = extractPicksFromResponse(picksText).filter(p => !p.isFade)
    const { picks: validated, warnings } = validatePicksAgainstSlate(extracted, slate)
    if (warnings.length) console.warn('Pick validation warnings:', warnings.join(' | '))

    const picks = validated.slice(0, 3)
    console.log(`Extracted ${extracted.length} picks, ${picks.length} passed metrics validation`)

    if (picks.length < 3) {
      console.error('No picks extracted. Raw response (first 500 chars):', picksText.slice(0, 500))
      return res.status(500).json({
        error: 'Too few picks extracted from generated newsletter',
        picksPreview: picksText.slice(0, 500),
      })
    }

    let storedPicks = []
    try {
      storedPicks = await storePicks(picks, new Date())
    } catch (storageErr) {
      console.error('Failed to store picks:', storageErr.message)
      return res.status(500).json({
        error: 'Failed to store generated picks',
        detail: storageErr.message,
        extracted: picks.length,
      })
    }

    if (storedPicks.length === 0) {
      console.error('Store completed without returning saved pick rows')
      return res.status(500).json({
        error: 'Generated picks were not stored',
        extracted: picks.length,
        stored: 0,
      })
    }
    
    const { data: subscribers, error } = await getSupabase()
      .from('newsletter_subscribers')
      .select('email')
      .eq('active', true)

    if (error) throw error
    if (!subscribers?.length) {
      if (claimedSend) await releaseNewsletterClaim(getSupabase(), todayKey)
      return res.json({ sent: 0, message: 'No subscribers yet', picks: picksText, stored: storedPicks.length })
    }

    const emails = uniqueSubscriberEmails(subscribers)
    let sent = 0
    const sendErrors = []

    for (const email of emails) {
      try {
        await sendNewsletterEmail({
          resend,
          to: email,
          subject: `TrueOddsIQ Daily Picks — ${date}`,
          html: buildEmail(picksText, date, unsubscribeUrl(email)),
          text: `TrueOddsIQ Daily Picks - ${date}\n\nView picks: https://trueoddsiq.com/picks\nUnsubscribe: ${unsubscribeUrl(email)}`,
        })
        sent++
        emailsDelivered++
      } catch (sendErr) {
        console.error(`Newsletter send failed for ${email}:`, sendErr.message)
        sendErrors.push({ email, error: sendErr.message })
      }
    }

    if (emailsDelivered > 0) {
      const recorded = await completeNewsletterSend(getSupabase(), todayKey, sent, picksText)
      claimedSend = false
      if (!recorded) {
        console.error('Newsletter sent but newsletter_daily_sends update failed — dedup may break tomorrow')
      }
    }

    if (sendErrors.length) {
      if (claimedSend && emailsDelivered === 0) {
        await releaseNewsletterClaim(getSupabase(), todayKey)
      }
      return res.status(502).json({
        error: 'One or more newsletter emails failed to send',
        sent,
        failed: sendErrors.length,
        failures: sendErrors.slice(0, 10),
        stored: storedPicks.length,
        dedupRecorded: emailsDelivered > 0,
      })
    }

    const topPickSection = picksText.split('---')[0] || picksText
    const pickLine = topPickSection.match(/\*\*(.+Pick.+?)\*\*/)?.[1]?.trim() || ''
    const edgeLine = topPickSection.match(/- Edge: (.+)/)?.[1]?.trim() || ''
    const betLine = topPickSection.match(/- Bet: (.+)/)?.[1]?.trim() || ''
    const hasPicks = pickLine && betLine

    try {
      if (hasPicks && pickLine) {
        const tgMessage = `TOP PICK — ${date}\n\n ${pickLine}\n ${betLine}\n\n ${edgeLine}\n\nFull analysis: trueoddsiq.com/picks\n\n#SportsBetting #VegaPicks`
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHANNEL_ID, text: tgMessage })
        })
      }
    } catch (tgErr) {
      console.warn('Telegram post failed:', tgErr.message)
    }

    try {
      if (hasPicks && pickLine) {
        const tweet = `TOP PICK — ${date}\n\n${pickLine}\n${betLine}\n\n${edgeLine}\n\nFull analysis: trueoddsiq.com/picks\n\n#SportsBetting #VegaPicks`.slice(0, 280)
        await postTweet(tweet)
      }
    } catch (tweetErr) {
      console.warn('X post failed:', tweetErr.message)
    }

    return res.json({ sent, date: todayKey, message: `Sent to ${sent} subscribers`, picks: picksText, stored: storedPicks.length })
  } catch (err) {
    if (claimedSend && emailsDelivered === 0) {
      await releaseNewsletterClaim(getSupabase(), todayKey)
    } else if (emailsDelivered > 0) {
      await completeNewsletterSend(getSupabase(), todayKey, emailsDelivered, picksText)
    }
    console.error('Newsletter error:', err)
    return res.status(500).json({ error: err.message, emailsDelivered })
  }
}
