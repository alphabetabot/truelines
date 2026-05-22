import { Resend } from 'resend'
import { postTweet } from './post-to-x.js'
import { getSupabase } from './supabase-client.js'
import { extractPicksFromResponse, storePicks } from './store-picks.js'
import { buildOddsByMatchup, buildEmailFromPicks, formatTopPickSocial } from './pick-utils.js'
import { sendNewsletterToSubscribers } from './send-newsletter.js'

const resend = new Resend(process.env.RESEND_API_KEY)

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
  } catch (e) {
    return { wins: 0, losses: 0, runDiff: 0 }
  }
}

async function getPitcherStats(pitcherId, pitcherName) {
  try {
    const res = await fetch(`https://statsapi.mlb.com/api/v1/people/${pitcherId}`)
    const data = await res.json()
    if (data.stats && data.stats.length > 0) {
      const stats = data.stats[0].stats || {}
      return {
        era: stats.era ? parseFloat(stats.era).toFixed(2) : 'N/A',
        wins: stats.wins || 0,
        losses: stats.losses || 0,
        ip: stats.inningsPitched || 0,
        k9: stats.strikeOutsPer9Inn ? parseFloat(stats.strikeOutsPer9Inn).toFixed(1) : 'N/A',
        whip: stats.whip ? parseFloat(stats.whip).toFixed(2) : 'N/A',
      }
    }
    return { era: 'N/A', wins: 0, losses: 0, ip: 0, k9: 'N/A', whip: 'N/A' }
  } catch (e) {
    return { era: 'N/A', wins: 0, losses: 0, ip: 0, k9: 'N/A', whip: 'N/A' }
  }
}

async function getTodaysGames() {
  const today = new Date().toISOString().split('T')[0]
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
  } catch (e) { console.warn('MLB fetch failed') }

  try {
    const mlbOddsRes = await fetch(`https://api.the-odds-api.com/v4/sports/baseball_mlb/odds?apiKey=${process.env.VITE_ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm`)
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
  } catch (e) { console.warn('MLB odds fetch failed') }

  try {
    const nbaRes = await fetch(`https://api.the-odds-api.com/v4/sports/basketball_nba/odds?apiKey=${process.env.VITE_ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm`)
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
  } catch (e) { console.warn('NBA fetch failed') }

  try {
    const nhlRes = await fetch(`https://api.the-odds-api.com/v4/sports/icehockey_nhl/odds?apiKey=${process.env.VITE_ODDS_API_KEY}&regions=us&markets=h2h,totals&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm`)
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
  } catch (e) { console.warn('NHL fetch failed') }

  return games
}

