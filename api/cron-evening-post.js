import { postTweet } from './post-to-x.js'

const ODDS_API_KEY = process.env.VITE_ODDS_API_KEY

async function getEveningGames() {
  const games = []
  try {
    const nbaRes = await fetch(`https://api.the-odds-api.com/v4/sports/basketball_nba/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american&bookmakers=draftkings,fanduel`)
    const nba = await nbaRes.json()
    nba?.forEach(g => games.push({ ...g, sport: 'NBA' }))
  } catch {}
  try {
    const nhlRes = await fetch(`https://api.the-odds-api.com/v4/sports/icehockey_nhl/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american&bookmakers=draftkings,fanduel`)
    const nhl = await nhlRes.json()
    nhl?.forEach(g => games.push({ ...g, sport: 'NHL' }))
  } catch {}
  return games.slice(0, 4)
}

export default async function handler(req, res) {
  const authHeader = req.headers['authorization']
  const secret = req.headers['x-newsletter-secret']
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && secret !== process.env.NEWSLETTER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const games = await getEveningGames()
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    const gameCount = {}
    games.forEach(g => gameCount[g.sport] = (gameCount[g.sport] || 0) + 1)
    const sportsLine = Object.entries(gameCount)
      .filter(([, count]) => count > 0)
      .map(([sport, count]) => `${count} ${sport}`)
      .join(' · ') || 'NBA Playoffs'

    const tweet = `🌙 Tonight's Slate — ${date}\n\n${sportsLine} on tap\n\n⚡ Vega's picks + best odds across 6 books:\ntrueoddsiq.com/picks\n\n@ESPN @ActionNetworkHQ @NBAonTNT #SportsBetting #NBAPlayoffs #VegaPicks`

    await postTweet(tweet.slice(0, 280))
    return res.json({ success: true, tweet })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
