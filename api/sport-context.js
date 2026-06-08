/**
 * Free sport context for daily picks — ESPN public endpoints + MLB Stats API fields.
 * No API key required. Used by cron-newsletter to enrich Claude prompts.
 */

const ESPN_SITE = 'https://site.api.espn.com/apis/site/v2/sports'
const ESPN_STANDINGS = 'https://site.api.espn.com/apis/v2/sports'

const ESPN_PATH = {
  MLB: 'baseball/mlb',
  NBA: 'basketball/nba',
  NHL: 'hockey/nhl',
}

const IMPACT_INJURY = new Set([
  'out',
  'doubtful',
  'questionable',
  'day-to-day',
  'day to day',
  'injured list',
  '10-day-il',
  '60-day-il',
  'ir',
  'suspended',
])

export function normalizeTeamName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function teamNameMatches(oddsName, espnName) {
  if (!oddsName || !espnName) return false
  const a = normalizeTeamName(oddsName)
  const b = normalizeTeamName(espnName)
  if (a === b || a.includes(b) || b.includes(a)) return true
  const lastA = oddsName.trim().split(/\s+/).pop()?.toLowerCase()
  const lastB = espnName.trim().split(/\s+/).pop()?.toLowerCase()
  return Boolean(lastA && lastB && lastA === lastB)
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function parseInjuryBlock(teamBlock) {
  return (teamBlock.injuries || [])
    .filter(inj => IMPACT_INJURY.has(String(inj.status || '').toLowerCase()))
    .slice(0, 5)
    .map(inj => ({
      player: inj.athlete?.displayName || 'Unknown',
      status: inj.status || 'Out',
      note: (inj.shortComment || inj.longComment || '').slice(0, 140),
    }))
}

function indexInjuries(data) {
  const out = {}
  for (const teamBlock of data?.injuries || []) {
    const list = parseInjuryBlock(teamBlock)
    if (list.length) out[teamBlock.displayName] = list
  }
  return out
}

function statValue(stats, ...names) {
  for (const name of names) {
    const hit = stats.find(s => s.name === name)
    if (hit?.displayValue != null) return hit.displayValue
  }
  return null
}

function parseStandings(data) {
  const out = {}
  for (const conf of data?.children || []) {
    for (const entry of conf?.standings?.entries || []) {
      const teamName = entry.team?.displayName
      if (!teamName) continue
      const stats = entry.stats || []
      out[teamName] = {
        record: statValue(stats, 'overall'),
        wins: statValue(stats, 'wins'),
        losses: statValue(stats, 'losses'),
        home: statValue(stats, 'Home'),
        road: statValue(stats, 'Road'),
        lastTen: statValue(stats, 'Last Ten Games'),
        streak: statValue(stats, 'streak'),
        ppg: statValue(stats, 'avgPointsFor'),
        oppPpg: statValue(stats, 'avgPointsAgainst'),
        pointDiff: statValue(stats, 'differential', 'pointDifferential'),
        points: statValue(stats, 'points'),
        goalsFor: statValue(stats, 'pointsFor'),
        goalsAgainst: statValue(stats, 'pointsAgainst'),
      }
    }
  }
  return out
}

function parseNhlProbables(data) {
  const out = {}
  for (const event of data?.events || []) {
    const comp = event.competitions?.[0]
    if (!comp) continue
    const home = comp.competitors?.find(c => c.homeAway === 'home')
    const away = comp.competitors?.find(c => c.homeAway === 'away')
    if (!home?.team?.displayName || !away?.team?.displayName) continue
    const key = `${away.team.displayName}|${home.team.displayName}`
    out[key] = {
      awayGoalie: away.probables?.find(p => p.name === 'probableStartingGoalie')?.athlete?.displayName || null,
      homeGoalie: home.probables?.find(p => p.name === 'probableStartingGoalie')?.athlete?.displayName || null,
    }
  }
  return out
}

function lookupByTeam(map, teamName) {
  if (!map || !teamName) return null
  for (const [espnName, value] of Object.entries(map)) {
    if (teamNameMatches(teamName, espnName)) return value
  }
  return null
}

/** Fetch league injuries, standings, and NHL probables once per newsletter run. */
export async function loadSportContextBundle() {
  const [mlbInj, nbaInj, nhlInj, nbaStand, nhlStand, nhlBoard] = await Promise.all([
    fetchJson(`${ESPN_SITE}/${ESPN_PATH.MLB}/injuries`),
    fetchJson(`${ESPN_SITE}/${ESPN_PATH.NBA}/injuries`),
    fetchJson(`${ESPN_SITE}/${ESPN_PATH.NHL}/injuries`),
    fetchJson(`${ESPN_STANDINGS}/${ESPN_PATH.NBA}/standings`),
    fetchJson(`${ESPN_STANDINGS}/${ESPN_PATH.NHL}/standings`),
    fetchJson(`${ESPN_SITE}/${ESPN_PATH.NHL}/scoreboard`),
  ])

  return {
    injuries: {
      MLB: indexInjuries(mlbInj),
      NBA: indexInjuries(nbaInj),
      NHL: indexInjuries(nhlInj),
    },
    standings: {
      NBA: parseStandings(nbaStand),
      NHL: parseStandings(nhlStand),
    },
    nhlProbables: parseNhlProbables(nhlBoard),
  }
}

export function getTeamInjuries(sport, teamName, bundle) {
  return lookupByTeam(bundle?.injuries?.[sport], teamName) || []
}

export function getTeamStanding(sport, teamName, bundle) {
  return lookupByTeam(bundle?.standings?.[sport], teamName)
}

export function getNhlGoalies(away, home, bundle) {
  for (const [key, val] of Object.entries(bundle?.nhlProbables || {})) {
    const [a, h] = key.split('|')
    if (teamNameMatches(away, a) && teamNameMatches(home, h)) return val
  }
  return null
}

export function formatMlbWeatherReport(weather) {
  if (!weather) return null
  const parts = []
  if (weather.temp != null && weather.temp !== '') parts.push(`${weather.temp}°F`)
  if (weather.condition) parts.push(weather.condition)
  if (weather.wind) parts.push(`wind ${weather.wind}`)
  if (weather.precip != null && weather.precip !== '' && weather.precip !== '0') {
    parts.push(`precip ${weather.precip}`)
  }
  return parts.length ? parts.join(', ') : null
}

export function formatInjuryLines(injuries, max = 4) {
  return (injuries || []).slice(0, max).map(i => {
    const note = i.note ? ` — ${i.note}` : ''
    return `${i.player} (${i.status})${note}`
  })
}

export function formatNbaStandingLine(team, standing) {
  if (!standing) return null
  const bits = [
    standing.record ? `${team} ${standing.record}` : null,
    standing.ppg ? `PPG ${standing.ppg}` : null,
    standing.oppPpg ? `OPP ${standing.oppPpg}` : null,
    standing.home ? `Home ${standing.home}` : null,
    standing.road ? `Road ${standing.road}` : null,
    standing.lastTen ? `L10 ${standing.lastTen}` : null,
    standing.streak ? `Streak ${standing.streak}` : null,
  ].filter(Boolean)
  return bits.length ? bits.join(' | ') : null
}

export function formatNhlStandingLine(team, standing) {
  if (!standing) return null
  const bits = [
    standing.record ? `${team} ${standing.record}` : null,
    standing.points ? `${standing.points} pts` : null,
    standing.goalsFor && standing.goalsAgainst
      ? `GF/GA ${standing.goalsFor}/${standing.goalsAgainst}`
      : null,
    standing.home ? `Home ${standing.home}` : null,
    standing.road ? `Road ${standing.road}` : null,
    standing.lastTen ? `L10 ${standing.lastTen}` : null,
    standing.streak ? `Streak ${standing.streak}` : null,
  ].filter(Boolean)
  return bits.length ? bits.join(' | ') : null
}

/** Merge ESPN context into a game's stats object (after sport-specific fetches). */
export function applySportContext(game, bundle) {
  const stats = { ...(game.stats || {}) }
  const sport = game.sport

  if (sport === 'MLB') {
    stats.awayInjuries = getTeamInjuries('MLB', game.away, bundle)
    stats.homeInjuries = getTeamInjuries('MLB', game.home, bundle)
    stats.weatherReport = formatMlbWeatherReport(game.weather)
  }

  if (sport === 'NBA') {
    stats.awayStanding = getTeamStanding('NBA', game.away, bundle)
    stats.homeStanding = getTeamStanding('NBA', game.home, bundle)
    stats.awayInjuries = getTeamInjuries('NBA', game.away, bundle)
    stats.homeInjuries = getTeamInjuries('NBA', game.home, bundle)
  }

  if (sport === 'NHL') {
    stats.awayStanding = getTeamStanding('NHL', game.away, bundle)
    stats.homeStanding = getTeamStanding('NHL', game.home, bundle)
    stats.awayInjuries = getTeamInjuries('NHL', game.away, bundle)
    stats.homeInjuries = getTeamInjuries('NHL', game.home, bundle)
    const goalies = getNhlGoalies(game.away, game.home, bundle)
    if (goalies) {
      stats.awayGoalie = goalies.awayGoalie
      stats.homeGoalie = goalies.homeGoalie
    }
  }

  return stats
}

/** Append one game's context block to the STATS section string. */
export function appendGameStatsBlock(g, ballparkInfo) {
  let block = `${g.sport}: ${g.away} @ ${g.home}\n`

  if (g.sport === 'MLB') {
    if (g.stats?.awayPitcher && g.awayPitcher) {
      const p = g.stats.awayPitcher
      block += `  Away SP ${g.awayPitcher}: ${p.wins}-${p.losses}, ERA ${p.era}, K/9 ${p.k9}, WHIP ${p.whip}, Opp AVG ${p.oppAvg}, HR/9 ${p.hr9}\n`
    }
    if (g.stats?.homePitcher && g.homePitcher) {
      const p = g.stats.homePitcher
      block += `  Home SP ${g.homePitcher}: ${p.wins}-${p.losses}, ERA ${p.era}, K/9 ${p.k9}, WHIP ${p.whip}, Opp AVG ${p.oppAvg}, HR/9 ${p.hr9}\n`
    }
    if (g.stats?.awayTeam) {
      block += `  ${g.away}: ${g.stats.awayTeam.wins}W-${g.stats.awayTeam.losses}L (${(g.stats.awayTeam.runDiff >= 0 ? '+' : '')}${g.stats.awayTeam.runDiff} run diff)\n`
    }
    if (g.stats?.homeTeam) {
      block += `  ${g.home}: ${g.stats.homeTeam.wins}W-${g.stats.homeTeam.losses}L (${(g.stats.homeTeam.runDiff >= 0 ? '+' : '')}${g.stats.homeTeam.runDiff} run diff)\n`
    }
    if (g.venue && ballparkInfo) block += `  Ballpark: ${ballparkInfo(g.venue)}\n`
    const weather = g.stats?.weatherReport || formatMlbWeatherReport(g.weather)
    if (weather) block += `  Weather: ${weather}\n`
    const awayInj = formatInjuryLines(g.stats?.awayInjuries, 3)
    const homeInj = formatInjuryLines(g.stats?.homeInjuries, 3)
    if (awayInj.length) block += `  ${g.away} injuries: ${awayInj.join('; ')}\n`
    if (homeInj.length) block += `  ${g.home} injuries: ${homeInj.join('; ')}\n`
  }

  if (g.sport === 'NBA') {
    const awayLine = formatNbaStandingLine(g.away, g.stats?.awayStanding)
    const homeLine = formatNbaStandingLine(g.home, g.stats?.homeStanding)
    if (awayLine) block += `  ${awayLine}\n`
    if (homeLine) block += `  ${homeLine}\n`
    const awayInj = formatInjuryLines(g.stats?.awayInjuries, 4)
    const homeInj = formatInjuryLines(g.stats?.homeInjuries, 4)
    if (awayInj.length) block += `  ${g.away} injuries: ${awayInj.join('; ')}\n`
    if (homeInj.length) block += `  ${g.home} injuries: ${homeInj.join('; ')}\n`
    if (!awayLine && !homeLine && !awayInj.length && !homeInj.length) {
      block += `  Team records/injuries not available for this matchup.\n`
    }
  }

  if (g.sport === 'NHL') {
    const awayLine = formatNhlStandingLine(g.away, g.stats?.awayStanding)
    const homeLine = formatNhlStandingLine(g.home, g.stats?.homeStanding)
    if (awayLine) block += `  ${awayLine}\n`
    if (homeLine) block += `  ${homeLine}\n`
    if (g.stats?.awayGoalie || g.stats?.homeGoalie) {
      block += `  Goalies: ${g.away} ${g.stats.awayGoalie || 'TBD'} vs ${g.home} ${g.stats.homeGoalie || 'TBD'}\n`
    }
    const awayInj = formatInjuryLines(g.stats?.awayInjuries, 4)
    const homeInj = formatInjuryLines(g.stats?.homeInjuries, 4)
    if (awayInj.length) block += `  ${g.away} injuries: ${awayInj.join('; ')}\n`
    if (homeInj.length) block += `  ${g.home} injuries: ${homeInj.join('; ')}\n`
  }

  return `${block}\n`
}
