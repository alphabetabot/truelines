// Returns today's top pick or full pick list (?all=1) from Supabase

import { requireSupabaseUser } from './auth-utils.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

const PICKS_SELECT = 'id,date,pick,bet,bet_type,odds,confidence,edge,game,sport,result,units,sort_order'
const PICKS_SELECT_FALLBACK = 'id,date,pick,bet,confidence,edge,game,sport,result'
const PICK_CACHE = 'public, s-maxage=300, stale-while-revalidate=3600'

function isPlaceholderBet(bet) {
  return !bet || bet.includes('-10000') || bet.includes('-99999')
}

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
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('todays-pick: Supabase environment variables are not configured')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(500).json({ error: 'Supabase environment variables are not configured' })
  }

  const today = new Date().toISOString().split('T')[0]
  const date = req.query?.date || today
  const listAll = req.query?.all === '1' || req.query?.all === 'true'

  if (listAll) {
    const user = await requireSupabaseUser(req, res)
    if (!user) return
  }

  try {
    const picks = await fetchPicksForDate(date)

    if (picks === null) {
      console.error('todays-pick: Supabase fetch failed for', date)
      res.setHeader('Cache-Control', 'no-store')
      return res.status(500).json({ error: 'Failed to fetch picks' })
    }

    if (listAll) {
      res.setHeader('Cache-Control', 'private, no-store')
      return res.json({ date, picks, count: picks.length })
    }

    const top = picks[0]
    if (top?.bet && !isPlaceholderBet(top.bet)) {
      res.setHeader('Cache-Control', PICK_CACHE)
      return res.json(top)
    }
  } catch (err) {
    console.error('todays-pick error:', err)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(500).json({ error: 'Failed to fetch picks' })
  }

  res.setHeader('Cache-Control', 'no-store')
  return res.status(503).json({
    error: 'No picks yet — newsletter generates picks daily at 8 AM PT',
  })
}
