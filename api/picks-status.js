// Health/status endpoint for the daily picks pipeline.

import { getSupabase } from './supabase-client.js'
import { verifyUnsubscribeToken } from './newsletter-utils.js'
import { handleBillingRequest, isBillingAction } from './_billing-handlers.js'
import { pacificDateKey } from './date-utils.js'
import { repairPickOrderFromText } from './store-picks.js'
import { isStaleNewsletterClaim } from './newsletter-send-guard.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const ODDS_API_KEY = process.env.ODDS_API_KEY || process.env.VITE_ODDS_API_KEY

const SELECT_FIELDS = 'id,date,pick,bet,game,sport,result,units,created_at,sort_order'
const LEGACY_SELECT_FIELDS = 'id,date,pick,bet,game,sport,result'
const ODDS_BASE_URL = 'https://api.the-odds-api.com/v4'
const ODDS_ALLOWED_PATHS = [
  /^\/sports$/,
  /^\/sports\/[a-z0-9_]+\/odds$/,
  /^\/sports\/[a-z0-9_]+\/scores$/,
]

function isoDate(date) {
  return date.toISOString().split('T')[0]
}

function addDays(date, days) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function summarizeRows(rows) {
  const picks = rows || []
  const graded = picks.filter(p => p.result && String(p.result).trim() !== '')
  const pending = picks.filter(p => !p.result || String(p.result).trim() === '')

  return {
    total: picks.length,
    pending: pending.length,
    graded: graded.length,
    picks: picks.map(p => ({
      id: p.id,
      date: p.date,
      sport: p.sport,
      game: p.game,
      pick: p.pick,
      bet: p.bet,
      result: p.result,
      units: p.units,
      created_at: p.created_at,
    })),
  }
}

async function fetchPicksByDate(date) {
  const response = await fetchDailyPicks({
    searchParams: { date: `eq.${date}`, order: 'sort_order.asc.nullslast,created_at.asc,id.asc', select: SELECT_FIELDS },
  })

  if (response.ok) return response.json()

  const fallback = await fetchDailyPicks({
    searchParams: { date: `eq.${date}`, select: LEGACY_SELECT_FIELDS },
  })

  if (!fallback.ok) {
    throw new Error(`Failed to fetch picks for ${date} (${fallback.status}): ${await fallback.text()}`)
  }

  return fallback.json()
}

async function fetchRecentGraded(limit = 10) {
  const response = await fetchDailyPicks({
    searchParams: { result: 'not.is.null', order: 'date.desc', limit, select: SELECT_FIELDS },
  })

  if (response.ok) return response.json()

  // Production may still be on the original table shape without `units` or
  // `created_at`. Fall back to the stable columns and filter graded rows here.
  const fallback = await fetchDailyPicks({
    searchParams: { order: 'date.desc', limit: 100, select: LEGACY_SELECT_FIELDS },
  })

  if (!fallback.ok) {
    throw new Error(`Failed to fetch recent graded picks (${fallback.status}): ${await fallback.text()}`)
  }

  const rows = await fallback.json()
  return rows
    .filter(p => p.result && String(p.result).trim() !== '')
    .slice(0, limit)
}

