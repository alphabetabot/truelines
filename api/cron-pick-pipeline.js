import { Resend } from 'resend'
import { getSupabase } from './_supabase-client.js'
import { runPickPipeline, getPacificDateKey } from './_pick-publish-pipeline.js'

let resendClient = null

function getResend() {
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY)
  return resendClient
}

function isCronAuthorized(req) {
  const authHeader = String(req.headers?.authorization || req.headers?.Authorization || '')
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  return Boolean(process.env.CRON_SECRET && token === process.env.CRON_SECRET)
}

/**
 * Event-driven pick pipeline: analyze → approve → publish → notify.
 * Runs on schedule to check for newly qualified picks — emails only fire on publish.
 */
export default async function handler(req, res) {
  const secret = req.headers['x-newsletter-secret']
  const isVercelCron = isCronAuthorized(req)
  const force = req.query?.force === 'true' || req.body?.force === true

  if (!isVercelCron && secret !== process.env.NEWSLETTER_SECRET && !force) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const todayKey = getPacificDateKey(new Date())
    const supabase = getSupabase()
    const result = await runPickPipeline({
      supabase,
      resend: getResend(),
      todayKey,
      forceRegenerate: req.query?.regenerate === 'true',
    })

    return res.status(200).json(result)
  } catch (err) {
    console.error('Pick pipeline error:', err)
    return res.status(500).json({ error: err.message || 'Pick pipeline failed' })
  }
}
