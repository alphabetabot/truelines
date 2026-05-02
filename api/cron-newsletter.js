import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { postTweet } from './post-to-x.js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function getMLBStats(teamId) {
  try {
    const res = await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}?hydrate=record`)
    const data = await res.json()
    return {
      wins: data.record?.[0]?.wins || 0,
      losses: data.record?.[0]?.losses || 0,
      runDiff: data.record?.[0]?.runDifferential || 0,
    }
  } catch (e) {
    return { wins: 0, losses: 0, runDiff: 0 }
  }
}

async function getPitcherStats(pitcherId) {
  try {
    const res = await fetch(`https://statsapi.mlb.com/api/v1/people/${pitcherId}?hydrate=stats(type=season)`)
    const data = await res.json()
    const stats = data.stats?.[0]?.stats || {}
    return {
      era: (stats.era || 'N/A').toFixed(2),
      wins: stats.wins || 0,
      losses: stats.losses || 0,
      ip: stats.inningsPitched || 0,
      k9: stats.strikeOutsPer9Inn ? (stats.strikeOutsPer9Inn).toFixed(1) : 'N/A',
      whip: stats.whip ? (stats.whip).toFixed(2) : 'N/A',
    }
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
  
  // Filter to only games that start today (after now, before midnight)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const tomorrowStart = new Date(todayStart.getTime() + 86400000)
  
  const todaysGames = games.filter(g => {
    if (g.sport === 'MLB' && g.gameTime) {
      const gTime = new Date(g.gameTime)
      return gTime >= todayStart && gTime < tomorrowStart
    }
    // For NBA/NHL from The Odds API, check commence_time
    if (g.commence_time) {
      const gTime = new Date(g.commence_time)
      return gTime >= todayStart && gTime < tomorrowStart
    }
    // If no time available, include it (safer than excluding)
    return true
  })
  
  // Fetch stats for each game (MLB pitchers + teams, NBA/NHL teams)
  const gamesWithStats = await Promise.all(todaysGames.slice(0, 10).map(async g => {
    const stats = {}
    if (g.sport === 'MLB') {
      // Fetch pitcher stats
      if (g.awayPitcherId) {
        const awayStats = await getPitcherStats(g.awayPitcherId)
        stats.awayPitcher = awayStats
      }
      if (g.homePitcherId) {
        const homeStats = await getPitcherStats(g.homePitcherId)
        stats.homePitcher = homeStats
      }
      // Fetch team records
      if (g.awayId) stats.awayTeam = await getMLBStats(g.awayId)
      if (g.homeId) stats.homeTeam = await getMLBStats(g.homeId)
    }
    return { ...g, stats }
  }))
  
  const slate = gamesWithStats.map(g => {
    let line = `${g.sport}: ${g.away} @ ${g.home}`
    if (g.venue) line += ` | ${g.venue}`
    if (g.weather?.temp) line += ` | ${g.weather.temp}°F ${g.weather.condition || ''} ${g.weather.wind || ''}`
    if (g.awayPitcher) line += ` | SP: ${g.awayPitcher} vs ${g.homePitcher || 'TBD'}`
    if (g.bookmakers?.length) {
      const dk = g.bookmakers.find(b => b.key === 'draftkings')
      if (dk) {
        const h2h = dk.markets?.find(m => m.key === 'h2h')
        const tot = dk.markets?.find(m => m.key === 'totals')
        if (h2h) {
          const a = h2h.outcomes?.find(o => o.name === g.away)
          const h = h2h.outcomes?.find(o => o.name === g.home)
          if (a && h) line += ` | ML: ${a.price > 0 ? '+' : ''}${a.price}/${h.price > 0 ? '+' : ''}${h.price}`
        }
        if (tot) {
          const ov = tot.outcomes?.find(o => o.name === 'Over')
          if (ov) line += ` | O/U: ${ov.point}`
        }
      }
    }
    return line
  }).join('\n')

  // Build detailed stats context for Claude — REAL 2026 DATA ONLY
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

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are Vega, TrueOddsIQ's elite AI sports betting analyst. Today is ${date}.

${statsContext}
Today's slate (MLB, NBA, NHL):
${slate}

⚠️ CRITICAL INTEGRITY RULES:
1. ONLY cite the real stats provided above. NEVER make up statistics, estimates, or guesses.
2. EVERY pick's Edge explanation MUST cite at least 2 specific real stats with exact numbers.
   Example: "ERA is 2.89, K/9 is 10.2, therefore the edge is..."
3. If you don't have stats for a matchup, say "insufficient data" instead of fabricating numbers.
4. Use exact numbers. No vague claims ("elite," "strong," "good"). Be specific.
5. If analyzing a player or team where stats aren't provided, acknowledge that limitation.

Give exactly 3 picks plus 1 fade. Always lead with your single best bet clearly marked.

Format EXACTLY like this:

🏆 TOP PICK OF THE DAY
**[SPORT] Pick: [Team/Total/Spread]**
- Bet: [type] at [odds] via [best book]
- Confidence: [⭐ rating out of 5]
- Edge: [2-3 sentences of specific analysis]

---

📌 PICK #2
**[SPORT] Pick: [Team/Total/Spread]**
- Bet: [type] at [odds] via [best book]
- Confidence: [⭐ rating out of 5]
- Edge: [2-3 sentences of specific analysis]

---

📌 PICK #3
**[SPORT] Pick: [Team/Total/Spread]**
- Bet: [type] at [odds] via [best book]
- Confidence: [⭐ rating out of 5]
- Edge: [2-3 sentences of specific analysis]

---

