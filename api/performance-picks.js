// Fetch picks with results from Supabase for the performance tracker
// Only returns picks that have been decided (result is not null)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_picks?order=date.desc&limit=100&select=id,date,pick,bet,confidence,edge,game,sport,result`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
      }
    )

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch from Supabase' })
    }

    const allPicks = await response.json()
    
    // Filter only picks with results
    const picksWithResults = allPicks.filter(p => p.result && p.result.trim() !== '')

    // Format for display - add dummy units for now (will be calculated from odds later)
    const formatted = picksWithResults.map(p => ({
      ...p,
      units: 0 // Placeholder - will implement units calculation
    }))

    return res.json(formatted)
  } catch (err) {
    console.error('Error fetching picks:', err)
    return res.status(500).json({ error: err.message })
  }
}
