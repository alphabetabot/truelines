// Returns today's top pick or full pick list (?all=1) from Supabase

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

const PICKS_SELECT = 'id,date,pick,bet,bet_type,odds,confidence,edge,game,sport,result,units'
const PICKS_SELECT_FALLBACK = 'id,date,pick,bet,confidence,edge,game,sport,result'

async function fetchPicksForDate(date) {
  const headers = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/daily_picks?date=eq.${date}&order=created_at.asc&select=${PICKS_SELECT}`,
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

  const today = new Date().toISOString().split('T')[0]
  const date = req.query?.date || today
  const listAll = req.query?.all === '1' || req.query?.all === 'true'

  try {
    const picks = await fetchPicksForDate(date)

    if (picks === null) {
      return res.status(500).json({ error: 'Failed to fetch picks' })
    }

    if (listAll) {
      return res.json({ date, picks, count: picks.length })
    }

    const top = picks[0]
    if (top?.bet && !top.bet.includes('-10000') && !top.bet.includes('-99999')) {
      return res.json(top)
    }
  } catch {}

  return res.status(503).json({
    error: 'No picks yet — newsletter generates picks daily at 8 AM PT',
  })
}
