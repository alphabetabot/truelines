// Grade pending picks and store W/L + units

import { profitUnits, parseAmericanOdds } from './pick-utils.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const ODDS_API_KEY = process.env.VITE_ODDS_API_KEY

async function getMLBGames() {
  try {
    const today = new Date()
    const endDate = today.toISOString().split('T')[0]
    const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

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
            away_score: parseInt(g.teams?.away?.score || 0, 10),
            home_score: parseInt(g.teams?.home?.score || 0, 10),
            sport: 'MLB',
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

async function getOddsApiScores(sportKey, label) {
  if (!ODDS_API_KEY) return []
  try {
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/scores?apiKey=${ODDS_API_KEY}&daysFrom=3`
    )
    const data = await res.json()
    if (!Array.isArray(data)) return []

    return data
      .filter(g => g.completed && g.scores?.length >= 2)
      .map(g => {
        const away = g.scores.find(s => s.name === g.away_team)
        const home = g.scores.find(s => s.name === g.home_team)
        return {
          away_team: g.away_team,
          home_team: g.home_team,
          away_score: parseInt(away?.score || 0, 10),
          home_score: parseInt(home?.score || 0, 10),
          sport: label,
        }
      })
  } catch (e) {
    console.error(`Error fetching ${label} scores:`, e.message)
    return []
  }
}

function teamLast(name) {
  return cleanText(name).split(' ').pop().toLowerCase()
}

function cleanText(value) {
  return String(value || '')
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function matchupParts(value) {
  const clean = cleanText(value)
  if (!clean.includes('@')) return null
  const parts = clean.split('@').map(p => cleanText(p))
  if (parts.length < 2 || !parts[0] || !parts[1]) return null
  return { first: parts[0], second: parts[1] }
}

function sideForTeamName(teamName, game) {
  const name = cleanText(teamName).toLowerCase()
  const away = cleanText(game.away_team).toLowerCase()
  const home = cleanText(game.home_team).toLowerCase()
  const nameLast = teamLast(name)

  if (name === away || nameLast === teamLast(away)) return 'away'
  if (name === home || nameLast === teamLast(home)) return 'home'
  return null
}

function pickNamesTeam(pick, game) {
  const matchup = matchupParts(pick)
  if (matchup) {
    const firstSide = sideForTeamName(matchup.first, game)
    if (firstSide) return firstSide
  }

  const normalizedPick = cleanText(pick).toLowerCase()
  const awayTeam = cleanText(game.away_team).toLowerCase()
  const homeTeam = cleanText(game.home_team).toLowerCase()
  const awayLast = teamLast(awayTeam)
  const homeLast = teamLast(homeTeam)

  if (normalizedPick.includes(awayTeam) || normalizedPick.includes(awayLast)) return 'away'
  if (normalizedPick.includes(homeTeam) || normalizedPick.includes(homeLast)) return 'home'
  return null
}

function getResult(pickText, game) {
  const away = game.away_score
  const home = game.home_score
  if (away == null || home == null) return null

  const raw = cleanText(pickText)
  const isFade = raw.toLowerCase().includes('fade')
  const pick = raw.toLowerCase().replace(/^fade:\s*/i, '')

  let result = null
  const margin = away - home

  // Moneyline
  if (pick.includes(' ml') || pick.endsWith(' ml') || /\bml\b/.test(pick) || /\bmoneyline\b/.test(pick) || matchupParts(pick)) {
    const side = pickNamesTeam(pick, game)
    if (side === 'away') result = away > home ? 'W' : 'L'
    else if (side === 'home') result = home > away ? 'W' : 'L'
  }

  // Spread / run line (e.g. "Dodgers -1.5")
  if (!result) {
    const spreadMatch = pick.match(/([+-]\d+\.?\d*)/)
    if (spreadMatch && !pick.includes('over') && !pick.includes('under')) {
      const line = parseFloat(spreadMatch[1])
      const side = pickNamesTeam(pick, game)
      if (side === 'away') result = margin + line > 0 ? 'W' : 'L'
      else if (side === 'home') result = -margin + line > 0 ? 'W' : 'L'
    }
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

  if (isFade && result) {
    result = result === 'W' ? 'L' : 'W'
  }

  return result
}

function findGame(pickGameStr, games) {
  if (!pickGameStr || !pickGameStr.includes('@')) return null

  const parts = cleanText(pickGameStr).split('@').map(p => cleanText(p))
  if (parts.length < 2) return null

  const [awayName, homeName] = parts

  return games.find(g => {
    if (g.away_team === awayName && g.home_team === homeName) return true
    if (g.away_team === homeName && g.home_team === awayName) return true

    const awayLast = teamLast(g.away_team)
    const homeLast = teamLast(g.home_team)
    const searchAwayLast = teamLast(awayName)
    const searchHomeLast = teamLast(homeName)

    return (
      (awayLast === searchAwayLast && homeLast === searchHomeLast) ||
      (awayLast === searchHomeLast && homeLast === searchAwayLast)
    )
  })
}

async function fetchAllFinalGames() {
  const [mlb, nba, nhl] = await Promise.all([
    getMLBGames(),
    getOddsApiScores('basketball_nba', 'NBA'),
    getOddsApiScores('icehockey_nhl', 'NHL'),
  ])
  return [...mlb, ...nba, ...nhl]
}

function resolveOdds(pick) {
  if (pick.odds != null && pick.odds !== '') {
    const n = typeof pick.odds === 'number' ? pick.odds : parseAmericanOdds(pick.odds)
    if (n) return n
  }
  if (pick.bet) return parseAmericanOdds(pick.bet)
  return null
}

export default async function handler(req, res) {
  const log = []

  try {
    log.push('START: log-results')

    const picksRes = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_picks?select=*&result=is.null&limit=100&order=date.desc`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
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

    const games = await fetchAllFinalGames()
    log.push(`GAMES: Found ${games.length} final games (MLB/NBA/NHL)`)

    let updated = 0

    for (const pick of picks) {
      if (!pick.game || !pick.game.includes('@')) {
        log.push(`SKIP: ${pick.pick} (no matchup in game field)`)
        continue
      }

      const sportGames = pick.sport
        ? games.filter(g => g.sport === pick.sport || pick.sport === 'Mixed')
        : games

      const game = findGame(pick.game, sportGames.length ? sportGames : games)
      if (!game) {
        log.push(`SKIP: ${pick.game} (no final score match)`)
        continue
      }

      const result = getResult(pick.pick, game)
      if (!result) {
        log.push(`SKIP: ${pick.pick} (can't determine W/L)`)
        continue
      }

      const odds = resolveOdds(pick)
      const units = profitUnits(odds, result === 'W')

      const updateRes = await fetch(
        `${SUPABASE_URL}/rest/v1/daily_picks?id=eq.${pick.id}`,
        {
          method: 'PATCH',
          headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ result, units }),
        }
      )

      if (updateRes.ok) {
        log.push(`UPDATED: ${pick.pick} = ${result} (${units > 0 ? '+' : ''}${units.toFixed(2)}u)`)
        updated++
      } else {
        // Retry without units if column missing
        const retryRes = await fetch(
          `${SUPABASE_URL}/rest/v1/daily_picks?id=eq.${pick.id}`,
          {
            method: 'PATCH',
            headers: {
              apikey: SUPABASE_SERVICE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ result }),
          }
        )
        if (retryRes.ok) {
          log.push(`UPDATED: ${pick.pick} = ${result} (no units column)`)
          updated++
        }
      }
    }

    log.push(`SUCCESS: Updated ${updated} picks`)
    return res.json({ success: true, updated, log })
  } catch (err) {
    log.push(`FATAL: ${err.message}`)
    return res.json({ success: false, log, error: err.message })
  }
}
