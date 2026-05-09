// Unified blog cron - handles both daily game previews and weekly SEO guides
// Daily: 7am PT (game preview) | Weekly: Monday 8am PT (SEO guide)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const ODDS_API_KEY = process.env.VITE_ODDS_API_KEY

const WEEKLY_TOPICS = [
  'How to bet the MLB run line: strategy guide for 2026',
  'NBA playoff betting strategy: fading the public and finding value',
  'Best sportsbooks for live betting in 2026',
  'How to read line movement and follow sharp money',
  'NHL playoff betting guide: goalie matchups and home ice advantage',
  'Moneyline vs spread betting: when to use each',
  'How to build a winning sports betting bankroll management system',
  'Best MLB props to bet: strikeouts, home runs, and hits',
  'How to use odds comparison sites to maximize your winnings',
  'Understanding vig and juice: how sportsbooks make money',
  'Fading the public in sports betting: does it actually work?',
  'Best NBA props to bet: points, assists, and rebounds',
  'How to bet totals (over/unders) in baseball',
  'Sports betting taxes: what you need to know in 2026',
  'Parlay betting strategy: when parlays make sense',
]

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function getWeeklyTopic() {
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  return WEEKLY_TOPICS[weekNum % WEEKLY_TOPICS.length]
}

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

async function generateGamePreview(game, today) {
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

  const lines = content.split('\n').filter(l => l.trim())
  const titleLine = lines.find(l => l.startsWith('# ')) || lines[0]
  const title = titleLine.replace(/^#+ /, '').trim()
  const slug = slugify(`${game.away}-vs-${game.home}-${today}`)
  const summary = lines.find(l => !l.startsWith('#') && l.length > 50 && l.length < 200)?.trim()
    || `${game.away} vs ${game.home} ${game.sport} betting preview with odds, picks and AI analysis from Vega.`

  return { slug, title, summary, content, sport: game.sport, date: today, auto_generated: true }
}

async function generateWeeklyGuide(topic, today) {
  const prompt = `You are Vega, TrueOddsIQ's expert sports betting analyst. Write a comprehensive, SEO-optimized betting guide article.

Topic: "${topic}"

Write a 600-700 word article with:
1. A compelling H1 title (include the main keyword naturally)
2. A 1-sentence meta description
3. An introduction that hooks the reader
4. 4-5 well-structured sections with ## headers
5. Practical, actionable advice throughout
6. Bullet points and examples where relevant
7. A conclusion with a CTA to visit trueoddsiq.com for live odds and AI picks

Tone: Sharp, knowledgeable, like a professional sports bettor teaching a friend. No fluff.
Format: Clean markdown.
Do NOT just repeat the topic title as the H1 — make it more compelling and specific.`

  const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const aiData = await aiRes.json()
  const content = aiData.content?.[0]?.text
  if (!content) throw new Error('No content from AI')

  const lines = content.split('\n').filter(l => l.trim())
  const titleLine = lines.find(l => l.startsWith('# ')) || lines[0]
  const title = titleLine.replace(/^#+ /, '').trim()
  // Truncate at word boundary, max 80 chars
  let truncated = title
  if (title.length > 80) {
    truncated = title.slice(0, 80).split(' ').slice(0, -1).join(' ')
  }
  const slug = slugify(truncated) + '-' + today
  const summary = lines.find(l => !l.startsWith('#') && l.length > 50 && l.length < 250)?.trim()
    || `${topic} — expert betting guide from TrueOddsIQ's AI analyst Vega.`

  const sportMap = { mlb: 'MLB', nba: 'NBA', nhl: 'NHL', nfl: 'NFL', soccer: 'Soccer' }
  const sport = Object.entries(sportMap).find(([k]) => topic.toLowerCase().includes(k))?.[1] || 'General'

  return { slug, title, summary, content, sport, date: today, auto_generated: true }
}

export default async function handler(req, res) {
  const secret = req.headers['x-newsletter-secret']
  if (secret !== process.env.NEWSLETTER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    const isWeekly = req.query?.weekly === 'true' || req.body?.weekly === true

    let postData

    if (isWeekly) {
      const topic = req.body?.topic || getWeeklyTopic()
      postData = await generateWeeklyGuide(topic, today)
    } else {
      const game = await getTodayGames()
      if (!game) {
        return res.json({ success: false, message: 'No games found today' })
      }
      postData = await generateGamePreview(game, today)
    }

    // Save to Supabase
    const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(postData),
    })

    if (!sbRes.ok) {
      const err = await sbRes.text()
      throw new Error(`Supabase error: ${err}`)
    }

    const post = await sbRes.json()
    return res.json({ success: true, post: post[0], type: isWeekly ? 'weekly' : 'daily' })
  } catch (err) {
    console.error('Blog cron error:', err)
    return res.status(500).json({ error: err.message })
  }
}