❌ FADE OF THE DAY
**[SPORT]: [Team/Total to avoid]**
- Why: [reason the public is wrong on this one]

Only pick games with genuine edge. Be specific with stats and reasoning.`
      }],
    }),
  })
  const data = await res.json()
  return data.content?.[0]?.text || 'Check trueoddsiq.com for today\'s picks.'
}

function buildEmail(picksText, date) {
  const lines = picksText.split('\n').map(line => {
    if (line.startsWith('**') && line.endsWith('**')) {
      const t = line.slice(2, -2)
      const color = t.includes('Fade') ? '#ef4444' : '#f59e0b'
      return `<p style="font-weight:900;font-size:16px;color:${color};margin:20px 0 6px;">${t}</p>`
    }
    if (line.startsWith('- ')) return `<p style="margin:3px 0;padding-left:14px;color:#475569;font-size:14px;">• ${line.slice(2)}</p>`
    if (!line.trim()) return '<div style="height:8px"></div>'
    return `<p style="margin:3px 0;color:#475569;font-size:14px;">${line}</p>`
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#0f172a;border-radius:16px 16px 0 0;padding:24px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:26px;font-weight:900;">TrueOdds<span style="color:#f59e0b;">IQ</span></h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">Daily AI Picks · ${date} · MLB · NBA · NHL</p>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;">
    <div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:12px 14px;border-radius:6px;margin-bottom:16px;font-size:12px;color:#92400e;line-height:1.6;">
      <strong>⚠️ Important Disclaimer:</strong> The picks and analysis in this newsletter are generated by artificial intelligence and are provided for informational and entertainment purposes only. Past performance does not guarantee future results. TrueOddsIQ assumes no liability for any wagering decisions made based on this content. Always bet within your means. Must be 21+ and located in a jurisdiction where sports betting is legal.
    </div>
    ${lines}
    <div style="text-align:center;margin-top:24px;">
      <a href="https://trueoddsiq.com/picks" style="background:#0f172a;color:#fff;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;display:inline-block;">View Full Analysis & Live Odds →</a>
    </div>
  </div>
  <div style="background:#f8fafc;border-radius:0 0 16px 16px;padding:14px;text-align:center;border:1px solid #e2e8f0;border-top:none;">
    <p style="margin:0;color:#94a3b8;font-size:11px;">TrueOddsIQ · trueoddsiq.com · Must be 21+ · Gambling problem? <a href="tel:18004264537" style="color:#16a34a;">1-800-GAMBLER</a></p>
    <p style="margin:4px 0 0;"><a href="https://trueoddsiq.com/unsubscribe" style="color:#94a3b8;font-size:11px;">Unsubscribe</a></p>
  </div>
</div></body></html>`
}

export default async function handler(req, res) {
  // Allow Vercel cron (no auth header) or manual trigger with secret
  const secret = req.headers['x-newsletter-secret']
  const isVercelCron = req.headers['authorization'] === `Bearer ${process.env.CRON_SECRET}`

  if (!isVercelCron && secret !== process.env.NEWSLETTER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    const games = await getTodaysGames()
    if (!games.length) return res.json({ sent: 0, message: 'No games today' })

    const picksText = await generatePicks(games)
    const html = buildEmail(picksText, date)

    const { data: subscribers, error } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('active', true)

    if (error) throw error
    if (!subscribers?.length) return res.json({ sent: 0, message: 'No subscribers yet', picks: picksText })

    const emails = subscribers.map(s => s.email)
    let sent = 0
    for (let i = 0; i < emails.length; i += 50) {
      await resend.emails.send({
        from: 'TrueOddsIQ Picks <picks@trueoddsiq.com>',
        to: emails.slice(i, i + 50),
        subject: `TrueOddsIQ Daily Picks — ${date}`,
        html,
      })
      sent += Math.min(50, emails.length - i)
    }

    // Extract top pick for social posts
    const topPickSection = picksText.split('---')[0] || picksText
    const pickLine = topPickSection.match(/\*\*(.+Pick.+?)\*\*/)?.[1]?.trim() || ''
    const edgeLine = topPickSection.match(/- Edge: (.+)/)?.[1]?.trim() || ''
    const betLine = topPickSection.match(/- Bet: (.+)/)?.[1]?.trim() || ''

    // Auto-post to Telegram
    try {
      if (pickLine) {
        const tgMessage = `🏆 Vega's Top Pick — ${date}\n\n📌 ${pickLine}\n💰 ${betLine}\n\n💡 ${edgeLine}\n\n📊 Full analysis + 2 more picks:\n🔗 trueoddsiq.com/picks\n
📧 Free daily newsletter → trueoddsiq.com\n\n#SportsBetting #VegaPicks #FreePicks`
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHANNEL_ID, text: tgMessage })
        })
      }
    } catch (tgErr) {
      console.warn('Telegram post failed:', tgErr.message)
    }

    // Auto-post to X
    try {
      if (pickLine) {
        const tweet = `🏆 Vega's Top Pick — ${date}\n\n${pickLine}\n${betLine}\n\n${edgeLine}\n\n📊 2 more picks + full analysis:\ntrueoddsiq.com/picks\n\n#SportsBetting #VegaPicks #FreePicks`.slice(0, 280)
        await postTweet(tweet)
      }
    } catch (tweetErr) {
      console.warn('X post failed:', tweetErr.message)
    }

    return res.json({ sent, message: `Sent to ${sent} subscribers`, picks: picksText })
  } catch (err) {
    console.error('Newsletter error:', err)
    return res.status(500).json({ error: err.message })
  }
}
