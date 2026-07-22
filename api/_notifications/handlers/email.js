import { sendNewsletterEmail, unsubscribeUrl } from '../../_newsletter-utils.js'
import { uniqueSubscriberEmails } from '../../_newsletter-send-guard.js'
import { NOTIFICATION_CHANNELS, NOTIFICATION_EVENTS } from '../events.js'
import {
  buildFreePickNotificationEmail,
  buildPremiumPickNotificationEmail,
  buildNoFreePickEmail,
} from '../templates.js'

const BATCH_SIZE = 4
const RESEND_MIN_INTERVAL_MS = 250

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchNewsletterEmails(supabase) {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .eq('active', true)

  if (error) throw error
  return uniqueSubscriberEmails(data || [])
}

async function fetchPremiumEmails(supabase) {
  const { data: subs, error: subErr } = await supabase
    .from('subscriptions')
    .select('user_id,status,current_period_end')
    .in('status', ['active', 'trialing'])

  if (subErr) {
    console.warn('[notifications] subscriptions fetch failed:', subErr.message)
    return []
  }

  const activeUserIds = (subs || [])
    .filter(row => {
      if (!row?.user_id) return false
      if (row.current_period_end) {
        const end = new Date(row.current_period_end)
        if (!Number.isNaN(end.getTime()) && end < new Date()) return false
      }
      return true
    })
    .map(row => row.user_id)

  if (!activeUserIds.length) return []

  const { data: subscribers, error: nlErr } = await supabase
    .from('newsletter_subscribers')
    .select('email,user_id')
    .eq('active', true)
    .in('user_id', activeUserIds)

  if (nlErr) {
    console.warn('[notifications] premium subscriber email lookup failed:', nlErr.message)
    return []
  }

  return uniqueSubscriberEmails(subscribers || [])
}

async function recordNotificationEvent(supabase, row) {
  try {
    await supabase.from('pick_notification_events').insert(row)
  } catch (err) {
    console.warn('[notifications] audit log insert failed:', err?.message || err)
  }
}

async function sendBatch({ resend, emails, template, eventType, pickId, audience }) {
  let sent = 0
  const failures = []

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE)
    for (const email of batch) {
      const unsub = unsubscribeUrl(email)
      try {
        await sendNewsletterEmail({
          resend,
          to: email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        })
        sent++
      } catch (err) {
        failures.push({ email, error: err?.message || 'send failed' })
      }
      await sleep(RESEND_MIN_INTERVAL_MS)
    }
  }

  return { sent, failed: failures.length, failures, recipients: emails.length }
}

export async function handleEmailNotification(event, { supabase, resend }) {
  const { type, pick } = event

  if (type === NOTIFICATION_EVENTS.FREE_PICK_PUBLISHED) {
    const emails = await fetchNewsletterEmails(supabase)
    const template = buildFreePickNotificationEmail({})
    const result = await sendBatch({
      resend,
      emails,
      template,
      eventType: type,
      pickId: pick?.id,
      audience: 'newsletter',
    })
    await recordNotificationEvent(supabase, {
      pick_id: pick?.id || null,
      event_type: type,
      channel: NOTIFICATION_CHANNELS.EMAIL,
      audience: 'newsletter',
      status: result.failed ? 'partial' : 'sent',
      payload: { recipients: result.recipients, sent: result.sent },
      sent_at: new Date().toISOString(),
    })
    return result
  }

  if (type === NOTIFICATION_EVENTS.PREMIUM_PICK_PUBLISHED) {
    const emails = await fetchPremiumEmails(supabase)
    const template = buildPremiumPickNotificationEmail({ pickNumber: pick?.pick_number })
    const result = await sendBatch({
      resend,
      emails,
      template,
      eventType: type,
      pickId: pick?.id,
      audience: 'premium',
    })
    await recordNotificationEvent(supabase, {
      pick_id: pick?.id || null,
      event_type: type,
      channel: NOTIFICATION_CHANNELS.EMAIL,
      audience: 'premium',
      status: result.failed ? 'partial' : 'sent',
      payload: { recipients: result.recipients, sent: result.sent, pick_number: pick?.pick_number },
      sent_at: new Date().toISOString(),
    })
    return result
  }

  if (type === NOTIFICATION_EVENTS.NO_FREE_PICK_TODAY) {
    const emails = await fetchNewsletterEmails(supabase)
    const template = buildNoFreePickEmail({})
    const result = await sendBatch({
      resend,
      emails,
      template,
      eventType: type,
      pickId: null,
      audience: 'newsletter',
    })
    await recordNotificationEvent(supabase, {
      pick_id: null,
      event_type: type,
      channel: NOTIFICATION_CHANNELS.EMAIL,
      audience: 'newsletter',
      status: result.failed ? 'partial' : 'sent',
      payload: { recipients: result.recipients, sent: result.sent },
      sent_at: new Date().toISOString(),
    })
    return result
  }

  return { skipped: true, reason: 'unknown_event_type' }
}
