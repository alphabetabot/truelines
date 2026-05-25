// Unified social media cron - posts NBA games midday and NBA+NHL in evening
// Midday: 12pm PT (NBA) | Evening: 6pm PT (NBA + NHL)

import { postTweet } from './post-to-x.js'

const ODDS_API_KEY = process.env.ODDS_API_KEY || process.env.VITE_ODDS_API_KEY

async function getNBAGames() {
  try {
    const res = await fetch(`https://api.the-odds-api.com/v4/sports/basketball_nba/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american&bookmakers=draftkings,fanduel`)
    const data = await res.json()
    return data?.slice(0, 3) || []
  } catch { return [] }
}

async function getEveningGames() {
  const games = []
  try {
    const nbaRes = await fetch(`https://api.the-odds-api.com/v4/sports/basketball_nba/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american&bookmakers=draftkings,fanduel`)
    const nba = await nbaRes.json()
    nba?.forEach(g => games.push({ ...g, sport: 'NBA' }))
  } catch { /* skip */ }
  try {
    const nhlRes = await fetch(`https://api.the-odds-api.com/v4/sports/icehockey_nhl/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american&bookmakers=draftkings,fanduel`)
    const nhl = await nhlRes.json()
    nhl?.forEach(g => games.push({ ...g, sport: 'NHL' }))
  } catch { /* skip */ }
  return games.slice(0, 4)
}

export default async function handler(req, res) {
  const authHeader = req.headers['authorization']
  const secret = req.headers['x-newsletter-secret']
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && secret !== process.env.NEWSLETTER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const isEvening = req.query?.evening === 'true' || req.body?.evening === true
    const games = isEvening ? await getEveningGames() : await getNBAGames()

    if (games.length === 0) {
      return res.json({ success: false, message: 'No games found' })
    }

    let posted = 0

    // Post first few games
    for (const game of games.slice(0, 2)) {
      const dk = game.bookmakers?.find(b => b.key === 'draftkings')
      const h2h = dk?.markets?.find(m => m.key === 'h2h')
      const awayOdds = h2h?.outcomes?.find(o => o.name === game.away_team)?.price || '?'
      const homeOdds = h2h?.outcomes?.find(o => o.name === game.home_team)?.price || '?'

      const awayShort = game.away_team.split(' ').slice(-1)[0]
      const homeShort = game.home_team.split(' ').slice(-1)[0]

      const sport = game.sport || 'NBA'
      const emoji = sport === 'NBA' ? '🏀' : sport === 'NHL' ? '🏒' : '⚾'

      const odds = `${awayShort} ${awayOdds > 0 ? '+' : ''}${awayOdds} / ${homeShort} ${homeOdds > 0 ? '+' : ''}${homeOdds}`
      const time = new Date(game.commence_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: 'America/Los_Angeles' })

      const tweet = `${emoji} ${game.away_team} @ ${game.home_team}\n${time}\n\n${odds}\n\n🔍 Live odds at trueoddsiq.com #sportsbetting`

      await postTweet(tweet)
      posted++
    }

    return res.json({ success: true, posted, type: isEvening ? 'evening' : 'midday' })
  } catch (err) {
    console.error('Social cron error:', err)
    return res.status(500).json({ error: err.message })
  }
}
