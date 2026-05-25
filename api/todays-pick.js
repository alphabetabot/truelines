/* global process */
// Returns today's top pick or full pick list (?all=1) from Supabase

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

const PICKS_SELECT = 'id,date,pick,bet,bet_type,odds,confidence,edge,game,sport,result,units,sort_order'
const PICKS_SELECT_FALLBACK = 'id,date,pick,bet,confidence,edge,game,sport,result'
const CACHE_HEADER = 's-maxage=300, stale-while-revalidate=1800'

async function fetchPicksForDate(date) {
  const headers = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/daily_picks?date=eq.${date}&order=sort_order.asc.nullslast,created_at.asc&select=${PICKS_SELECT}`,
    { headers }
  )

  if (response.ok) {
    return response.json()
  }

  const fallback = await fetch(
    `${SUPABASE_URL}/rest/v1/daily_picks?date=eq.${date}&order=created_at.asc&select=${PICKS_SELECT_FALLBACK}`,
    { headers }
  )

  if (!fallback.ok) return null
  return fallback.json()
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Cache-Control', 'no-store')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    res.setHeader('Cache-Control', 'no-store')
    return res.status(500).json({ error: 'Supabase environment variables are not configured' })
  }

  const today = new Date().toISOString().split('T')[0]
  const date = req.query?.date || today
  const listAll = req.query?.all === '1' || req.query?.all === 'true'

  try {
    const picks = await fetchPicksForDate(date)

    if (picks === null) {
      return res.status(500).json({ error: 'Failed to fetch picks' })
    }

    if (listAll) {
      res.setHeader('Cache-Control', CACHE_HEADER)
      return res.json({ date, picks, count: picks.length })
    }

    const top = picks[0]
    if (top?.bet && !top.bet.includes('-10000') && !top.bet.includes('-99999')) {
      res.setHeader('Cache-Control', CACHE_HEADER)
      return res.json(top)
    }
  } catch (err) {
    console.error('Failed to fetch today\'s pick:', err)
  }

  res.setHeader('Cache-Control', 'no-store')
  return res.status(503).json({
    error: 'No picks yet — newsletter generates picks daily at 8 AM PT',
  })
}
