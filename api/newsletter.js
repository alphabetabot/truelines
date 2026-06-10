import { createClient } from '@supabase/supabase-js'
import { verifyUnsubscribeToken } from './_newsletter-utils.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

/**
 * Unsubscribe only. Daily sends use /api/cron-newsletter (Vercel cron 0 14 UTC).
 * POST was retired — cron-job.org calling this caused duplicate emails.
 */
export default async function handler(req, res) {
  if (req.query?.action === 'unsubscribe') {
    return handleUnsubscribe(req, res)
  }

  if (req.method === 'POST') {
    return res.status(410).json({
      error: 'Legacy newsletter endpoint retired',
      message:
        'Daily picks email is sent only by /api/cron-newsletter at 0 14 UTC (~7:05 AM Pacific). Remove any cron-job.org job pointing at /api/newsletter.',
      cron: '0 14 * * * UTC',
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleUnsubscribe(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const email = String(req.query?.email || req.body?.email || '').trim().toLowerCase()
  const token = String(req.query?.token || req.body?.token || '')

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return res.status(400).json({ ok: false, error: 'Invalid unsubscribe link' })
  }

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ active: false })
    .eq('email', email)

  if (error) {
    console.error('Unsubscribe failed:', error.message)
    return res.status(500).json({ ok: false, error: 'Failed to unsubscribe' })
  }

  return res.json({ ok: true, message: 'You have been unsubscribed.' })
}
