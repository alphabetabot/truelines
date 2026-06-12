/** Only schedule in vercel.json — blocks stray 0 15 UTC duplicate crons on Vercel. */
export const NEWSLETTER_CRON_SCHEDULE = '0 14 * * *'

/** Safety net if the main run times out after storing picks (~7:45 AM Pacific). */
export const NEWSLETTER_CATCHUP_SCHEDULE = '45 14 * * *'

/** Pacific calendar date for newsletter idempotency (YYYY-MM-DD). */
export function getPacificDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
  }).format(date)
}

/** Claims older than this with no sent_at are treated as crashed/timed-out runs. */
export const STALE_NEWSLETTER_CLAIM_MS = 15 * 60 * 1000

export function isStaleNewsletterClaim(row, now = Date.now()) {
  if (!row?.started_at || row.sent_at) return false
  const started = new Date(row.started_at).getTime()
  return Number.isFinite(started) && now - started > STALE_NEWSLETTER_CLAIM_MS
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
export async function claimDailyNewsletterSend(supabase, dateKey, { cronSchedule, _retried = false } = {}) {
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

  if (!_retried && isStaleNewsletterClaim(row)) {
    console.warn(`Releasing stale newsletter claim for ${dateKey} (started ${row.started_at})`)
    await supabase.from('newsletter_daily_sends').delete().eq('date', dateKey)
    return claimDailyNewsletterSend(supabase, dateKey, { cronSchedule, _retried: true })
  }

  return {
    claimed: false,
    tableMissing: false,
    reason: 'send_in_progress',
    startedAt: row?.started_at,
    cronSchedule: row?.cron_schedule,
  }
}

/** Save Claude output before Resend loop so catch-up can finish after a timeout. */
export async function persistNewsletterDraft(supabase, dateKey, picksText) {
  if (!picksText) return false
  const { error } = await supabase
    .from('newsletter_daily_sends')
    .update({ picks_text: picksText })
    .eq('date', dateKey)

  if (error) {
    if (isMissingTableError(error)) return false
    console.warn('Failed to persist newsletter draft:', error.message)
    return false
  }
  return true
}

export async function fetchNewsletterRow(supabase, dateKey) {
  const { data, error } = await supabase
    .from('newsletter_daily_sends')
    .select('date,sent_at,subscriber_count,started_at,cron_schedule,picks_text')
    .eq('date', dateKey)
    .maybeSingle()

  if (error && !isMissingTableError(error)) throw error
  return data || null
}

export function isNewsletterSendComplete(row) {
  return Boolean(row?.sent_at && row.subscriber_count != null && row.subscriber_count >= 0)
}

export async function completeNewsletterSend(supabase, dateKey, subscriberCount, picksText = null) {
  const update = {
    sent_at: new Date().toISOString(),
    subscriber_count: subscriberCount,
  }
  if (picksText) update.picks_text = picksText

  const { error } = await supabase
    .from('newsletter_daily_sends')
    .update(update)
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
