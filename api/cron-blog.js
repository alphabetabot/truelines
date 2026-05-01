// Daily blog post generator - runs at 7am PT via cron-job.org
// Generates a fresh game preview article and saves to Supabase

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const ODDS_API_KEY = process.env.VITE_ODDS_API_KEY

async function getTodayGames() {
  const sports = [
    { key: 'baseball_mlb', label: 'MLB' },
    { key: 'basketball_nba', label: 'NBA' },
    { key: 'icehockey_nhl', label: 'NHL' },
  ]
  for (const sport of sports) {
    try {
      const res = await fetch(`https://api.the-odds-api.com/v4/sports/${sport.key}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american&bookmakers=draftkings,fanduel&dateFormat=iso`)
      const data = await res.json()
      if (data?.length > 0) {
        const game = data[0]
        const dk = game.bookmakers?.find(b => b.key === 'draftkings')
        const h2h = dk?.markets?.find(m => m.key === 'h2h')
        const awayOdds = h2h?.outcomes?.find(o => o.name === game.away_team)?.price
        const homeOdds = h2h?.outcomes?.find(o => o.name === game.home_team)?.price
        return {
          sport: sport.label,
          away: game.away_team,
          home: game.home_team,
          awayOdds: awayOdds ? (awayOdds > 0 ? `+${awayOdds}` : `${awayOdds}`) : 'N/A',
          homeOdds: homeOdds ? (homeOdds > 0 ? `+${homeOdds}` : `${homeOdds}`) : 'N/A',
          commenceTime: game.commence_time,
        }
      }
    } catch {}
  }
  return null
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default async function handler(req, res) {
  const secret = req.headers['x-newsletter-secret']
  if (secret !== process.env.NEWSLETTER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    const game = await getTodayGames()

    if (!game) {
      return res.json({ success: false, message: 'No games found today' })
    }

    const gameTime = game.commenceTime
      ? new Date(game.commenceTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: 'America/Los_Angeles' })
      : 'tonight'

    const prompt = `You are Vega, TrueOddsIQ's AI sports betting analyst. Write a sharp, SEO-friendly betting preview article for today's ${game.sport} game.

Game: ${game.away} @ ${game.home}
Odds: ${game.away} ${game.awayOdds} / ${game.home} ${game.homeOdds}
Time: ${gameTime}

Write a 350-400 word article with this exact structure:
1. A compelling H1 title (include team names and "Odds, Picks & Prediction")
2. A 1-sentence summary/meta description
3. ## Game Overview section (2-3 sentences about the matchup)
4. ## Betting Odds section (discuss the current lines and what they imply)
5. ## Key Factors section (3 bullet points of sharp betting angles)
6. ## Vega's Take section (sharp analysis and lean, but no specific pick - drive them to sign up)
7. End with a call to action to visit trueoddsiq.com for live odds and AI picks

Keep the tone sharp and confident, like a professional handicapper. Focus on value and edges, not just who will win. Do NOT include a specific final pick - tease that they need to sign up for that.

Format in clean markdown.`

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const aiData = await aiRes.json()
    const content = aiData.content?.[0]?.text

    if (!content) throw new Error('No content from AI')

    // Extract title from first line
    const lines = content.split('\n').filter(l => l.trim())
    const titleLine = lines.find(l => l.startsWith('# ')) || lines[0]
    const title = titleLine.replace(/^#+ /, '').trim()
    const slug = slugify(`${game.away}-vs-${game.home}-${today}`)
    const summary = lines.find(l => !l.startsWith('#') && l.length > 50 && l.length < 200)?.trim()
      || `${game.away} vs ${game.home} ${game.sport} betting preview with odds, picks and AI analysis from Vega.`

    // Save to Supabase
    const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        slug,
        title,
        summary,
        content,
        sport: game.sport,
        date: today,
        auto_generated: true,
      }),
    })

    if (!sbRes.ok) {
      const err = await sbRes.text()
      throw new Error(`Supabase error: ${err}`)
    }

    const post = await sbRes.json()
    return res.json({ success: true, post: post[0] })
  } catch (err) {
    console.error('Blog cron error:', err)
    return res.status(500).json({ error: err.message })
  }
}