async function generatePicks(games) {
  const now = new Date()
  const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const tomorrowStart = new Date(todayStart.getTime() + 86400000)
  
  const todaysGames = games.filter(g => {
    if (g.sport === 'MLB' && g.gameTime) {
      const gTime = new Date(g.gameTime)
      return gTime >= todayStart && gTime < tomorrowStart
    }
    if (g.commence_time) {
      const gTime = new Date(g.commence_time)
      return gTime >= todayStart && gTime < tomorrowStart
    }
    return true
  })
  
  const gamesWithStats = await Promise.all(todaysGames.slice(0, 15).map(async g => {
    const stats = {}
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
    if (g.sport === 'NBA' || g.sport === 'NHL') {
      stats.note = 'Use Vegas odds and team names below for analysis'
    }
    return { ...g, stats }
  }))
  
  gamesWithStats.forEach(g => {
    const dk = g.bookmakers?.find(b => b.key === 'draftkings')
    if (!dk) return

    const h2h = dk.markets?.find(m => m.key === 'h2h')
    if (h2h) {
      const a = h2h.outcomes?.find(o => o.name === g.away)
      const h = h2h.outcomes?.find(o => o.name === g.home)
      if (a && h) {
        g.dkAwayML = a.price
        g.dkHomeML = h.price
      }
    }
    const spreads = dk.markets?.find(m => m.key === 'spreads')
    if (spreads) {
      const a = spreads.outcomes?.find(o => o.name === g.away)
      const h = spreads.outcomes?.find(o => o.name === g.home)
      if (a) {
        g.dkAwaySpread = a.point
        g.dkAwaySpreadOdds = a.price
      }
      if (h) {
        g.dkHomeSpread = h.point
        g.dkHomeSpreadOdds = h.price
      }
    }
    const tot = dk.markets?.find(m => m.key === 'totals')
    if (tot) {
      const ov = tot.outcomes?.find(o => o.name === 'Over')
      const un = tot.outcomes?.find(o => o.name === 'Under')
      if (ov) {
        g.dkTotal = ov.point
        g.dkOverOdds = ov.price
      }
      if (un) g.dkUnderOdds = un.price
    }
  })

  const slate = gamesWithStats.map(g => {
    let line = `${g.sport}: ${g.away} @ ${g.home}`
    if (g.venue) line += ` | ${g.venue}`
    if (g.weather?.temp) line += ` | ${g.weather.temp}F ${g.weather.condition || ''} ${g.weather.wind || ''}`
    if (g.awayPitcher) line += ` | SP: ${g.awayPitcher} vs ${g.homePitcher || 'TBD'}`
    if (g.dkAwayML && g.dkHomeML) {
      line += ` | ML: ${g.dkAwayML > 0 ? '+' : ''}${g.dkAwayML}/${g.dkHomeML > 0 ? '+' : ''}${g.dkHomeML}`
    }
    if (g.dkTotal) {
      line += ` | O/U: ${g.dkTotal}`
    }
    if (g.dkAwaySpread != null) {
      line += ` | Spread: ${g.dkAwaySpread > 0 ? '+' : ''}${g.dkAwaySpread}/${g.dkHomeSpread > 0 ? '+' : ''}${g.dkHomeSpread}`
    }
    return line
  }).join('\n')

  const gameMap = gamesWithStats.map((g, idx) => ({
    index: idx,
    matchup: `${g.away} @ ${g.home}`,
    sport: g.sport,
    away: g.away,
    home: g.home,
    dkAwayML: g.dkAwayML || 'N/A',
    dkHomeML: g.dkHomeML || 'N/A',
    dkAwaySpread: g.dkAwaySpread ?? 'N/A',
    dkTotal: g.dkTotal ?? 'N/A',
  }))
  
  if (gameMap.length === 0) {
    return 'No games found for today'
  }

  let statsContext = '=== REAL 2026 SEASON STATS (Official League APIs) ===\n\n'
  gamesWithStats.forEach(g => {
    statsContext += `${g.sport}: ${g.away} @ ${g.home}\n`
    if (g.stats?.awayPitcher && g.awayPitcher) {
      statsContext += `  Away SP ${g.awayPitcher}: ERA ${g.stats.awayPitcher.era} | K/9 ${g.stats.awayPitcher.k9} | WHIP ${g.stats.awayPitcher.whip}\n`
    }
    if (g.stats?.homePitcher && g.homePitcher) {
      statsContext += `  Home SP ${g.homePitcher}: ERA ${g.stats.homePitcher.era} | K/9 ${g.stats.homePitcher.k9} | WHIP ${g.stats.homePitcher.whip}\n`
    }
    if (g.stats?.awayTeam) {
      statsContext += `  ${g.away}: ${g.stats.awayTeam.wins}W-${g.stats.awayTeam.losses}L (${(g.stats.awayTeam.runDiff >= 0 ? '+' : '')}${g.stats.awayTeam.runDiff} run diff)\n`
    }
    if (g.stats?.homeTeam) {
      statsContext += `  ${g.home}: ${g.stats.homeTeam.wins}W-${g.stats.homeTeam.losses}L (${(g.stats.homeTeam.runDiff >= 0 ? '+' : '')}${g.stats.homeTeam.runDiff} run diff)\n`
    }
    statsContext += '\n'
  })

  const gameReference = gameMap.map(gm => {
    let ref = `${gm.sport}: ${gm.matchup} | DK ML: ${gm.away} ${gm.dkAwayML > 0 ? '+' : ''}${gm.dkAwayML} / ${gm.home} ${gm.dkHomeML > 0 ? '+' : ''}${gm.dkHomeML}`
    if (gm.dkAwaySpread !== 'N/A') ref += ` | DK Spread: ${gm.dkAwaySpread}/${gm.dkHomeSpread}`
    if (gm.dkTotal !== 'N/A') ref += ` | DK Total: ${gm.dkTotal}`
    return ref
  }).join('\n')

  const prompt = `You are Vega, TrueOddsIQ's elite AI sports betting analyst. Today is ${date}.

${statsContext}
Today's slate (MLB, NBA, NHL):
${slate}

CRITICAL RULES:
1. ONLY cite stats you know for certain. NEVER make up statistics, estimates, player names, or team records.
2. For MLB: Cite pitcher ERA, K/9, WHIP, and team win/loss records from the stats provided.
3. For NBA/NHL: Cite Vegas odds and matchup dynamics. If you don't know a team's record, say "record not provided" instead of guessing.
4. EVERY pick's Edge explanation MUST be at least 2 full sentences with specific stats or odds from the data provided — no vague hype.
5. Use exact numbers. No vague claims ("elite," "strong," "good"). Be specific.
6. If a game shows odds as "N/A" or no odds available, SKIP that game entirely.
7. Only pick games that have actual DraftKings numerical odds in the reference list.
8. Use "via DraftKings" on every Bet line. Odds will be verified against DraftKings automatically.

MATCHUP REFERENCE (LIVE ODDS):
${gameReference}

Give exactly 3 picks plus 1 fade. Always lead with your single best bet clearly marked.

CRITICAL: Each pick MUST include:
1. Full matchup on its own line: "[Away Team] @ [Home Team]"
2. Your pick with actual odds IF AVAILABLE
3. Example matchup line: "Pirates @ Rockies"
4. If odds show as "N/A", skip that game and move to next

Format EXACTLY like this:

TOP PICK OF THE DAY
[Away Team] @ [Home Team]
**[SPORT] Pick: [Team/Total/Spread]**
- Bet: [type] at [odds] via DraftKings
- Confidence: [rating out of 5]
- Edge: [2-3 sentences of specific analysis]

---

PICK #2
[Away Team] @ [Home Team]
**[SPORT] Pick: [Team/Total/Spread]**
- Bet: [type] at [odds] via DraftKings
- Confidence: [rating out of 5]
- Edge: [2-3 sentences of specific analysis]

---

PICK #3
[Away Team] @ [Home Team]
**[SPORT] Pick: [Team/Total/Spread]**
- Bet: [type] at [odds] via DraftKings
- Confidence: [rating out of 5]
- Edge: [2-3 sentences of specific analysis]

---

FADE OF THE DAY
[Away Team] @ [Home Team]
**[SPORT]: [Team/Total to avoid]**
- Why: [reason the public is wrong on this one]

Only pick games with genuine edge. Be specific with stats and reasoning.`

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
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!apiRes.ok) {
      console.error('Claude API error:', apiRes.status, apiRes.statusText)
      return ''
    }

    const data = await apiRes.json()
    return data.content?.[0]?.text || ''
  } catch (err) {
    console.error('Claude API fetch error:', err.message)
    return ''
  }
}

