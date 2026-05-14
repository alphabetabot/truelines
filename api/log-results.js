// Result logger - completely rewritten for reliability

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

async function getMLBGames() {
  try {
    const today = new Date()
    const endDate = today.toISOString().split('T')[0]
    const startDate = new Date(today.getTime() - 7*24*60*60*1000).toISOString().split('T')[0] // Last 7 days
    
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${startDate}&endDate=${endDate}&hydrate=team`
    )
    const data = await res.json()
    const games = []
    
    data.dates?.forEach(d => {
      d.games?.forEach(g => {
        if (g.status?.abstractGameState === 'Final' || g.status?.abstractGameState === 'Completed Early') {
          games.push({
            away_team: g.teams?.away?.team?.name,
            home_team: g.teams?.home?.team?.name,
            away_score: parseInt(g.teams?.away?.score || 0),
            home_score: parseInt(g.teams?.home?.score || 0),
            sport: 'MLB'
          })
        }
      })
    })
    
    return games
  } catch (e) {
    console.error('Error fetching MLB games:', e.message)
    return []
  }
}

function getResult(pickText, game) {
  const away = game.away_score
  const home = game.home_score
  
  if (away === null || home === null) return null
  
  const pick = pickText.toLowerCase().trim().replace(/^fade:\s*/i, '')
  const isFade = pickText.toLowerCase().includes('fade')
  
  let result = null
  
  // Moneyline
  if (pick.includes('ml')) {
    const awayTeamLast = game.away_team.split(' ').pop().toLowerCase()
    const homeTeamLast = game.home_team.split(' ').pop().toLowerCase()
    
    if (pick.includes(awayTeamLast) && away > home) result = 'W'
    else if (pick.includes(awayTeamLast) && away < home) result = 'L'
    else if (pick.includes(homeTeamLast) && home > away) result = 'W'
    else if (pick.includes(homeTeamLast) && home < away) result = 'L'
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
  
  // Invert if fade
  if (isFade && result) {
    result = result === 'W' ? 'L' : 'W'
  }
  
  return result
}

function findGame(pickGameStr, games) {
  if (!pickGameStr || !pickGameStr.includes('@')) return null
  
  const parts = pickGameStr.split('@').map(p => p.trim())
  if (parts.length < 2) return null
  
  const [awayName, homeName] = parts
  
  return games.find(g => {
    // Try exact match first
    if (g.away_team === awayName && g.home_team === homeName) return true
    
    // Try last word match (e.g., "Dodgers" matches "Los Angeles Dodgers")
    const awayLast = g.away_team.split(' ').pop().toLowerCase()
    const homeLast = g.home_team.split(' ').pop().toLowerCase()
    const searchAwayLast = awayName.split(' ').pop().toLowerCase()
    const searchHomeLast = homeName.split(' ').pop().toLowerCase()
    
    return awayLast === searchAwayLast && homeLast === searchHomeLast
  })
}

export default async function handler(req, res) {
  const log = []
  
  try {
    log.push('START: log-results')
    
    // Fetch picks without results
    const picksRes = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_picks?select=*&result=is.null&limit=100&order=date.desc`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
      }
    )
    
    if (!picksRes.ok) {
      log.push(`ERROR: Failed to fetch picks (${picksRes.status})`)
      return res.json({ success: false, log })
    }
    
    const picks = await picksRes.json()
    log.push(`PICKS: Found ${picks.length} pending`)
    
    if (picks.length === 0) {
      return res.json({ success: true, log, updated: 0 })
    }
    
    // Fetch games
    const games = await getMLBGames()
    log.push(`GAMES: Found ${games.length} final MLB games`)
    
    let updated = 0
    
    for (const pick of picks) {
      if (!pick.game) {
        log.push(`SKIP: ${pick.pick} (no game field)`)
        continue
      }
      
      const game = findGame(pick.game, games)
      if (!game) {
        log.push(`SKIP: ${pick.game} (no match)`)
        continue
      }
      
      const result = getResult(pick.pick, game)
      if (!result) {
        log.push(`SKIP: ${pick.pick} (can't determine W/L)`)
        continue
      }
      
      // Update pick
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
        log.push(`UPDATED: ${pick.pick} = ${result}`)
        updated++
      }
    }
    
    log.push(`SUCCESS: Updated ${updated} picks`)
    return res.json({ success: true, updated, log })
  } catch (err) {
    log.push(`FATAL: ${err.message}`)
    return res.json({ success: false, log, error: err.message })
  }
}
