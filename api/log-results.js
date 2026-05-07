// Auto-log pick results by checking game scores
// Matches picks to completed games and updates Supabase with W/L

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const ODDS_API_KEY = process.env.VITE_ODDS_API_KEY

// Map sport to API key
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
      `https://api.the-odds-api.com/v4/sports/${key}/scores?apiKey=${ODDS_API_KEY}&daysFrom=2`
    )
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

function normalizeTeamName(name) {
  // Remove city, just keep team name for matching
  return name.split(' ').pop().toLowerCase()
}

function matchGameToTeams(game, teams) {
  const away = normalizeTeamName(game.away_team)
  const home = normalizeTeamName(game.home_team)
  
  return teams.some(t => {
    const normalized = normalizeTeamName(t)
    return away === normalized || home === normalized
  })
}

function determineResult(pick, game) {
  const awayTeam = normalizeTeamName(game.away_team)
  const homeTeam = normalizeTeamName(game.home_team)
  const away = game.scores?.find(s => s.name === game.away_team)
  const home = game.scores?.find(s => s.name === game.home_team)
  const awayScore = away?.score ?? null
  const homeScore = home?.score ?? null

  if (awayScore === null || homeScore === null) return null // Game not finished

  const pickLower = pick.toLowerCase()

  // Moneyline picks
  if (pickLower.includes('ml')) {
    if (pickLower.includes(awayTeam) && awayScore > homeScore) return 'W'
    if (pickLower.includes(homeTeam) && homeScore > awayScore) return 'W'
    if (pickLower.includes(awayTeam) && awayScore < homeScore) return 'L'
    if (pickLower.includes(homeTeam) && homeScore < awayScore) return 'L'
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

  return null // Can't determine
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Fetch all picks without results
    const picksRes = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_picks?order=date.desc&select=*&result=is.null`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
      }
    )

    if (!picksRes.ok) {
      return res.status(500).json({ error: 'Failed to fetch picks' })
    }

    const picks = await picksRes.json()
    if (picks.length === 0) {
      return res.json({ updated: 0, message: 'No pending picks' })
    }

    let updated = 0

    // Check results for each pick
    for (const pick of picks) {
      const games = await getGameScores(pick.sport)
      
      // Find matching game
      const matchedGame = games.find(g => {
        const teams = pick.game.split('@').map(t => t.trim())
        return matchGameToTeams(g, teams)
      })

      if (!matchedGame) continue // Game not found yet

      const result = determineResult(pick.pick, matchedGame)
      if (!result) continue // Can't determine result yet

      // Update Supabase
      await fetch(
        `${SUPABASE_URL}/rest/v1/daily_picks?id=eq.${pick.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ result })
        }
      )

      updated++
    }

    return res.json({ updated, message: `Updated ${updated} pick(s) with results` })
  } catch (err) {
    console.error('Error logging results:', err)
    return res.status(500).json({ error: err.message })
  }
}
