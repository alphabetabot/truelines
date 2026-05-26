/** Pacific calendar date for newsletter idempotency (YYYY-MM-DD). */
export function getPacificDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
  }).format(date)
}

/**
 * Returns whether today's newsletter emails were already sent.
 * If newsletter_daily_sends is missing, returns false (send allowed).
 */
export async function newsletterAlreadySentToday(supabase, dateKey) {
  const { data, error } = await supabase
    .from('newsletter_daily_sends')
    .select('sent_at, subscriber_count')
    .eq('date', dateKey)
    .maybeSingle()

  if (error) {
    const missing =
      error.code === '42P01' ||
      error.code === 'PGRST205' ||
      /newsletter_daily_sends/i.test(error.message || '')
    if (missing) {
      console.warn('newsletter_daily_sends missing; dedup disabled until table is created')
      return { alreadySent: false, tableMissing: true }
    }
    throw error
  }

  return {
    alreadySent: Boolean(data?.sent_at),
    sentAt: data?.sent_at,
    subscriberCount: data?.subscriber_count,
    tableMissing: false,
  }
}

export async function recordNewsletterSent(supabase, dateKey, subscriberCount) {
  const { error } = await supabase.from('newsletter_daily_sends').upsert(
    {
      date: dateKey,
      sent_at: new Date().toISOString(),
      subscriber_count: subscriberCount,
    },
    { onConflict: 'date' }
  )

  if (error) {
    const missing =
      error.code === '42P01' ||
      error.code === 'PGRST205' ||
      /newsletter_daily_sends/i.test(error.message || '')
    if (missing) {
      console.warn('newsletter_daily_sends missing; could not record send')
      return false
    }
    throw error
  }

  return true
}
