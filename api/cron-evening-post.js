// Post top pick to X (Twitter) in the evening
import { postTweet } from './post-to-x.js'
import { getSupabase } from './supabase-client.js'

export default async function handler(req, res) {
  // Allow Vercel cron or manual trigger with secret
  const secret = req.headers['x-newsletter-secret']
  const isVercelCron = req.headers['authorization'] === `Bearer ${process.env.CRON_SECRET}`

  if (!isVercelCron && secret !== process.env.NEWSLETTER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Fetch today's picks
    const { data: picks, error } = await getSupabase()
      .from('daily_picks')
      .select('*')
      .eq('date', today)
      .order('created_at', { ascending: true })

    if (error) throw error
    if (!picks || picks.length === 0) {
      return res.json({ posted: false, message: 'No picks for today' })
    }

    // Get the first non-fade pick (the top pick)
    const topPick = picks.find(p => !p.pick.toLowerCase().includes('fade'))
    if (!topPick) {
      return res.json({ posted: false, message: 'No valid picks to post' })
    }

    // Format for X (280 char limit)
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const tweet = `Top Pick Today (${date})\n\n${topPick.pick}\n\n${topPick.bet}\n\nAnalysis: ${topPick.edge}\n\ntrueoddsiq.com/picks\n\n#SportsBetting`.slice(0, 280)

    await postTweet(tweet)
    
    return res.json({ posted: true, message: 'Posted to X', pick: topPick.pick })
  } catch (err) {
    console.error('Evening post error:', err)
    return res.status(500).json({ error: err.message })
  }
}
