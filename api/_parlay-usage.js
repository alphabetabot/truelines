import { pacificDateKey } from './_date-utils.js'

export const PARLAY_DAILY_LIMIT = 3

function isMissingTableError(error) {
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    /parlay_daily_usage/i.test(error?.message || '')
  )
}

export function parlayUsagePayload(used, limit = PARLAY_DAILY_LIMIT) {
  const safeUsed = Math.max(0, Number(used) || 0)
  return {
    used: safeUsed,
    limit,
    remaining: Math.max(0, limit - safeUsed),
    date: pacificDateKey(),
  }
}

export async function getParlayUsage(supabase, userId, dateKey = pacificDateKey()) {
  const { data, error } = await supabase
    .from('parlay_daily_usage')
    .select('build_count')
    .eq('user_id', userId)
    .eq('date', dateKey)
    .maybeSingle()

  if (error) {
    if (isMissingTableError(error)) {
      return { ...parlayUsagePayload(0), tableMissing: true }
    }
    throw error
  }

  return parlayUsagePayload(data?.build_count ?? 0)
}

/**
 * Reserve one build slot before calling Claude. Returns false if at daily limit.
 */
export async function consumeParlayBuild(supabase, userId, dateKey = pacificDateKey()) {
  const usage = await getParlayUsage(supabase, userId, dateKey)
  if (usage.tableMissing) {
    const err = new Error('Parlay usage table missing — run api/create-parlay-daily-usage.sql in Supabase')
    err.code = 'table_missing'
    throw err
  }
  if (usage.remaining <= 0) {
    return { allowed: false, usage }
  }

  const nextCount = usage.used + 1
  const { error } = await supabase.from('parlay_daily_usage').upsert(
    {
      user_id: userId,
      date: dateKey,
      build_count: nextCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,date' },
  )

  if (error) {
    if (isMissingTableError(error)) {
      const err = new Error('Parlay usage table missing — run api/create-parlay-daily-usage.sql in Supabase')
      err.code = 'table_missing'
      throw err
    }
    throw error
  }

  return {
    allowed: true,
    usage: parlayUsagePayload(nextCount),
  }
}

/** Restore one slot if AI build failed after consume (never below 0). */
export async function refundParlayBuild(supabase, userId, dateKey = pacificDateKey()) {
  const usage = await getParlayUsage(supabase, userId, dateKey)
  if (usage.tableMissing || usage.used <= 0) return usage

  const nextCount = usage.used - 1
  const { error } = await supabase.from('parlay_daily_usage').upsert(
    {
      user_id: userId,
      date: dateKey,
      build_count: nextCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,date' },
  )

  if (error && !isMissingTableError(error)) throw error
  return parlayUsagePayload(nextCount)
}
