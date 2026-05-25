const MLB_BASE = 'https://statsapi.mlb.com/api/v1'

// Get today's probable pitchers with full season stats
export async function getTodayProbablePitchers() {
  const today = new Date().toISOString().split('T')[0]

  try {
    const res = await fetch(
      `${MLB_BASE}/schedule?sportId=1&date=${today}&hydrate=probablePitcher,team,weather,venue`
    )
    if (!res.ok) return {}
    const data = await res.json()

    const pitcherIds = []
    const pitcherMap = {} // teamName -> { name, id, gameId, venueName, weather }
    const gameContextMap = {} // gameId -> { venue, weather, homeTeam, awayTeam }

    data.dates?.forEach(d => {
      d.games?.forEach(game => {
        const venueName = game.venue?.name || 'Unknown Ballpark'
        const weather = game.weather || null
        const gameId = game.gamePk

        gameContextMap[gameId] = {
          venueName,
          weather,
          homeTeam: game.teams?.home?.team?.name,
          awayTeam: game.teams?.away?.team?.name,
        }

        const sides = [
          { side: game.teams?.away, teamName: game.teams?.away?.team?.name },
          { side: game.teams?.home, teamName: game.teams?.home?.team?.name },
        ]

        sides.forEach(({ side, teamName }) => {
          if (side?.probablePitcher && teamName) {
            const p = side.probablePitcher
            pitcherMap[teamName] = {
              name: p.fullName,
              id: p.id,
              gameId,
              venueName,
              weather,
            }
            // Also store by last word for fuzzy matching
            const lastWord = teamName.split(' ').slice(-1)[0]
            pitcherMap[lastWord] = pitcherMap[teamName]
            if (p.id) pitcherIds.push(p.id)
          }
        })
      })
    })

    if (pitcherIds.length === 0) return {}

    // Fetch full season stats for all pitchers
    const statsRes = await fetch(
      `${MLB_BASE}/people?personIds=${[...new Set(pitcherIds)].join(',')}&hydrate=stats(group=pitching,type=season),currentTeam`
    )
    if (!statsRes.ok) return buildBasicMap(pitcherMap)
    const statsData = await statsRes.json()

    const statsByID = {}
    statsData.people?.forEach(person => {
      const seasonStats = person.stats?.find(
        s => s.group?.displayName === 'pitching' && s.type?.displayName === 'season'
      )
      const s = seasonStats?.splits?.[0]?.stat
      statsByID[person.id] = {
        wins: s?.wins ?? 0,
        losses: s?.losses ?? 0,
        era: s?.era ?? '-.--',
        strikeouts: s?.strikeOuts ?? 0,
        whip: s?.whip ?? '-.--',
        inningsPitched: s?.inningsPitched ?? '0.0',
        strikeoutsPer9: s?.strikeoutsPer9Inn ?? '0.00',
        homeRunsPer9: s?.homeRunsPer9 ?? '0.00',
        oppAvg: s?.avg ?? '.000',
      }
    })

    // Build final result
    const result = {}
    const seen = new Set()

    Object.entries(pitcherMap).forEach(([teamName, { name, id, venueName, weather }]) => {
      if (seen.has(id)) {
        result[teamName] = result[Object.keys(result).find(k => result[k].id === id)]
        return
      }
      seen.add(id)
      const stats = statsByID[id] || {}
      result[teamName] = { name, id, ...stats, venueName, weather }
    })

    return result
  } catch (e) {
    console.warn('MLB pitcher fetch failed:', e)
    return {}
  }
}

