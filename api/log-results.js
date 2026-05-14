// Simple result logger with detailed logging for debugging

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const ODDS_API_KEY = process.env.VITE_ODDS_API_KEY

async function getAllGames() {
  try {
    const games = []
    const sports = ['baseball_mlb', 'basketball_nba', 'icehockey_nhl']
    
    for (const sport of sports) {
      const res = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sport}/scores?apiKey=${ODDS_API_KEY}&daysFrom=3`
      )
      if (!res.ok) continue
      const data = await res.json()
      if (data?.length) games.push(...data.map(g => ({ ...g, sport })))
    }
    return games
  } catch (e) {
    console.error('Error fetching games:', e.message)
    return []
  }
}

function checkResult(pickText, game) {
  const away = game.scores?.find(s => s.name === game.away_team)?.score ?? null
  const home = game.scores?.find(s => s.name === game.home_team)?.score ?? null
  
  if (away === null || home === null) return null // Game not done
  
  // Check if this is a fade (marked with FADE: prefix)
  const isFade = pickText.toLowerCase().includes('fade:')
  const pick = pickText.replace(/^FADE:\s*/i, '').toLowerCase().trim()
  
  const awayTeamShort = game.away_team.split(' ').pop().toLowerCase()
  const homeTeamShort = game.home_team.split(' ').pop().toLowerCase()
  
  let result = null
  
  // Moneyline
  if (pick.includes('ml')) {
    if (pick.includes(awayTeamShort) && away > home) result = 'W'
    else if (pick.includes(awayTeamShort) && away < home) result = 'L'
    else if (pick.includes(homeTeamShort) && home > away) result = 'W'
    else if (pick.includes(homeTeamShort) && home < away) result = 'L'
  }
  
  // Over/Under
  const total = away + home
  const overMatch = pick.match(/over\s+(\d+\.?\d*)/)
  if (overMatch) {
    const line = parseFloat(overMatch[1])
    result = total > line ? 'W' : 'L'
  }
  const underMatch = pick.match(/under\s+(\d+\.?\d*)/)
  if (underMatch) {
    const line = parseFloat(underMatch[1])
    result = total < line ? 'W' : 'L'
  }
  
  // INVERT result if it's a fade (fade wins when pick loses)
  if (isFade && result) {
    result = result === 'W' ? 'L' : 'W'
  }
  
  return result
}

function findGame(pickGameStr, games) {
  if (!pickGameStr || !pickGameStr.includes('@')) return null
  
  const parts = pickGameStr.split('@').map(p => p.trim().toLowerCase())
  if (parts.length < 2) return null
  
  const [awaySearch, homeSearch] = parts
  
  return games.find(g => {
    const gAway = g.away_team.toLowerCase()
    const gHome = g.home_team.toLowerCase()
    const awayLastWord = gAway.split(' ').pop()
    const homeLastWord = gHome.split(' ').pop()
    const searchAwayLastWord = awaySearch.split(' ').pop()
    const searchHomeLastWord = homeSearch.split(' ').pop()
    
    // Match: either full name includes search, or last word matches exactly
    const awayMatches = gAway.includes(awaySearch) || awayLastWord === searchAwayLastWord
    const homeMatches = gHome.includes(homeSearch) || homeLastWord === searchHomeLastWord
    
    return awayMatches && homeMatches
  })
}

export default async function handler(req, res) {
  const log = []
  
  try {
    log.push('START: log-results cron')
    
    // Fetch picks
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
      log.push(`ERROR: Failed to fetch picks (${picksRes.status})`)
      return res.json({ success: false, log, error: 'Failed to fetch picks' })
    }
    
    const picks = await picksRes.json()
    log.push(`PICKS: Found ${picks.length} picks without results`)
    
    if (picks.length === 0) {
      return res.json({ success: true, log, message: 'No pending picks' })
    }
    
    // Fetch all games
    const games = await getAllGames()
    log.push(`GAMES: Found ${games.length} completed games`)
    
    let updated = 0
    
    // Process each pick
    for (const pick of picks) {
      const game = findGame(pick.game, games)
      if (!game) {
        log.push(`SKIP: ${pick.pick} (no game found)`)
        continue
      }
      
      const result = checkResult(pick.pick, game)
      if (!result) {
        log.push(`SKIP: ${pick.pick} (can't determine result)`)
        continue
      }
      
      // Add clarity to log about fades
      const isFade = pick.pick.toLowerCase().includes('fade')
      const resultNote = isFade ? `${result} (fade inverted)` : result
      
      // Update Supabase
      const updateRes = await fetch(
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
      
      if (updateRes.ok) {
        log.push(`UPDATE: ${pick.pick} = ${resultNote}`)
        updated++
      } else {
        log.push(`ERROR: Failed to update ${pick.pick}`)
      }
    }
    
    log.push(`SUCCESS: Updated ${updated} picks`)
    return res.json({ success: true, updated, log })
  } catch (err) {
    log.push(`FATAL ERROR: ${err.message}`)
    return res.json({ success: false, log, error: err.message })
  }
}
