/** Live period / inning labels — Odds API scores lack this; MLB Stats + ESPN scoreboards fill the gap. */

const MLB_BASE = 'https://statsapi.mlb.com/api/v1'

const ESPN_SPORT_PATH = {
  baseball_mlb: 'baseball/mlb',
  basketball_nba: 'basketball/nba',
  basketball_ncaab: 'basketball/mens-college-basketball',
  icehockey_nhl: 'hockey/nhl',
  americanfootball_nfl: 'football/nfl',
  americanfootball_ncaaf: 'football/college-football',
  soccer_fifa_world_cup: 'soccer/fifa.world',
  soccer_epl: 'soccer/eng.1',
  soccer_usa_mls: 'soccer/usa.1',
}

export function normalizeTeamName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function gameStatusKey(awayTeam, homeTeam) {
  return `${normalizeTeamName(awayTeam)}|${normalizeTeamName(homeTeam)}`
}

/** Full name, two-word nickname, and last word — for Odds API ↔ MLB/ESPN matching. */
export function teamNameAliases(name) {
  if (!name) return []
  const parts = name.trim().split(/\s+/)
  const aliases = [name]
  if (parts.length >= 2) aliases.push(parts.slice(-2).join(' '))
  aliases.push(parts[parts.length - 1])
  return [...new Set(aliases.filter(Boolean))]
}

function setStatusEntry(map, away, home, label) {
  for (const a of teamNameAliases(away)) {
    for (const h of teamNameAliases(home)) {
      map[gameStatusKey(a, h)] = label
    }
  }
}

function formatMlbLiveStatus(game) {
  if (game.status?.abstractGameState !== 'Live') return null
  const ls = game.linescore
  if (!ls) return null

  const ordinal = ls.currentInningOrdinal || (ls.currentInning ? `${ls.currentInning}th` : null)
  if (!ordinal) return null

  const state = ls.inningState
  if (state === 'Top') return `Top ${ordinal}`
  if (state === 'Bottom') return `Bot ${ordinal}`
  if (state === 'Middle') return `Mid ${ordinal}`
  if (state === 'End') return `End ${ordinal}`
  if (ls.isTopInning) return `Top ${ordinal}`
  if (ls.inningHalf === 'Top') return `Top ${ordinal}`
  return `Bot ${ordinal}`
}

function formatEspnLiveStatus(competition) {
  const status = competition?.status
  const type = status?.type
  if (!type || type.state !== 'in') return null

  const short = type.shortDetail?.trim()
  if (short && !/^\d{1,2}\/\d{1,2}/.test(short) && !short.includes('EDT') && !short.includes('PM ')) {
    return short
  }

  const detail = type.detail?.trim()
  if (detail && detail !== 'In Progress' && !detail.includes('EDT')) {
    return detail
  }

  const period = status.period
  const clock = status.displayClock
  if (period && clock && clock !== '0.0') {
    const sport = competition?.type?.slug || ''
    if (sport.includes('football')) return `Q${period} ${clock}`
    if (sport.includes('hockey')) return `P${period} ${clock}`
    if (sport.includes('basketball')) return `Q${period} ${clock}`
    return `P${period} ${clock}`
  }

  if (period) return `Period ${period}`
  return null
}

async function fetchMlbLiveStatusMap() {
  const today = new Date().toISOString().split('T')[0]
  try {
    const res = await fetch(
      `${MLB_BASE}/schedule?sportId=1&date=${today}&hydrate=linescore`,
    )
    if (!res.ok) return {}
    const data = await res.json()
    const map = {}

    for (const day of data.dates || []) {
      for (const game of day.games || []) {
        const label = formatMlbLiveStatus(game)
        if (!label) continue
        const away = game.teams?.away?.team?.name
        const home = game.teams?.home?.team?.name
        if (away && home) setStatusEntry(map, away, home, label)
      }
    }
    return map
  } catch (e) {
    console.warn('MLB live status fetch failed:', e)
    return {}
  }
}

async function fetchEspnLiveStatusMap(espnPath) {
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${espnPath}/scoreboard`,
    )
    if (!res.ok) return {}
    const data = await res.json()
    const map = {}

    for (const event of data.events || []) {
      const comp = event.competitions?.[0]
      if (!comp) continue
      const label = formatEspnLiveStatus(comp)
      if (!label) continue

      const competitors = comp.competitors || []
      const home = competitors.find(c => c.homeAway === 'home')
      const away = competitors.find(c => c.homeAway === 'away')
      const homeName = home?.team?.displayName || home?.team?.name
      const awayName = away?.team?.displayName || away?.team?.name
      if (homeName && awayName) {
        setStatusEntry(map, awayName, homeName, label)
      }
    }
    return map
  } catch (e) {
    console.warn('ESPN live status fetch failed:', e)
    return {}
  }
}

export async function fetchLiveStatusMapForSport(sportKey) {
  if (sportKey === 'baseball_mlb') {
    const mlb = await fetchMlbLiveStatusMap()
    if (Object.keys(mlb).length > 0) return mlb
    const path = ESPN_SPORT_PATH.baseball_mlb
    return fetchEspnLiveStatusMap(path)
  }

  const path = ESPN_SPORT_PATH[sportKey]
  if (!path) return {}
  return fetchEspnLiveStatusMap(path)
}

export function lookupLiveStatus(game, statusMap) {
  if (!game || !statusMap) return null
  for (const a of teamNameAliases(game.away_team)) {
    for (const h of teamNameAliases(game.home_team)) {
      const hit = statusMap[gameStatusKey(a, h)]
      if (hit) return hit
    }
  }
  return null
}

/** Badge text for score cards and ticker. */
export function formatLiveStatusBadge({ isFinal, isLive, gameTime, liveDetail }) {
  if (isFinal) {
    return { label: 'Final', bg: 'rgba(148,163,184,0.25)', color: 'var(--text-muted)' }
  }
  if (isLive) {
    const label = liveDetail ? `● ${liveDetail}` : '● LIVE'
    return { label, bg: 'rgba(74,222,128,0.2)', color: 'var(--green-live)' }
  }
  return {
    label: gameTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    bg: 'rgba(251,191,36,0.2)',
    color: 'var(--gold)',
  }
}