// Get ballpark factors (pitcher vs hitter friendly)
export const BALLPARK_FACTORS = {
  'Coors Field': { type: 'hitter', factor: 'Extreme hitter-friendly (high altitude, thin air)', runFactor: 1.35 },
  'Great American Ball Park': { type: 'hitter', factor: 'Hitter-friendly (short porch in LF)', runFactor: 1.12 },
  'Fenway Park': { type: 'hitter', factor: 'Hitter-friendly (Green Monster)', runFactor: 1.10 },
  'Yankee Stadium': { type: 'hitter', factor: 'Slight hitter-friendly (short RF porch)', runFactor: 1.06 },
  'Globe Life Field': { type: 'neutral', factor: 'Neutral', runFactor: 1.00 },
  'Truist Park': { type: 'neutral', factor: 'Slight hitter-friendly', runFactor: 1.03 },
  'Oracle Park': { type: 'pitcher', factor: 'Pitcher-friendly (marine layer, large foul territory)', runFactor: 0.91 },
  'Petco Park': { type: 'pitcher', factor: 'Pitcher-friendly (spacious outfield)', runFactor: 0.88 },
  'Dodger Stadium': { type: 'pitcher', factor: 'Slight pitcher-friendly', runFactor: 0.95 },
  'Kauffman Stadium': { type: 'pitcher', factor: 'Pitcher-friendly (large outfield)', runFactor: 0.93 },
  'T-Mobile Park': { type: 'pitcher', factor: 'Pitcher-friendly (marine layer)', runFactor: 0.90 },
  'Camden Yards': { type: 'hitter', factor: 'Hitter-friendly (short RF)', runFactor: 1.08 },
  'Wrigley Field': { type: 'neutral', factor: 'Wind-dependent (can be pitcher or hitter friendly)', runFactor: 1.01 },
  'Guaranteed Rate Field': { type: 'hitter', factor: 'Hitter-friendly', runFactor: 1.09 },
  'Target Field': { type: 'pitcher', factor: 'Slight pitcher-friendly (cold weather)', runFactor: 0.96 },
  'Busch Stadium': { type: 'pitcher', factor: 'Slight pitcher-friendly', runFactor: 0.97 },
  'American Family Field': { type: 'neutral', factor: 'Neutral (retractable roof)', runFactor: 1.00 },
  'Progressive Field': { type: 'pitcher', factor: 'Pitcher-friendly', runFactor: 0.94 },
  'PNC Park': { type: 'pitcher', factor: 'Pitcher-friendly (large outfield)', runFactor: 0.92 },
  'Minute Maid Park': { type: 'neutral', factor: 'Neutral (retractable roof)', runFactor: 1.02 },
  'Chase Field': { type: 'hitter', factor: 'Hitter-friendly (hot, dry air)', runFactor: 1.05 },
  'loanDepot Park': { type: 'pitcher', factor: 'Pitcher-friendly (retractable roof, spacious)', runFactor: 0.89 },
  'Citi Field': { type: 'pitcher', factor: 'Pitcher-friendly (large outfield)', runFactor: 0.93 },
  'Citizens Bank Park': { type: 'hitter', factor: 'Hitter-friendly', runFactor: 1.07 },
  'Nationals Park': { type: 'neutral', factor: 'Neutral', runFactor: 0.99 },
  'Tropicana Field': { type: 'pitcher', factor: 'Pitcher-friendly (domed, artificial turf)', runFactor: 0.93 },
  'Rogers Centre': { type: 'hitter', factor: 'Hitter-friendly (turf, domed)', runFactor: 1.04 },
  'Oakland Coliseum': { type: 'pitcher', factor: 'Pitcher-friendly (large foul territory, marine layer)', runFactor: 0.87 },
  'Angel Stadium': { type: 'neutral', factor: 'Slight pitcher-friendly', runFactor: 0.97 },
  'Sutter Health Park': { type: 'neutral', factor: 'Neutral', runFactor: 1.00 },
}

export function getBallparkInfo(venueName) {
  if (!venueName) return null
  // Try exact match first
  if (BALLPARK_FACTORS[venueName]) return { ...BALLPARK_FACTORS[venueName], name: venueName }
  // Try partial match
  const match = Object.entries(BALLPARK_FACTORS).find(([k]) =>
    venueName.includes(k) || k.includes(venueName)
  )
  return match ? { ...match[1], name: venueName } : { type: 'neutral', factor: 'Standard conditions', runFactor: 1.00, name: venueName }
}

function buildBasicMap(pitcherMap) {
  const result = {}
  Object.entries(pitcherMap).forEach(([teamName, { name, venueName, weather }]) => {
    result[teamName] = { name, wins: 0, losses: 0, era: '-.--', venueName, weather }
  })
  return result
}
