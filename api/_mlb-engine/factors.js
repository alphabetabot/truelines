/** Ten major MLB factor votes — each favors away (-1), neutral (0), or home (+1). */

import { scorePitcher, starterDepthScore, pitcherSampleQuality } from './pitcher.js'

function num(value, fallback = null) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function diffVote(delta, threshold = 0.5) {
  if (delta > threshold) return 1
  if (delta < -threshold) return -1
  return 0
}

const PARK_BIAS = {
  'Coors Field': -0.15,
  'Yankee Stadium': -0.05,
  'Dodger Stadium': 0.05,
  'Kauffman Stadium': 0.08,
  'T-Mobile Park': 0.08,
  'Camden Yards': -0.05,
  'Oracle Park': 0.07,
  'Petco Park': 0.06,
}

function parkBias(venue) {
  if (!venue) return 0
  for (const [name, bias] of Object.entries(PARK_BIAS)) {
    if (venue.includes(name) || name.includes(venue)) return bias
  }
  return 0
}

function windRunImpact(weather, statsWeather) {
  const text = `${statsWeather || ''} ${weather?.wind || ''} ${weather?.condition || ''}`.toLowerCase()
  if (/blow(?:ing)?\s+out|out to (left|right|center)|wind.*out/i.test(text)) return -0.04
  if (/blow(?:ing)?\s+in|in from|wind.*in/i.test(text)) return 0.04
  return 0
}

function offenseScore(teamStats = {}) {
  const wins = num(teamStats.wins, 0)
  const losses = num(teamStats.losses, 0)
  const runDiff = num(teamStats.runDiff, 0)
  const games = Math.max(1, wins + losses)
  const winPct = wins / games
  return winPct * 100 + runDiff * 0.35
}

