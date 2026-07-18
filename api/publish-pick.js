import { Resend } from 'resend'
import { getSupabase } from './_supabase-client.js'
import { publishPickRow } from './_pick-publish-store.js'
import { NOTIFICATION_EVENTS } from './_notifications/events.js'
import { dispatchNotification } from './_notifications/dispatcher.js'
import { PICK_STATUS } from './_pick-lifecycle.js'

let resendClient = null

function getResend() {
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY)
  return resendClient
}

function isAuthorized(req) {
  const authHeader = String(req.headers?.authorization || req.headers?.Authorization || '')
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) return true
  if (req.headers['x-newsletter-secret'] === process.env.NEWSLETTER_SECRET) return true
  return false
}

/** Manual publish trigger for an approved pick (admin / webhook). */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const pickId = req.body?.pickId || req.query?.pickId
  if (!pickId) {
    return res.status(400).json({ error: 'pickId required' })
  }

  try {
    const supabase = getSupabase()
    const { data: row, error } = await supabase
      .from('daily_picks')
      .select('*')
      .eq('id', pickId)
      .maybeSingle()

    if (error || !row) {
      return res.status(404).json({ error: 'Pick not found' })
    }

    if (row.status !== PICK_STATUS.APPROVED) {
      return res.status(409).json({ error: `Pick status is ${row.status}, expected approved` })
    }

    const result = await publishPickRow(supabase, row)
    if (!result.published) {
      return res.status(409).json({ error: result.reason || 'Publish failed' })
    }

    const eventType = row.tier === 'premium'
      ? NOTIFICATION_EVENTS.PREMIUM_PICK_PUBLISHED
      : NOTIFICATION_EVENTS.FREE_PICK_PUBLISHED

    const notifications = await dispatchNotification(
      { type: eventType, pick: result.row },
      { supabase, resend: getResend() },
    )

    await supabase
      .from('daily_picks')
      .update({ notification_sent_at: new Date().toISOString() })
      .eq('id', result.row.id)

    return res.json({ ok: true, pick: result.row, notifications })
  } catch (err) {
    console.error('publish-pick error:', err)
    return res.status(500).json({ error: err.message })
  }
}
