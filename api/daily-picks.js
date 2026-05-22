// Returns today's stored newsletter picks (3 picks + fade)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const dateParam = req.query?.date
  const today = new Date().toISOString().split('T')[0]
  const date = dateParam || today

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_picks?date=eq.${date}&order=created_at.asc&select=id,date,pick,bet,bet_type,odds,confidence,edge,game,sport,result,units`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    )

    if (!response.ok) {
      const fallback = await fetch(
        `${SUPABASE_URL}/rest/v1/daily_picks?date=eq.${date}&order=created_at.asc&select=id,date,pick,bet,confidence,edge,game,sport,result`,
        {
          headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
        }
      )
      if (!fallback.ok) {
        return res.status(500).json({ error: 'Failed to fetch picks' })
      }
      const picks = await fallback.json()
      return res.json({ date, picks, count: picks.length })
    }

    const picks = await response.json()
    return res.json({ date, picks, count: picks.length })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
