// Health/status endpoint for the daily picks pipeline.

import { requireCronAuth } from './auth-utils.js'
import { getSupabase } from './supabase-client.js'
import { storePicks } from './store-picks.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

const SELECT_FIELDS = 'id,date,pick,bet,game,sport,result,units,created_at'
const LEGACY_SELECT_FIELDS = 'id,date,pick,bet,game,sport,result'
const BACKFILL_DATE = '2026-05-22'

const MAY22_PICKS = [
  {
    pickLine: 'MLB Pick: Los Angeles Dodgers ML',
    pickSelection: 'Los Angeles Dodgers ML',
    game: 'Los Angeles Dodgers @ Milwaukee Brewers',
    sport: 'MLB',
    betType: 'Moneyline',
    odds: '-110',
    bestBook: 'Standard Books',
    confidence: 4.5,
    edge: "The Dodgers carry +98 run differential (31W-19L) versus Milwaukee's +75 (29W-18L). While both teams are strong, LA's superior run differential indicates they're winning by larger margins. The Dodgers' offensive and pitching efficiency gap justifies laying the modest -110 price. Justin Wrobleski's matchup against Logan Henderson represents neutral ground, making team quality the decisive factor.",
    isFade: false,
  },
  {
    pickLine: 'MLB Pick: Texas Rangers ML',
    pickSelection: 'Texas Rangers ML',
    game: 'Texas Rangers @ Los Angeles Angels',
    sport: 'MLB',
    betType: 'Moneyline',
    odds: '-156',
    bestBook: 'Standard Books',
    confidence: 4,
    edge: "The Rangers sit at 24W-25L with a +13 run differential, while the Angels are a league-worst 17W-34L with -69 run differential--a 82-point swing. Jacob deGrom's arrival on the Rangers provides playoff-caliber starting pitching against a struggling Angels lineup. The -156 price reflects reality; LA's dysfunction is severe and structural, not situational.",
    isFade: false,
  },
  {
    pickLine: 'MLB Pick: Atlanta Braves ML',
    pickSelection: 'Atlanta Braves ML',
    game: 'Atlanta Braves @ Washington Nationals',
    sport: 'MLB',
    betType: 'Moneyline',
    odds: '-220',
    bestBook: 'Standard Books',
    confidence: 4,
    edge: "The Braves' 35W-16L record with +104 run differential is elite; Washington sits at 25W-26L with -16 run differential--a 120-point gap. Atlanta is 3rd in baseball by run differential and winning at a .686 pace. The Nationals' +179 underdog odds are overcorrecting; even accounting for Miles Mikolas (TBD starter), the Braves' dominance justifies the heavy favorite status.",
    isFade: false,
  },
  {
    pickLine: 'FADE: MLB: Rays ML',
    pickSelection: 'Rays ML',
    game: 'Tampa Bay Rays @ New York Yankees',
    sport: 'MLB',
    betType: 'Fade',
    odds: '+130',
    bestBook: 'Standard Books',
    confidence: 3,
    edge: "The market pricing Rays at +130 is seductive narrative--wild card contender in hostile territory. But the Yankees' +67 run differential versus Tampa's +40 reveals the gap. Cole on the mound in Yankee Stadium against Nick Martinez levels this into a -157 Yankees moneyline. Public perception overvalues Tampa's mid-May success; Yankees' superior run efficiency in this park makes them the math play, not the underdog at these odds.",
    isFade: true,
  },
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
    searchParams: { date: `eq.${date}`, order: 'created_at.asc', select: SELECT_FIELDS },
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

async function backfillMay22Picks() {
  const supabase = getSupabase()
  const { count, error } = await supabase
    .from('daily_picks')
    .select('id', { count: 'exact', head: true })
    .eq('date', BACKFILL_DATE)

  if (error) throw error

  if (count > 0) {
    return {
      ok: true,
      date: BACKFILL_DATE,
      skipped: true,
      message: `Backfill skipped because ${count} pick(s) already exist for ${BACKFILL_DATE}.`,
    }
  }

  const stored = await storePicks(MAY22_PICKS, new Date(`${BACKFILL_DATE}T12:00:00.000Z`))
  return {
    ok: true,
    date: BACKFILL_DATE,
    stored: stored.length,
    picks: stored.map(p => ({ id: p.id, game: p.game, pick: p.pick, result: p.result })),
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('Cache-Control', 'no-store')

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase environment variables are not configured' })
  }

  try {
    if (req.method === 'POST' && req.query?.action === 'backfill-may22') {
      if (!requireCronAuth(req, res)) return
      return res.json(await backfillMay22Picks())
    }

    const today = req.query?.date || isoDate(new Date())
    const yesterday = req.query?.previousDate || isoDate(addDays(new Date(`${today}T00:00:00.000Z`), -1))

    const [todayRows, yesterdayRows, recentGraded] = await Promise.all([
      fetchPicksByDate(today),
      fetchPicksByDate(yesterday),
      fetchRecentGraded(),
    ])

    return res.json({
      ok: true,
      generated_at: new Date().toISOString(),
      dates: {
        today,
        yesterday,
      },
      today: summarizeRows(todayRows),
      yesterday: summarizeRows(yesterdayRows),
      tracker: {
        recentGradedCount: recentGraded.length,
        latestGradedDate: recentGraded[0]?.date || null,
        recent: summarizeRows(recentGraded).picks,
      },
      cron: {
        picksPublish: '0 15 * * * UTC',
        resultGrading: '30 12 * * * UTC',
      },
    })
  } catch (err) {
    console.error('Picks status error:', err)
    return res.status(500).json({ ok: false, error: err.message })
  }
}
