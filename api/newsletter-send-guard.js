/** Only schedule in vercel.json — blocks stray 0 15 UTC duplicate crons on Vercel. */
export const NEWSLETTER_CRON_SCHEDULE = '0 14 * * *'

/** Pacific calendar date for newsletter idempotency (YYYY-MM-DD). */
export function getPacificDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
  }).format(date)
}

function isMissingTableError(error) {
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    /newsletter_daily_sends/i.test(error?.message || '')
  )
}

/**
 * Atomically reserve today's send before Claude/email work.
 * Prevents two cron invocations from both passing a late "already sent?" check.
 */
export async function claimDailyNewsletterSend(supabase, dateKey, { cronSchedule } = {}) {
  const { error } = await supabase.from('newsletter_daily_sends').insert({
    date: dateKey,
    sent_at: null,
    subscriber_count: null,
    cron_schedule: cronSchedule || null,
    started_at: new Date().toISOString(),
  })

  if (!error) {
    return { claimed: true, tableMissing: false }
  }

  if (error.code !== '23505') {
    if (isMissingTableError(error)) {
      console.error(
        'newsletter_daily_sends table missing — run api/create-newsletter-send-log.sql in Supabase'
      )
      return { claimed: false, tableMissing: true, reason: 'table_missing' }
    }
    throw error
  }

  const { data: row, error: readErr } = await supabase
    .from('newsletter_daily_sends')
    .select('sent_at, subscriber_count, started_at, cron_schedule')
    .eq('date', dateKey)
    .maybeSingle()

  if (readErr) {
    if (isMissingTableError(readErr)) {
      return { claimed: false, tableMissing: true, reason: 'table_missing' }
    }
    throw readErr
  }

  if (row?.sent_at && row.subscriber_count != null && row.subscriber_count >= 0) {
    return {
      claimed: false,
      tableMissing: false,
      reason: 'already_sent_today',
      sentAt: row.sent_at,
      cronSchedule: row.cron_schedule,
    }
  }

  return {
    claimed: false,
    tableMissing: false,
    reason: 'send_in_progress',
    startedAt: row?.started_at,
    cronSchedule: row?.cron_schedule,
  }
}

export async function completeNewsletterSend(supabase, dateKey, subscriberCount) {
  const { error } = await supabase
    .from('newsletter_daily_sends')
    .update({
      sent_at: new Date().toISOString(),
      subscriber_count: subscriberCount,
    })
    .eq('date', dateKey)

  if (error) {
    if (isMissingTableError(error)) {
      console.warn('newsletter_daily_sends missing; could not record send completion')
      return false
    }
    throw error
  }

  return true
}

/** One email per recipient even if newsletter_subscribers has duplicate rows. */
export function uniqueSubscriberEmails(subscribers) {
  const seen = new Set()
  const out = []
  for (const row of subscribers || []) {
    const email = String(row?.email || '').trim().toLowerCase()
    if (!email || seen.has(email)) continue
    seen.add(email)
    out.push(email)
  }
  return out
}

/** Drop a failed claim so a manual ?force=true retry can run (only if no mail was sent). */
export async function releaseNewsletterClaim(supabase, dateKey) {
  const { error } = await supabase
    .from('newsletter_daily_sends')
    .delete()
    .eq('date', dateKey)
    .is('sent_at', null)

  if (error && !isMissingTableError(error)) {
    console.warn('Failed to release newsletter claim:', error.message)
  }
}
