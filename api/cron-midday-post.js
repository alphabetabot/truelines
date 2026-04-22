import { postTweet } from './post-to-x.js'

const ODDS_API_KEY = process.env.VITE_ODDS_API_KEY

async function getTodayNBAGames() {
  try {
    const res = await fetch(`https://api.the-odds-api.com/v4/sports/basketball_nba/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american&bookmakers=draftkings,fanduel`)
    const data = await res.json()
    return data?.slice(0, 3) || []
  } catch { return [] }
}

export default async function handler(req, res) {
  const authHeader = req.headers['authorization']
  const secret = req.headers['x-newsletter-secret']
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && secret !== process.env.NEWSLETTER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const games = await getTodayNBAGames()
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    let tweet = ''

    if (games.length > 0) {
      const gameLines = games.map(g => {
        const dk = g.bookmakers?.find(b => b.key === 'draftkings')
        const h2h = dk?.markets?.find(m => m.key === 'h2h')
        const away = h2h?.outcomes?.find(o => o.name === g.away_team)
        const home = h2h?.outcomes?.find(o => o.name === g.home_team)
        if (!away || !home) return null
        return `${g.away_team.split(' ').slice(-1)[0]} ${away.price > 0 ? '+' : ''}${away.price} / ${g.home_team.split(' ').slice(-1)[0]} ${home.price > 0 ? '+' : ''}${home.price}`
      }).filter(Boolean).slice(0, 3)

      tweet = `🏀 NBA Lines — ${date}\n\n${gameLines.join('\n')}\n\n⚡ Vega's full analysis + best odds across 6 books:\ntrueoddsiq.com\n\n@ActionNetworkHQ @NBAonTNT #NBABetting #SportsBetting #VegaPicks`
    } else {
      tweet = `⚾ Afternoon MLB slate is live\n\nVega analyzed every matchup — ERA, WHIP, ballpark, weather\n\n⚡ Best odds + AI picks:\ntrueoddsiq.com\n\n@MLBNetwork @ActionNetworkHQ #MLBBetting #SportsBetting #VegaPicks`
    }

    await postTweet(tweet.slice(0, 280))
    return res.json({ success: true, tweet })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
