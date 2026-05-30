// Grade pending picks and store W/L + units

import { requireCronAuth } from './auth-utils.js'
import {
  profitUnits,
  parseAmericanOdds,
  findGameForPick,
  gradePickResult,
} from './pick-utils.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const ODDS_API_KEY = process.env.ODDS_API_KEY || process.env.VITE_ODDS_API_KEY

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
            game_date: d.date || g.officialDate?.split('T')[0],
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
        const commence = g.commence_time ? g.commence_time.split('T')[0] : null
        return {
          away_team: g.away_team,
          home_team: g.home_team,
          away_score: parseInt(away?.score || 0, 10),
          home_score: parseInt(home?.score || 0, 10),
          sport: label,
          game_date: commence,
        }
      })
  } catch (e) {
    console.error(`Error fetching ${label} scores:`, e.message)
    return []
  }
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

function regradeWindowDays() {
  const raw = parseInt(process.env.REGRADE_DAYS || '21', 10)
  return Number.isNaN(raw) ? 21 : Math.min(60, Math.max(1, raw))
}

function isRegradeRequest(req) {
  const q = req.query?.regrade
  return q === '1' || q === 'true' || q === 'recent'
}

async function fetchPicksToGrade(regrade) {
  if (!regrade) {
    const picksRes = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_picks?select=*&result=is.null&limit=250&order=date.asc`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    )
    if (!picksRes.ok) return { error: picksRes.status, picks: [] }
    const picks = await picksRes.json()
    return { picks, mode: 'pending' }
  }

  const since = new Date()
  since.setDate(since.getDate() - regradeWindowDays())
  const sinceDate = since.toISOString().split('T')[0]

  const picksRes = await fetch(
    `${SUPABASE_URL}/rest/v1/daily_picks?select=*&date=gte.${sinceDate}&order=date.asc&limit=500`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  )
  if (!picksRes.ok) return { error: picksRes.status, picks: [] }
  const picks = (await picksRes.json()).filter(p => p.result && String(p.result).trim() !== '')
  return { picks, mode: 'regrade', sinceDate }
}

export default async function handler(req, res) {
  if (!requireCronAuth(req, res)) return

  const regrade = isRegradeRequest(req)
  const log = []

  try {
    log.push(`START: log-results${regrade ? ' (regrade)' : ''}`)

    const { picks, error, mode, sinceDate } = await fetchPicksToGrade(regrade)
    if (error) {
      log.push(`ERROR: Failed to fetch picks (${error})`)
      return res.status(500).json({ success: false, log })
    }

    log.push(
      mode === 'regrade'
        ? `PICKS: Regrading ${picks.length} graded picks since ${sinceDate}`
        : `PICKS: Found ${picks.length} pending`
    )

    if (picks.length === 0) {
      return res.json({ success: true, log, updated: 0, regrade })
    }

    const games = await fetchAllFinalGames()
    log.push(`GAMES: Found ${games.length} final games (MLB/NBA/NHL)`)

    let updated = 0
    let corrected = 0

    for (const pick of picks) {
      if (!pick.game || !pick.game.includes('@')) {
        log.push(`SKIP: ${pick.pick} (no matchup in game field)`)
        continue
      }

      const sportGames = pick.sport
        ? games.filter(g => g.sport === pick.sport || pick.sport === 'Mixed')
        : games

      const game = findGameForPick(pick.game, sportGames.length ? sportGames : games, pick.date)
      if (!game) {
        log.push(`SKIP: ${pick.game} on ${pick.date} (no final score for that date)`)
        continue
      }

      const pickText = `${pick.pick || ''} ${pick.bet || ''}`
      const result = gradePickResult({
        pickText,
        betType: pick.bet_type,
        pickGame: pick.game,
        game,
      })

      if (!result) {
        log.push(`SKIP: ${pick.pick} (can't determine W/L)`)
        continue
      }

      const previous = pick.result
      if (regrade && previous === result) continue

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
        const tag = regrade && previous !== result ? `FIXED ${previous}->` : ''
        log.push(
          `UPDATED: ${pick.pick} on ${pick.date} = ${tag}${result} (${units > 0 ? '+' : ''}${units.toFixed(2)}u)`
        )
        updated++
        if (regrade && previous !== result) corrected++
      } else {
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
          log.push(`UPDATED: ${pick.pick} on ${pick.date} = ${result} (no units column)`)
          updated++
          if (regrade && previous !== result) corrected++
        }
      }
    }

    log.push(`SUCCESS: Updated ${updated} picks${regrade ? ` (${corrected} corrected)` : ''}`)
    return res.json({ success: true, updated, corrected, regrade, log })
  } catch (err) {
    log.push(`FATAL: ${err.message}`)
    return res.status(500).json({ success: false, log, error: err.message })
  }
}
