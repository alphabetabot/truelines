import {
  deliverNewsletterEmails,
  isUsableTopPickText,
  resolveTopPickText,
} from './_newsletter-deliver.js'
import {
  completeNewsletterSend,
  isNewsletterSendComplete,
  isStaleNewsletterClaim,
  releaseNewsletterClaim,
} from './_newsletter-send-guard.js'

const PICK_ROW_SELECT = 'sport,game,pick,bet,confidence,edge,sort_order,created_at'
const PICK_ROW_SELECT_FALLBACK = 'sport,game,pick,bet,confidence,edge,created_at'

function isMissingColumnError(error) {
  const msg = String(error?.message || '')
  return /column/i.test(msg) && /does not exist|unknown/i.test(msg)
}

/** Safe read — falls back if picks_text column is missing in Supabase. */
export async function fetchNewsletterRowSafe(supabase, dateKey) {
  const full = await supabase
    .from('newsletter_daily_sends')
    .select('date,sent_at,subscriber_count,started_at,cron_schedule,picks_text')
    .eq('date', dateKey)
    .maybeSingle()

  if (!full.error) return full.data || null
  if (!isMissingColumnError(full.error)) throw full.error

  const fallback = await supabase
    .from('newsletter_daily_sends')
    .select('date,sent_at,subscriber_count,started_at,cron_schedule')
    .eq('date', dateKey)
    .maybeSingle()

  if (fallback.error) throw fallback.error
  return fallback.data || null
}

/** Top stored pick for newsletter fallback / recovery. */
export async function fetchTopDailyPickSafe(supabase, dateKey) {
  const ordered = await supabase
    .from('daily_picks')
    .select(PICK_ROW_SELECT)
    .eq('date', dateKey)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)

  if (!ordered.error) return ordered.data?.[0] || null
  if (!isMissingColumnError(ordered.error)) throw ordered.error

  const fallback = await supabase
    .from('daily_picks')
    .select(PICK_ROW_SELECT_FALLBACK)
    .eq('date', dateKey)
    .order('created_at', { ascending: true })
    .limit(1)

  if (fallback.error) throw fallback.error
  return fallback.data?.[0] || null
}

export function isSendInProgress(existingRow) {
  return Boolean(
    existingRow?.started_at &&
    !existingRow.sent_at &&
    !isStaleNewsletterClaim(existingRow),
  )
}

export function shouldRecoverEmailDelivery(existingRow, { emailsOnly, catchupSend, forceSend } = {}) {
  if (isNewsletterSendComplete(existingRow)) {
    return Boolean(forceSend && emailsOnly)
  }
  if (
    existingRow?.started_at &&
    !existingRow.sent_at &&
    !isStaleNewsletterClaim(existingRow) &&
    (emailsOnly || catchupSend) &&
    !forceSend
  ) {
    return false
  }
  if (emailsOnly || catchupSend) return true
  if (existingRow?.started_at && !existingRow.sent_at && isStaleNewsletterClaim(existingRow)) {
    return true
  }
  return false
}

export async function runEmailOnlyDelivery({
  supabase,
  resend,
  todayKey,
  dateLabel,
  picksText = '',
  dailyPickRow = null,
  mode = 'recovery',
  allowResend = false,
}) {
  const existingRow = await fetchNewsletterRowSafe(supabase, todayKey)
  if (isNewsletterSendComplete(existingRow) && !allowResend) {
    return {
      sent: 0,
      skipped: true,
      reason: 'already_sent_today',
      date: todayKey,
      sentAt: existingRow.sent_at,
      subscriber_count: existingRow.subscriber_count,
    }
  }

  const pickRow = dailyPickRow || await fetchTopDailyPickSafe(supabase, todayKey)
  const draftText = picksText || existingRow?.picks_text || ''
  if (!draftText && !pickRow) {
    return {
      sent: 0,
      skipped: true,
      reason: 'no_picks_to_send',
      date: todayKey,
      message: 'No stored picks or picks_text for email delivery',
    }
  }

  if (existingRow?.started_at && !existingRow.sent_at && isStaleNewsletterClaim(existingRow)) {
    console.warn(`Releasing stale newsletter claim for ${todayKey} before email recovery`)
    await releaseNewsletterClaim(supabase, todayKey)
  }

  const { data: subscribers, error: subErr } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .eq('active', true)

  if (subErr) throw subErr
  if (!subscribers?.length) {
    return { sent: 0, message: 'No subscribers yet', recipients: 0, date: todayKey, mode }
  }

  const topPickText = resolveTopPickText(draftText, pickRow)
  if (!isUsableTopPickText(topPickText)) {
    throw new Error('Top pick text is missing bet/pick details for newsletter email')
  }

  const delivery = await deliverNewsletterEmails({
    resend,
    subscribers,
    topPickText,
    dateLabel,
  })

  if (delivery.sent > 0) {
    const recorded = await completeNewsletterSend(
      supabase,
      todayKey,
      delivery.sent,
      draftText || null,
    )
    if (!recorded) {
      console.error('Newsletter sent but newsletter_daily_sends update failed')
    }
  }

  return {
    ...delivery,
    date: todayKey,
    mode,
    message:
      delivery.sent > 0
        ? `Sent to ${delivery.sent} subscribers`
        : 'No newsletter emails were delivered',
    topPickPreview: topPickText.split('\n').slice(0, 6).join('\n'),
  }
}
