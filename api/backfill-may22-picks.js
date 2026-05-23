// One-time, idempotent backfill for Vega's Friday, May 22, 2026 picks.

import { getSupabase } from './supabase-client.js'
import { storePicks } from './store-picks.js'

const BACKFILL_DATE = '2026-05-22'

const PICKS = [
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

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('Cache-Control', 'no-store')

  try {
    const supabase = getSupabase()
    const { count, error } = await supabase
      .from('daily_picks')
      .select('id', { count: 'exact', head: true })
      .eq('date', BACKFILL_DATE)

    if (error) throw error

    if (count > 0) {
      return res.json({
        ok: true,
        date: BACKFILL_DATE,
        skipped: true,
        message: `Backfill skipped because ${count} pick(s) already exist for ${BACKFILL_DATE}.`,
      })
    }

    const stored = await storePicks(PICKS, new Date(`${BACKFILL_DATE}T12:00:00.000Z`))

    return res.json({
      ok: true,
      date: BACKFILL_DATE,
      stored: stored.length,
      picks: stored.map(p => ({ id: p.id, game: p.game, pick: p.pick, result: p.result })),
    })
  } catch (err) {
    console.error('May 22 picks backfill failed:', err)
    return res.status(500).json({ ok: false, error: err.message })
  }
}
