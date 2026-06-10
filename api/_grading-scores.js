// Final score providers for pick grading (MLB Stats API + The Odds API)

import { pacificDateKey } from './_date-utils.js'

const ODDS_API_KEY = process.env.ODDS_API_KEY || process.env.VITE_ODDS_API_KEY

function addDays(isoDate, delta) {
  const d = new Date(`${isoDate}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().split('T')[0]
}

export function scoreWindowForPicks(picks, { paddingDays = 2, minDays = 10, maxDays = 45 } = {}) {
  const dates = (picks || []).map(p => p.date).filter(Boolean).sort()
  const today = new Date().toISOString().split('T')[0]

  if (dates.length === 0) {
    return { startDate: addDays(today, -minDays), endDate: today }
  }

  let startDate = addDays(dates[0], -paddingDays)
  let endDate = addDays(dates[dates.length - 1], paddingDays)
  if (endDate < today) endDate = today

  const span =
    (new Date(`${endDate}T12:00:00Z`) - new Date(`${startDate}T12:00:00Z`)) / (24 * 60 * 60 * 1000)
  if (span > maxDays) {
    startDate = addDays(endDate, -maxDays)
  }

  return { startDate, endDate }
}

export async function getMLBGamesInRange(startDate, endDate) {
  try {
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${startDate}&endDate=${endDate}&hydrate=team`
    )
    const data = await res.json()
    const games = []

    data.dates?.forEach(d => {
      d.games?.forEach(g => {
        if (g.status?.abstractGameState === 'Final' || g.status?.abstractGameState === 'Completed Early') {
          const scheduleDate = d.date || g.officialDate?.split('T')[0]
          const commenceIso = g.gameDate || g.officialDate
          const pacific_date = commenceIso ? pacificDateKey(new Date(commenceIso)) : scheduleDate
          games.push({
            away_team: g.teams?.away?.team?.name,
            home_team: g.teams?.home?.team?.name,
            away_score: parseInt(g.teams?.away?.score || 0, 10),
            home_score: parseInt(g.teams?.home?.score || 0, 10),
            sport: 'MLB',
            game_date: scheduleDate,
            pacific_date,
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

export async function getOddsApiScores(sportKey, label, daysFrom = 3) {
  if (!ODDS_API_KEY) return []
  const clamped = Math.min(3, Math.max(1, daysFrom))
  try {
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/scores?apiKey=${ODDS_API_KEY}&daysFrom=${clamped}`
    )
    const data = await res.json()
    if (!Array.isArray(data)) return []

    return data
      .filter(g => g.completed && g.scores?.length >= 2)
      .map(g => {
        const away = g.scores.find(s => s.name === g.away_team)
        const home = g.scores.find(s => s.name === g.home_team)
        const commence = g.commence_time ? g.commence_time.split('T')[0] : null
        const pacific_date = g.commence_time ? pacificDateKey(new Date(g.commence_time)) : commence
        return {
          away_team: g.away_team,
          home_team: g.home_team,
          away_score: parseInt(away?.score || 0, 10),
          home_score: parseInt(home?.score || 0, 10),
          sport: label,
          game_date: commence,
          pacific_date,
        }
      })
  } catch (e) {
    console.error(`Error fetching ${label} scores:`, e.message)
    return []
  }
}

export async function fetchFinalGamesForPicks(picks) {
  const { startDate, endDate } = scoreWindowForPicks(picks)
  const mlb = await getMLBGamesInRange(startDate, endDate)
  const [nba, nhl] = await Promise.all([
    getOddsApiScores('basketball_nba', 'NBA', 3),
    getOddsApiScores('icehockey_nhl', 'NHL', 3),
  ])
  return { games: [...mlb, ...nba, ...nhl], startDate, endDate }
}

export { addDays }
