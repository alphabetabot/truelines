// Auto-log pick results by checking game scores
// Matches picks to completed games and updates Supabase with W/L

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const ODDS_API_KEY = process.env.VITE_ODDS_API_KEY

const SPORT_MAP = {
  'MLB': 'baseball_mlb',
  'NBA': 'basketball_nba',
  'NHL': 'icehockey_nhl',
}

async function getGameScores(sport) {
  const key = SPORT_MAP[sport]
  if (!key) return []
  
  try {
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/${key}/scores?apiKey=${ODDS_API_KEY}&daysFrom=3`
    )
    if (!res.ok) return []
    return await res.json()
  } catch (err) {
    console.error(`Error fetching ${sport} scores:`, err.message)
    return []
  }
}

function normalizeTeam(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function findMatchingGame(pickData, games) {
  // Extract team names from the game string (e.g., "Texas Rangers @ New York Yankees")
  const [awayStr, homeStr] = pickData.game.split('@').map(s => s.trim())
  if (!awayStr || !homeStr) return null

  const pickAwayNorm = normalizeTeam(awayStr)
  const pickHomeNorm = normalizeTeam(homeStr)

  // Find game where both teams match
  return games.find(g => {
    const gameAwayNorm = normalizeTeam(g.away_team)
    const gameHomeNorm = normalizeTeam(g.home_team)
    return (gameAwayNorm === pickAwayNorm && gameHomeNorm === pickHomeNorm) ||
           (gameAwayNorm === pickHomeNorm && gameHomeNorm === pickAwayNorm)
  })
}

function determineResult(pick, game) {
  const away = game.scores?.find(s => s.name === game.away_team)
  const home = game.scores?.find(s => s.name === game.home_team)
  const awayScore = away?.score ?? null
  const homeScore = home?.score ?? null

  // Game not finished yet
  if (awayScore === null || homeScore === null) return null

  const pickLower = pick.toLowerCase().trim()

  // Moneyline picks
  if (pickLower.includes('ml') || pickLower.match(/\s[+-]\d{2,3}$/)) {
    // Extract team name from pick (e.g., "Rangers ML" -> "Rangers")
    const teamMatch = pickLower.match(/^([a-z\s]+)\s*(ml|@|\+|-)/i)
    if (teamMatch) {
      const pickTeam = normalizeTeam(teamMatch[1])
      const awayTeam = normalizeTeam(game.away_team)
      const homeTeam = normalizeTeam(game.home_team)

      if (pickTeam === awayTeam && awayScore > homeScore) return 'W'
      if (pickTeam === awayTeam && awayScore < homeScore) return 'L'
      if (pickTeam === homeTeam && homeScore > awayScore) return 'W'
      if (pickTeam === homeTeam && homeScore < awayScore) return 'L'
    }
  }

  // Over/Under picks
  const total = awayScore + homeScore
  if (pickLower.includes('over')) {
    const match = pickLower.match(/over\s*(\d+\.?\d*)/)
    if (match) {
      const line = parseFloat(match[1])
      return total > line ? 'W' : 'L'
    }
  }
  if (pickLower.includes('under')) {
    const match = pickLower.match(/under\s*(\d+\.?\d*)/)
    if (match) {
      const line = parseFloat(match[1])
      return total < line ? 'W' : 'L'
    }
  }

  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  // Verify cron secret if provided (for scheduled runs)
  if (process.env.CRON_SECRET && req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Fetch all picks without results
    const picksRes = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_picks?select=*&result=is.null&limit=100`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
      }
    )

    if (!picksRes.ok) {
      return res.status(500).json({ error: 'Failed to fetch picks from Supabase' })
    }

    const picks = await picksRes.json()
    if (!picks || picks.length === 0) {
      return res.json({ updated: 0, message: 'No pending picks' })
    }

    let updated = 0
    const updates = []

    // Check results for each pick
    for (const pick of picks) {
      const games = await getGameScores(pick.sport)
      
      // Find matching game
      const matchedGame = findMatchingGame(pick, games)
      if (!matchedGame) continue

      const result = determineResult(pick.pick, matchedGame)
      if (!result) continue // Can't determine result yet

      updates.push({ id: pick.id, result })
    }

    // Batch update results
    for (const update of updates) {
      try {
        await fetch(
          `${SUPABASE_URL}/rest/v1/daily_picks?id=eq.${update.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ result: update.result })
          }
        )
        updated++
      } catch (err) {
        console.error(`Failed to update pick ${update.id}:`, err.message)
      }
    }

    return res.json({ 
      updated, 
      total: picks.length,
      message: `Updated ${updated}/${picks.length} picks with results` 
    })
  } catch (err) {
    console.error('Error logging results:', err)
    return res.status(500).json({ error: err.message })
  }
}