export default async function handler(req, res) {
  const secret = req.headers['x-newsletter-secret']
  const isVercelCron = req.headers['authorization'] === `Bearer ${process.env.CRON_SECRET}`

  if (!isVercelCron && secret !== process.env.NEWSLETTER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    const games = await getTodaysGames()
    if (!games.length) return res.json({ sent: 0, message: 'No games today' })

    const oddsByMatchup = buildOddsByMatchup(games)
    const picksText = await generatePicks(games)
    
    if (!picksText || picksText.trim().length < 100) {
      console.warn('No valid picks generated')
      return res.json({ sent: 0, message: 'No picks generated' })
    }
    
    if (picksText.includes('cannot responsibly') || picksText.includes('cannot generate') || picksText.includes('insufficient data')) {
      console.warn('Claude refused picks')
      return res.json({ sent: 0, message: 'Claude refused to generate picks' })
    }
    
    let stored = []
    try {
      const rawPicks = extractPicksFromResponse(picksText)
      console.log(`Extracted ${rawPicks.length} picks from Claude response`)
      stored = await storePicks(rawPicks, new Date(), oddsByMatchup)
      console.log(`Stored ${stored.length} valid picks (DK odds + edge validated)`)
    } catch (storageErr) {
      console.warn('Failed to store picks:', storageErr.message)
      return res.json({ sent: 0, message: 'Failed to store valid picks', error: storageErr.message })
    }

    if (!stored.length) {
      console.warn('No valid picks after DK/edge validation. Raw (first 500):', picksText.slice(0, 500))
      return res.json({ sent: 0, message: 'No valid picks to send (missing DK odds or edge)' })
    }

    const html = buildEmailFromPicks(stored, date)

    const { data: subscribers, error } = await getSupabase()
      .from('newsletter_subscribers')
      .select('email')
      .eq('active', true)

    if (error) throw error
    if (!subscribers?.length) {
      return res.json({ sent: 0, message: 'No subscribers yet', stored: stored.length })
    }

    const emails = subscribers.map(s => s.email)
    const subject = `TrueOddsIQ Daily Picks — ${date}`
    const sent = await sendNewsletterToSubscribers(resend, emails, { subject, html })

    const top = stored[0]
    const { pickLine, betLine, edgeLine, hasPicks } = formatTopPickSocial(top, date)

    try {
      if (hasPicks) {
        const tgMessage = `TOP PICK — ${date}\n\n${top.game}\n${pickLine}\n${betLine}\n\n${edgeLine}\n\nFull analysis: trueoddsiq.com/picks\n\n#SportsBetting #VegaPicks`
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
      if (hasPicks) {
        const tweet = `TOP PICK — ${date}\n\n${pickLine}\n${betLine}\n\n${edgeLine}\n\ntrueoddsiq.com/picks\n\n#SportsBetting #VegaPicks`.slice(0, 280)
        await postTweet(tweet)
      }
    } catch (tweetErr) {
      console.warn('X post failed:', tweetErr.message)
    }

    return res.json({ sent, message: `Sent to ${sent} subscribers`, stored: stored.length })
  } catch (err) {
    console.error('Newsletter error:', err)
    return res.status(500).json({ error: err.message })
  }
}
