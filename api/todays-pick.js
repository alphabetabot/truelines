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

  // Check cache first — but validate odds are real
  try {
    const cacheRes = await fetch(`${SUPABASE_URL}/rest/v1/daily_picks?date=eq.${today}&select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    })
    const cached = await cacheRes.json()
    if (cached?.[0]) {
      const pick = cached[0]
      // Validate cached pick has reasonable odds in the bet field
      if (pick.bet && !pick.bet.includes('-10000') && !pick.bet.includes('-99999')) {
        return res.json(pick)
      }
    }
  } catch {}

  // Generate fresh pick
  try {
    const game = await getTopGame()
    if (!game) return res.status(404).json({ error: 'No games today' })

    const prompt = `You are Vega, TrueOddsIQ's AI sports betting analyst. Give ONE sharp betting pick for today.

Game: ${game.away} @ ${game.home} (${game.sport})
Moneyline: ${game.away} ${game.awayML} / ${game.home} ${game.homeML}
Total: ${game.total || 'N/A'}

Respond in this EXACT JSON format (no markdown, just raw JSON):
{
  "pick": "short pick label e.g. Cubs ML or Over 8.5",
  "bet": "exact bet type and odds e.g. Moneyline at -115 via DraftKings",
  "confidence": "⭐⭐⭐⭐",
  "edge": "2-3 sentence explanation of why this bet has value — be specific about the stats, matchup, or line angle",
  "game": "${game.away} @ ${game.home}",
  "sport": "${game.sport}"
}`

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const aiData = await aiRes.json()
    const text = aiData.content?.[0]?.text?.trim()
    if (!text) throw new Error('No AI response')

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
    const pickData = JSON.parse(cleaned)
    const record = { date: today, ...pickData }

    // Validate pick has real odds before caching
    if (!pickData.bet || pickData.bet.includes('-10000') || pickData.bet.includes('-99999')) {
      throw new Error('Invalid odds in pick data')
    }
    
    // Cache in Supabase
    await fetch(`${SUPABASE_URL}/rest/v1/daily_picks`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(record),
    })

    return res.json(record)
  } catch (err) {
    console.error('Error generating pick:', err.message)
    // Return empty response instead of bad data
    return res.status(503).json({ error: 'Unable to generate valid pick today' })
  }
}
