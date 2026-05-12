// Returns today's top pick — cached in Supabase, generated once per day
// Called by the homepage to show Vega's pick publicly

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const ODDS_API_KEY = process.env.VITE_ODDS_API_KEY

async function getTopGame() {
  const sports = [
    { key: 'baseball_mlb', label: 'MLB' },
    { key: 'basketball_nba', label: 'NBA' },
    { key: 'icehockey_nhl', label: 'NHL' },
  ]
  for (const sport of sports) {
    try {
      const res = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sport.key}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,totals&oddsFormat=american&bookmakers=draftkings,fanduel,pinnacle`
      )
      const games = await res.json()
      if (games?.length) {
        const g = games[0]
        const dk = g.bookmakers?.find(b => b.key === 'draftkings')
        const h2h = dk?.markets?.find(m => m.key === 'h2h')
        const totals = dk?.markets?.find(m => m.key === 'totals')
        const awayML = h2h?.outcomes?.find(o => o.name === g.away_team)?.price
        const homeML = h2h?.outcomes?.find(o => o.name === g.home_team)?.price
        const total = totals?.outcomes?.find(o => o.name === 'Over')?.point
        
        // Validate odds are reasonable (between -5000 and +10000)
        if (awayML && (awayML < -5000 || awayML > 10000)) continue
        if (homeML && (homeML < -5000 || homeML > 10000)) continue
        if (!awayML || !homeML) continue
        
        return {
          sport: sport.label,
          away: g.away_team,
          home: g.home_team,
          awayML: awayML > 0 ? `+${awayML}` : `${awayML}`,
          homeML: homeML > 0 ? `+${homeML}` : `${homeML}`,
          total,
        }
      }
    } catch {}
  }
  return null
}

export default async function handler(req, res) {
  const today = new Date().toISOString().split('T')[0]

  // ONLY use the newsletter's picks (first pick = top pick) — no separate generation
  try {
    const topPickRes = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_picks?date=eq.${today}&order=created_at.asc&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
      }
    )
    const topPickData = await topPickRes.json()
    if (topPickData?.[0]) {
      const pick = topPickData[0]
      // Validate pick has reasonable odds
      if (pick.bet && !pick.bet.includes('-10000') && !pick.bet.includes('-99999')) {
        return res.json(pick)
      }
    }
  } catch {}

  // No valid pick found — don't generate a different one
  // Wait for the newsletter cron to generate picks
  return res.status(503).json({ 
    error: 'No picks yet — newsletter generates picks daily at 8 AM PT'
  })
}
