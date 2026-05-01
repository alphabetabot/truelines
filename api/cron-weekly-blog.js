// Weekly SEO blog post generator - runs every Monday at 8am PT
// Generates a deeper betting guide article for long-tail SEO

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

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

export default async function handler(req, res) {
  const secret = req.headers['x-newsletter-secret']
  if (secret !== process.env.NEWSLETTER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    const topic = req.body?.topic || getWeeklyTopic()

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
    const slug = slugify(title.slice(0, 60)) + '-' + today
    const summary = lines.find(l => !l.startsWith('#') && l.length > 50 && l.length < 250)?.trim()
      || `${topic} — expert betting guide from TrueOddsIQ's AI analyst Vega.`

    // Detect sport tag
    const sportMap = { mlb: 'MLB', nba: 'NBA', nhl: 'NHL', nfl: 'NFL', soccer: 'Soccer' }
    const sport = Object.entries(sportMap).find(([k]) => topic.toLowerCase().includes(k))?.[1] || 'General'

    const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ slug, title, summary, content, sport, date: today, auto_generated: true }),
    })

    if (!sbRes.ok) throw new Error(`Supabase error: ${await sbRes.text()}`)
    const post = await sbRes.json()
    return res.json({ success: true, post: post[0], topic })
  } catch (err) {
    console.error('Weekly blog error:', err)
    return res.status(500).json({ error: err.message })
  }
}
