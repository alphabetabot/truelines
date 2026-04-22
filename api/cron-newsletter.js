import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { postTweet } from './post-to-x.js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

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
          home: g.teams?.home?.team?.name,
          venue: g.venue?.name,
          weather: g.weather,
          awayPitcher: g.teams?.away?.probablePitcher?.fullName,
          homePitcher: g.teams?.home?.probablePitcher?.fullName,
        })
      })
    })
  } catch (e) { console.warn('MLB fetch failed') }

  try {
    const nbaRes = await fetch(`https://api.the-odds-api.com/v4/sports/basketball_nba/odds?apiKey=${process.env.VITE_ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm`)
    const nbaData = await nbaRes.json()
    nbaData?.forEach(g => games.push({ sport: 'NBA', away: g.away_team, home: g.home_team, bookmakers: g.bookmakers }))
  } catch (e) { console.warn('NBA fetch failed') }

  try {
    const nhlRes = await fetch(`https://api.the-odds-api.com/v4/sports/icehockey_nhl/odds?apiKey=${process.env.VITE_ODDS_API_KEY}&regions=us&markets=h2h,totals&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm`)
    const nhlData = await nhlRes.json()
    nhlData?.forEach(g => games.push({ sport: 'NHL', away: g.away_team, home: g.home_team, bookmakers: g.bookmakers }))
  } catch (e) { console.warn('NHL fetch failed') }

  return games
}

async function generatePicks(games) {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const slate = games.slice(0, 20).map(g => {
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
        content: `You are TrueOddsIQ, an elite sports betting analyst. Today is ${date}.

Today's slate (MLB, NBA, NHL):
${slate}

Pick ONLY the TOP 3-5 BEST BETS where there is genuine value. Do NOT force picks. Quality over quantity.

For each pick:
**[SPORT] Pick: [Team/Total]**
- Bet: [type] at [odds] via [book]
- Confidence: [⭐ rating out of 5]
- Edge: [2-3 sentences — specific stats, matchup angle, or line value]

End with:
**❌ Fade of the Day:** [most hyped bet to avoid + why]`
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

    // Auto-post to Telegram
    try {
      const firstPick = picksText.split('---')[1]?.trim() || ''
      const pickLine = firstPick.match(/\*\*\[.+?\] Pick:.+?\*\*/)?.[0]?.replace(/\*\*/g, '') || ''
      const edgeLine = firstPick.match(/- Edge: (.+)/)?.[1] || ''

      if (pickLine) {
        const tgMessage = `⚡ Vega's Pick of the Day — ${date}\n\n${pickLine}\n\n${edgeLine}\n\n📊 Full analysis + compare odds across 6 sportsbooks:\n🔗 trueoddsiq.com/picks\n\n📧 Get the full newsletter free → Sign up at trueoddsiq.com\n\n#SportsBetting #VegaPicks #AIPicks`
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
      const firstPick = picksText.split('---')[1]?.trim() || ''
      const pickLine = firstPick.match(/\*\*\[.+?\] Pick:.+?\*\*/)?.[0]?.replace(/\*\*/g, '') || ''
      const edgeLine = firstPick.match(/- Edge: (.+)/)?.[1] || ''

      if (pickLine) {
        const tweet = `⚡ Vega's Pick of the Day — ${date}\n\n${pickLine}\n\n${edgeLine}\n\n📊 Full analysis: trueoddsiq.com/picks\n📲 Free Telegram picks: t.me/TrueOddsIQ\n\n#SportsBetting #VegaPicks #FreePicks`
        await postTweet(tweet.slice(0, 280))
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
