// Fetch picks with results from Supabase for the performance tracker

import { profitUnits, parseAmericanOdds } from './pick-utils.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

function computeUnits(pick) {
  if (pick.units != null && pick.units !== '') {
    const u = parseFloat(pick.units)
    if (!Number.isNaN(u)) return pick.result === 'L' ? -Math.abs(u) : u
  }
  const odds = pick.odds ?? parseAmericanOdds(pick.bet)
  if (!odds) return pick.result === 'W' ? 1 : -1
  return profitUnits(odds, pick.result === 'W')
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_picks?order=date.desc&limit=100&select=id,date,pick,bet,bet_type,odds,confidence,edge,game,sport,result,units`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    )

    if (!response.ok) {
      // Fallback without bet_type/odds/units columns
      const fallback = await fetch(
        `${SUPABASE_URL}/rest/v1/daily_picks?order=date.desc&limit=100&select=id,date,pick,bet,confidence,edge,game,sport,result`,
        {
          headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
        }
      )
      if (!fallback.ok) {
        return res.status(500).json({ error: 'Failed to fetch from Supabase' })
      }
      const allPicks = await fallback.json()
      const picksWithResults = allPicks.filter(p => p.result && p.result.trim() !== '')
      const formatted = picksWithResults.map(p => ({
        ...p,
        displayOdds: parseAmericanOdds(p.bet),
        units: computeUnits({ ...p, odds: parseAmericanOdds(p.bet) }),
      }))
      res.setHeader('Cache-Control', 'no-store, max-age=0')
      return res.json(formatted)
    }

    const allPicks = await response.json()
    const picksWithResults = allPicks.filter(p => p.result && p.result.trim() !== '')

    const formatted = picksWithResults.map(p => ({
      ...p,
      displayOdds: p.odds ?? parseAmericanOdds(p.bet),
      units: computeUnits(p),
    }))

    res.setHeader('Cache-Control', 'no-store, max-age=0')
    return res.json(formatted)
  } catch (err) {
    console.error('Error fetching picks:', err)
    return res.status(500).json({ error: err.message })
  }
}