export function evaluateMlbFactors(game) {
  const stats = game.stats || {}
  const awayPitcher = stats.awayPitcher || {}
  const homePitcher = stats.homePitcher || {}
  const awayTeam = stats.awayTeam || {}
  const homeTeam = stats.homeTeam || {}

  const awayPitchScore = scorePitcher(awayPitcher)
  const homePitchScore = scorePitcher(homePitcher)
  const awayDepth = starterDepthScore(awayPitcher)
  const homeDepth = starterDepthScore(homePitcher)

  const factors = []

  // 1. Starting pitcher advanced metrics
  if (awayPitchScore != null && homePitchScore != null) {
    const vote = diffVote(homePitchScore - awayPitchScore, 4)
    factors.push({
      key: 'pitcher',
      vote,
      label: 'Starting pitcher',
      detail: `Away SP score ${awayPitchScore} vs home ${homePitchScore} (FIP/xFIP-weighted, not ERA-only)`,
    })
  } else {
    factors.push({ key: 'pitcher', vote: 0, label: 'Starting pitcher', detail: 'Incomplete SP metrics', missing: true })
  }

  // 2. Bullpen quality / workload (proxies when live pen data unavailable)
  const bullpenAway = stats.awayBullpen?.fip ?? stats.awayBullpen?.whip
  const bullpenHome = stats.homeBullpen?.fip ?? stats.homeBullpen?.whip
  let bullpenVote = 0
  let bullpenDetail = 'Bullpen usage data limited — penalized in confidence'
  if (bullpenAway != null && bullpenHome != null) {
    bullpenVote = diffVote(num(bullpenHome) - num(bullpenAway), 0.15)
    bullpenDetail = `Bullpen quality edge favors ${bullpenVote > 0 ? 'home' : bullpenVote < 0 ? 'away' : 'neither'}`
  } else {
    const shallowStarter = awayDepth < 0.55 || homeDepth < 0.55
    if (shallowStarter) {
      bullpenVote = diffVote(homeDepth - awayDepth, 0.1)
      bullpenDetail = 'Starter unlikely to go deep — bullpen leverage matters more'
    }
  }
  factors.push({ key: 'bullpen', vote: bullpenVote, label: 'Bullpen', detail: bullpenDetail, missing: bullpenAway == null && bullpenHome == null })

  // 3. Offense vs pitcher handedness (proxy: team run production)
  const offAway = offenseScore(awayTeam)
  const offHome = offenseScore(homeTeam)
  factors.push({
    key: 'offense',
    vote: diffVote(offHome - offAway, 3),
    label: 'Offense',
    detail: `Run environment / team offense (${offAway.toFixed(0)} vs ${offHome.toFixed(0)})`,
  })

  // 4. Lineup strength (proxy: injuries + confirmed flag)
  const awayInj = (stats.awayInjuries || []).length
  const homeInj = (stats.homeInjuries || []).length
  const lineupConfirmed = Boolean(game.lineupsConfirmed || stats.lineupsConfirmed)
  const lineupVote = diffVote(homeInj - awayInj, 0.5)
  factors.push({
    key: 'lineup',
    vote: lineupVote,
    label: 'Lineup strength',
    detail: lineupConfirmed
      ? `Confirmed lineups — injury edge ${awayInj} away vs ${homeInj} home`
      : `Lineups unconfirmed — ${awayInj} away / ${homeInj} home injuries listed`,
    missing: !lineupConfirmed,
  })

  // 5. Park factor
  const park = parkBias(game.venue)
  factors.push({
    key: 'park',
    vote: park > 0 ? 1 : park < 0 ? -1 : 0,
    label: 'Park factor',
    detail: game.venue ? `${game.venue} run environment` : 'Park unknown',
    missing: !game.venue,
  })

  // 6. Weather / wind
  const weatherImpact = windRunImpact(game.weather, stats.weatherReport)
  factors.push({
    key: 'weather',
    vote: weatherImpact > 0 ? 1 : weatherImpact < 0 ? -1 : 0,
    label: 'Weather',
    detail: stats.weatherReport || (game.weather?.temp ? `${game.weather.temp}F ${game.weather.wind || ''}` : 'Weather missing'),
    missing: !stats.weatherReport && !game.weather?.temp,
  })

  // 7. Defense (proxy: run differential allowed component)
  const awayDefense = num(awayTeam.runDiff, 0) * -0.01 + num(awayTeam.losses, 0) * 0
  const homeDefense = num(homeTeam.runDiff, 0) * -0.01
  factors.push({
    key: 'defense',
    vote: diffVote(homeDefense - awayDefense, 0.2),
    label: 'Defense',
    detail: 'Team run differential as defensive quality proxy',
  })

  // 8. Travel / rest (home-field rest edge)
  factors.push({
    key: 'rest',
    vote: 1,
    label: 'Travel/rest',
    detail: 'Home team rest/travel edge (standard home bump)',
  })

  // 9. Recent market movement (odds range spread)
  const awayRange = game.marketSnapshot?.awayRange
  const homeRange = game.marketSnapshot?.homeRange
  let moveVote = 0
  let moveDetail = 'Insufficient cross-book spread for movement read'
  if (awayRange?.spread >= 8 || homeRange?.spread >= 8) {
    const awayWorse = awayRange && awayRange.max < awayRange.min
    const homeWorse = homeRange && homeRange.max < homeRange.min
    if (awayWorse && !homeWorse) moveVote = 1
    if (homeWorse && !awayWorse) moveVote = -1
    moveDetail = `ML range spread away ${awayRange?.spread ?? '—'} / home ${homeRange?.spread ?? '—'}`
  }
  factors.push({ key: 'line_movement', vote: moveVote, label: 'Market movement', detail: moveDetail })

  // 10. Injury / news context
  const injVote = diffVote(homeInj - awayInj, 0.5)
  factors.push({
    key: 'injuries',
    vote: injVote,
    label: 'Injuries/news',
    detail: `${awayInj} away vs ${homeInj} home impact injuries`,
  })

  const agreeing = (side, vote) => {
    if (side === 'away') return vote < 0
    if (side === 'home') return vote > 0
    return vote === 0
  }

  return {
    factors,
    pitcherSample: Math.min(pitcherSampleQuality(awayPitcher), pitcherSampleQuality(homePitcher)),
    awayDepth,
    homeDepth,
    countAgreeing(side) {
      return factors.filter(f => agreeing(side, f.vote)).length
    },
    conflictingSignals() {
      const votes = factors.map(f => f.vote).filter(v => v !== 0)
      if (votes.length < 4) return false
      const pos = votes.filter(v => v > 0).length
      const neg = votes.filter(v => v < 0).length
      return pos >= 2 && neg >= 2
    },
    missingCritical() {
      const pitcherMissing = factors.find(f => f.key === 'pitcher')?.missing
      const bothSpTbd = !game.awayPitcher || !game.homePitcher
      return pitcherMissing || bothSpTbd
    },
  }
}