function fetchDailyPicks({ searchParams }) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/daily_picks`)
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, String(value))
  })

  return fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  })
}

async function proxyOddsRequest(req, res) {
  if (!ODDS_API_KEY) {
    return res.status(500).json({ error: 'ODDS_API_KEY is not configured' })
  }

  const path = String(req.query?.path || '')
  if (!ODDS_ALLOWED_PATHS.some(pattern => pattern.test(path))) {
    return res.status(400).json({ error: 'Unsupported odds endpoint' })
  }

  const upstreamUrl = new URL(`${ODDS_BASE_URL}${path}`)
  upstreamUrl.searchParams.set('apiKey', ODDS_API_KEY)

  for (const [key, value] of Object.entries(req.query || {})) {
    if (key === 'action' || key === 'path' || key === 'apiKey') continue
    if (Array.isArray(value)) {
      value.forEach(v => upstreamUrl.searchParams.append(key, String(v)))
    } else if (value != null) {
      upstreamUrl.searchParams.set(key, String(value))
    }
  }

  const upstream = await fetch(upstreamUrl)
  const text = await upstream.text()
  res.setHeader('Cache-Control', upstream.ok ? 's-maxage=30, stale-while-revalidate=60' : 'no-store')
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
  return res.status(upstream.status).send(text)
}

function verifyCronSecret(req) {
  const auth = String(req.headers.authorization || '')
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  return token && token === process.env.CRON_SECRET
}

async function fetchNewsletterSendStatus(supabase, dateKey) {
  const { data, error } = await supabase
    .from('newsletter_daily_sends')
    .select('date,sent_at,subscriber_count,started_at,cron_schedule')
    .eq('date', dateKey)
    .maybeSingle()

  if (error && !/newsletter_daily_sends/i.test(error.message || '')) {
    throw error
  }

  if (!data) {
    return { date: dateKey, status: 'not_started' }
  }

  if (data.sent_at && data.subscriber_count != null && data.subscriber_count >= 0) {
    return {
      date: dateKey,
      status: 'sent',
      sent_at: data.sent_at,
      subscriber_count: data.subscriber_count,
      cron_schedule: data.cron_schedule,
    }
  }

  if (isStaleNewsletterClaim(data)) {
    return {
      date: dateKey,
      status: 'stale_in_progress',
      started_at: data.started_at,
      cron_schedule: data.cron_schedule,
      hint: 'Claim is older than 15 minutes with no sent_at — cron may have timed out or crashed',
    }
  }

  return {
    date: dateKey,
    status: 'in_progress',
    started_at: data.started_at,
    cron_schedule: data.cron_schedule,
  }
}

async function handleNewsletterRecovery(req, res) {
  if (!verifyCronSecret(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const siteOrigin = process.env.SITE_URL || 'https://www.trueoddsiq.com'
  const recovery = await fetch(`${siteOrigin.replace(/\/$/, '')}/api/cron-newsletter?force=true`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  })

  const text = await recovery.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = { raw: text.slice(0, 500) }
  }

  return res.status(recovery.status).json({
    ok: recovery.ok,
    recovery: body,
  })
}

async function fetchStoredNewsletterText(supabase, dateKey) {
  const { data, error } = await supabase
    .from('newsletter_daily_sends')
    .select('picks_text')
    .eq('date', dateKey)
    .maybeSingle()

  if (error && !/picks_text/i.test(error.message || '')) {
    throw error
  }
  return data?.picks_text || null
}

async function handleRepairPickOrder(req, res) {
  if (!verifyCronSecret(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const dateKey = req.query?.date || pacificDateKey()
  let picksText = String(req.body?.picksText || req.query?.picksText || '').trim()

  if (!picksText) {
    const supabase = getSupabase()
    picksText = await fetchStoredNewsletterText(supabase, dateKey)
  }

  if (!picksText) {
    return res.status(400).json({
      ok: false,
      error: 'No picks text available for this date',
      hint:
        'POST JSON { "picksText": "<paste today newsletter body>" } with Authorization: Bearer CRON_SECRET, or run api/alter-newsletter-send-log-picks-text.sql in Supabase then re-store picks.',
      date: dateKey,
    })
  }

  try {
    const result = await repairPickOrderFromText(picksText, dateKey)
    return res.json({
      ok: true,
      message: 'Pick order repaired. Site top pick may take up to 5 minutes to refresh (CDN cache).',
      ...result,
    })
  } catch (err) {
    console.error('repair-pick-order error:', err)
    return res.status(500).json({ ok: false, error: err.message })
  }
}

async function handleUnsubscribe(req, res) {
  const email = String(req.query?.email || req.body?.email || '').trim().toLowerCase()
  const token = String(req.query?.token || req.body?.token || '')

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return res.status(400).json({ ok: false, error: 'Invalid unsubscribe link' })
  }

  const supabase = getSupabase()
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

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('Cache-Control', 'no-store')

  const action = String(req.query?.action || '').toLowerCase()
  if (isBillingAction(action) || req.headers['stripe-signature']) {
    return handleBillingRequest(req, res)
  }

  if (req.method === 'GET' && action === 'odds') {
    return proxyOddsRequest(req, res)
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase environment variables are not configured' })
  }

  try {
    if (req.query?.action === 'unsubscribe') {
      return handleUnsubscribe(req, res)
    }

    if (req.query?.action === 'repair-pick-order') {
      return handleRepairPickOrder(req, res)
    }

    if (req.query?.action === 'newsletter-recovery') {
      return handleNewsletterRecovery(req, res)
    }

    const today = req.query?.date || isoDate(new Date())
    const yesterday = req.query?.previousDate || isoDate(addDays(new Date(`${today}T00:00:00.000Z`), -1))
    const pacificToday = pacificDateKey()

    const supabase = getSupabase()
    const [todayRows, yesterdayRows, recentGraded, newsletter] = await Promise.all([
      fetchPicksByDate(today),
      fetchPicksByDate(yesterday),
      fetchRecentGraded(),
      fetchNewsletterSendStatus(supabase, pacificToday),
    ])

    return res.json({
      ok: true,
      generated_at: new Date().toISOString(),
      dates: {
        today,
        yesterday,
        pacificToday,
      },
      today: summarizeRows(todayRows),
      yesterday: summarizeRows(yesterdayRows),
      newsletter,
      tracker: {
        recentGradedCount: recentGraded.length,
        latestGradedDate: recentGraded[0]?.date || null,
        recent: summarizeRows(recentGraded).picks,
      },
      cron: {
        picksPublish: '0 14 * * * UTC',
        resultGrading: '30 12 * * * UTC',
      },
    })
  } catch (err) {
    console.error('Picks status error:', err)
    return res.status(500).json({ ok: false, error: err.message })
  }
}
