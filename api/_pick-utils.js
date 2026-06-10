/** Shared helpers for picks storage, grading, and display */

export function parseAmericanOdds(oddsStr) {
  if (!oddsStr) return null
  const match = String(oddsStr).match(/([+-]?\d+)/)
  if (!match) return null
  const n = parseInt(match[1], 10)
  if (Number.isNaN(n) || Math.abs(n) < 100) return null
  return n
}

export function profitUnits(americanOdds, won) {
  const odds = typeof americanOdds === 'number' ? americanOdds : parseAmericanOdds(americanOdds)
  if (!odds) return won ? 1 : -1
  if (!won) return -1
  if (odds > 0) return odds / 100
  return 100 / Math.abs(odds)
}

export function formatConfidence(stars) {
  const n = Math.min(5, Math.max(1, stars || 3))
  return '★'.repeat(n)
}

/** Extract "Away @ Home" from a pick section */
export function extractMatchup(section) {
  const lines = String(section || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean)

  for (const line of lines) {
    const atMatch = line.match(/^(?:[A-Z]{2,4}:?\s*)?([^@]+?)\s+@\s+([^@]+?)(?:\s*(?:→|->|\|).*)?$/)
    if (atMatch) {
      const away = cleanTeamName(atMatch[1])
      const home = cleanTeamName(atMatch[2])
      if (away && home) return `${away} @ ${home}`
    }
  }

  return null
}

function cleanTeamName(value) {
  return value
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/, '')
    .replace(/\s*(?:→|->|\|).*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Strip sport prefix from pick headline */
export function cleanPickHeadline(headline) {
  return headline
    .replace(/\*\*/g, '')
    .replace(/^FADE:\s*/i, '')
    .replace(/^(?:MLB|NBA|NHL|NFL)\s*(?:Pick)?:\s*/i, '')
    .trim()
}

export function formatBetDisplay({ betType, odds, bestBook, isFade }) {
  const oddsStr = odds && odds !== 'N/A' ? odds : ''
  const book = bestBook && bestBook !== 'N/A' ? bestBook : ''
  if (isFade) return `FADE${book ? ` · ${book}` : ''}`
  const parts = [betType, oddsStr, book].filter(Boolean)
  return parts.join(' · ') || 'N/A'
}

export function isFadePick(pick) {
  const betType = String(pick?.bet_type || pick?.betType || '').trim()
  if (/^fade$/i.test(betType)) return true
  const text = `${pick?.pick || ''} ${pick?.bet || ''} ${betType}`
  return /\bfade\b/i.test(text) || /^FADE:/i.test(pick?.pick || '')
}

export function extractSportFromPick(pickLine) {
  const clean = String(pickLine || '').replace(/^FADE:\s*/i, '')
  if (clean.toUpperCase().startsWith('MLB')) return 'MLB'
  if (clean.toUpperCase().startsWith('NBA')) return 'NBA'
  if (clean.toUpperCase().startsWith('NHL')) return 'NHL'
  if (clean.toUpperCase().startsWith('NFL')) return 'NFL'
  if (clean.toLowerCase().includes('baseball')) return 'MLB'
  if (clean.toLowerCase().includes('basketball')) return 'NBA'
  if (clean.toLowerCase().includes('hockey')) return 'NHL'
  if (clean.toLowerCase().includes('football')) return 'NFL'
  return null
}

/** MLB/NBA/NHL name hints when the newsletter headline omitted the sport prefix. */
const MLB_TEAM_HINT =
  /\b(yankees|red sox|dodgers|giants|cubs|mets|braves|phillies|nationals|marlins|brewers|cardinals|reds|pirates|astros|rangers|angels|athletics|mariners|twins|white sox|tigers|guardians|royals|rays|orioles|blue jays|rockies|padres|diamondbacks)\b/i
const NBA_TEAM_HINT =
  /\b(lakers|celtics|warriors|knicks|nets|bucks|suns|nuggets|heat|76ers|sixers|mavericks|clippers|bulls|raptors|hawks|hornets|magic|pistons|pacers|cavaliers|cavs|grizzlies|pelicans|spurs|rockets|thunder|timberwolves|wolves|trail blazers|blazers|jazz|kings)\b/i
const NHL_TEAM_HINT =
  /\b(bruins|rangers|maple leafs|canadiens|canucks|oilers|flames|jets|wild|avalanche|golden knights|kraken|sharks|ducks|kings|blackhawks|red wings|lightning|panthers|hurricanes|capitals|penguins|flyers|devils|islanders|sabres|senators|blue jackets|predators|stars|coyotes|utah hockey)\b/i

/**
 * Resolve sport for display, grading, and storage. Never returns "Mixed" — that was a
 * legacy fallback when the pick headline had no MLB/NBA/NHL prefix.
 */
export function resolvePickSport({ sport, pick, game, edge } = {}) {
  const stored = String(sport || '').trim()
  if (stored && stored !== 'Mixed') return stored

  const blob = `${pick || ''} ${game || ''} ${edge || ''}`
  const fromPrefix = extractSportFromPick(blob)
  if (fromPrefix) return fromPrefix

  if (MLB_TEAM_HINT.test(blob) || /\b(ERA|WHIP|run line|innings|bullpen|starter)\b/i.test(blob)) {
    return 'MLB'
  }
  if (NBA_TEAM_HINT.test(blob)) return 'NBA'
  if (NHL_TEAM_HINT.test(blob)) return 'NHL'

  return 'MLB'
}

// ── Pick grading (log-results) ─────────────────────────────────────────────

export function cleanGradingText(value) {
  return String(value || '')
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function teamNameLast(name) {
  return cleanGradingText(name).split(' ').pop().toLowerCase()
}

/** Remove American odds (+103, -150) so they are not mistaken for spread lines. */
export function stripAmericanOddsFromText(text) {
  return cleanGradingText(text).replace(/\b[+-]\d{3,5}\b/g, ' ')
}

export function matchupPartsFromText(value) {
  const clean = cleanGradingText(value)
  if (!clean.includes('@')) return null
  const parts = clean.split('@').map(p => cleanGradingText(p))
  if (parts.length < 2 || !parts[0] || !parts[1]) return null
  return { awayLabel: parts[0], homeLabel: parts[1] }
}

function sideForTeamName(teamName, game) {
  const name = cleanGradingText(teamName).toLowerCase()
  const away = cleanGradingText(game.away_team).toLowerCase()
  const home = cleanGradingText(game.home_team).toLowerCase()
  const nameLast = teamNameLast(name)

  if (name === away || nameLast === teamNameLast(away)) return 'away'
  if (name === home || nameLast === teamNameLast(home)) return 'home'
  return null
}

export function teamsMatchGame(pickGameStr, game) {
  const parts = matchupPartsFromText(pickGameStr)
  if (!parts) return false

  const awayLast = teamNameLast(parts.awayLabel)
  const homeLast = teamNameLast(parts.homeLabel)
  const gameAwayLast = teamNameLast(game.away_team)
  const gameHomeLast = teamNameLast(game.home_team)

  return (
    (awayLast === gameAwayLast && homeLast === gameHomeLast) ||
    (awayLast === gameHomeLast && homeLast === gameAwayLast)
  )
}

function pickExactOrderGame(onDate, pickGameStr) {
  const parts = matchupPartsFromText(pickGameStr)
  if (!parts) return onDate[0]
  const exact = onDate.find(
    g =>
      teamNameLast(parts.awayLabel) === teamNameLast(g.away_team) &&
      teamNameLast(parts.homeLabel) === teamNameLast(g.home_team)
  )
  return exact || onDate[0]
}

/** True when a final’s calendar date matches the pick row (Pacific slate date preferred). */
export function gameMatchesPickDate(game, pickDate) {
  if (!pickDate) return false
  if (game.pacific_date === pickDate) return true
  if (game.game_date === pickDate) return true
  return false
}

/** Prefer the final game on pick.date — never grade a series game from another day. */
export function findGameForPick(pickGameStr, games, pickDate) {
  if (!pickGameStr || !pickGameStr.includes('@')) return null

  const teamMatches = games.filter(g => teamsMatchGame(pickGameStr, g))
  if (teamMatches.length === 0) return null

  if (pickDate) {
    const onDate = teamMatches.filter(g => gameMatchesPickDate(g, pickDate))
    if (onDate.length === 1) return onDate[0]
    if (onDate.length > 1) return pickExactOrderGame(onDate, pickGameStr)
    return null
  }

  if (teamMatches.length === 1) return teamMatches[0]
  return null
}

/**
 * Match final on pick.date only (Pacific-aligned). No ±1 day fallback — that graded
 * the wrong game when the same teams played on consecutive days in a series.
 */
export function findGameForPickWithDateFallback(pickGameStr, games, pickDate) {
  return findGameForPick(pickGameStr, games, pickDate)
}

/**
 * Grade one stored pick row against a score list.
 * @returns {{ result, units, game, previous, changed, skipReason? }}
 */
export function resolvePickGrade(pick, games, { resolveOdds }) {
  const pickGame = cleanGradingText(pick.game)
  if (!pickGame || !pickGame.includes('@')) {
    return { skipReason: 'no matchup in game field' }
  }

  const sport = resolvePickSport(pick)
  const sportGames = sport ? games.filter(g => g.sport === sport) : games

  const pool = sportGames.length ? sportGames : games
  const game = findGameForPickWithDateFallback(pickGame, pool, pick.date)

  if (!game) {
    return { skipReason: `no final score for ${pick.game} on ${pick.date}` }
  }

  const pickText = `${pick.pick || ''} ${pick.bet || ''}`
  const result = gradePickResult({
    pickText,
    betType: pick.bet_type,
    betText: pick.bet,
    pickGame,
    game,
  })

  if (!result) {
    return { skipReason: "can't determine W/L" }
  }

  const odds = resolveOdds(pick)
  const units = profitUnits(odds, result === 'W')
  const previous = pick.result

  return { result, units, game, previous }
}

export function pickNamesTeam(pickText, game, pickGameStr) {
  const matchup = matchupPartsFromText(pickGameStr || pickText)
  if (matchup) {
    const awaySide = sideForTeamName(matchup.awayLabel, game)
    const homeSide = sideForTeamName(matchup.homeLabel, game)
    const normalizedPick = cleanGradingText(pickText).toLowerCase()

    if (
      normalizedPick.includes(cleanGradingText(matchup.awayLabel).toLowerCase()) ||
      normalizedPick.includes(teamNameLast(matchup.awayLabel))
    ) {
      if (awaySide) return awaySide
    }
    if (
      normalizedPick.includes(cleanGradingText(matchup.homeLabel).toLowerCase()) ||
      normalizedPick.includes(teamNameLast(matchup.homeLabel))
    ) {
      if (homeSide) return homeSide
    }
  }

  const normalizedPick = cleanGradingText(pickText).toLowerCase()
  const awayTeam = cleanGradingText(game.away_team).toLowerCase()
  const homeTeam = cleanGradingText(game.home_team).toLowerCase()

  if (normalizedPick.includes(awayTeam) || normalizedPick.includes(teamNameLast(awayTeam))) return 'away'
  if (normalizedPick.includes(homeTeam) || normalizedPick.includes(teamNameLast(homeTeam))) return 'home'
  return null
}

function isMoneylineBet(pickText, betType, betText) {
  const type = `${betType || ''} ${betText || ''}`.toLowerCase()
  if (/\bml\b|moneyline/.test(type)) return true
  const pick = pickText.toLowerCase()
  return (
    pick.includes(' ml') ||
    pick.endsWith(' ml') ||
    /\bml\b/.test(pick) ||
    /\bmoneyline\b/.test(pick) ||
    Boolean(matchupPartsFromText(pickText))
  )
}

/**
 * Grade a pick against a final game score.
 * @returns {'W'|'L'|null}
 */
export function gradePickResult({ pickText, betType, betText, pickGame, game }) {
  const away = game.away_score
  const home = game.home_score
  if (away == null || home == null) return null

  const raw = cleanGradingText(pickText)
  const isFade = raw.toLowerCase().includes('fade')
  const pick = raw.toLowerCase().replace(/^fade:\s*/i, '')
  const spreadSource = stripAmericanOddsFromText(pick)

  let result = null
  const margin = away - home

  if (isMoneylineBet(pick, betType, betText)) {
    const side = pickNamesTeam(pick, game, pickGame)
    if (side === 'away') result = away > home ? 'W' : 'L'
    else if (side === 'home') result = home > away ? 'W' : 'L'
  }

  if (!result) {
    const spreadMatch = spreadSource.match(/([+-]\d+\.?\d*)/)
    if (spreadMatch && !pick.includes('over') && !pick.includes('under')) {
      const line = parseFloat(spreadMatch[1])
      if (Math.abs(line) < 50) {
        const side = pickNamesTeam(pick, game, pickGame)
        if (side === 'away') result = margin + line > 0 ? 'W' : 'L'
        else if (side === 'home') result = -margin + line > 0 ? 'W' : 'L'
      }
    }
  }

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

  // Team-only headline (e.g. "Miami Marlins +103") — do not treat odds as spread
  if (!result) {
    const side = pickNamesTeam(pick, game, pickGame)
    if (side) {
      if (side === 'away') result = away > home ? 'W' : 'L'
      else if (side === 'home') result = home > away ? 'W' : 'L'
    }
  }

  if (isFade && result) {
    result = result === 'W' ? 'L' : 'W'
  }

  return result
}
