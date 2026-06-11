/** Persisted sport + seasonal default for first-time visitors. */

export const SPORT_STORAGE_KEY = 'trueoddsiq_selected_sport'

const VALID_SPORT_KEYS = new Set([
  'americanfootball_nfl',
  'americanfootball_ncaaf',
  'basketball_nba',
  'basketball_ncaab',
  'baseball_mlb',
  'icehockey_nhl',
  'soccer_fifa_world_cup',
  'soccer_epl',
  'soccer_usa_mls',
  'tennis_atp_french_open',
  'mma_mixed_martial_arts',
])

export function isValidSportKey(key) {
  return VALID_SPORT_KEYS.has(key)
}

export function getStoredSport() {
  try {
    const value = localStorage.getItem(SPORT_STORAGE_KEY)
    if (value && isValidSportKey(value)) return value
  } catch {
    // private browsing
  }
  return null
}

export function setStoredSport(sportKey) {
  if (!isValidSportKey(sportKey)) return
  try {
    localStorage.setItem(SPORT_STORAGE_KEY, sportKey)
  } catch {
    // private browsing
  }
}

/** FIFA World Cup 2026 group stage + knockout window (Pacific calendar dates). */
function isWorldCup2026Window(date) {
  const y = date.getFullYear()
  if (y !== 2026) return false
  const m = date.getMonth() + 1
  const d = date.getDate()
  if (m === 6 && d >= 11) return true
  if (m === 7 && d <= 20) return true
  return false
}

/**
 * Seasonal default when no localStorage value exists.
 * Priority: World Cup → March Madness → NFL → summer MLB → NBA → NHL → MLB fallback.
 */
export function getSeasonalDefaultSport(date = new Date()) {
  const m = date.getMonth() + 1
  const d = date.getDate()

  if (isWorldCup2026Window(date)) {
    return 'soccer_fifa_world_cup'
  }

  if ((m === 3 && d >= 10) || (m === 4 && d <= 10)) {
    return 'basketball_ncaab'
  }

  if (m >= 9 || m === 1 || (m === 2 && d <= 15)) {
    return 'americanfootball_nfl'
  }

  if (m >= 4 && m <= 9) {
    return 'baseball_mlb'
  }

  if (m === 10 || m === 11 || m === 12 || m === 1 || (m === 2 && d > 15) || m === 6) {
    return 'basketball_nba'
  }

  if (m === 10 || m === 11 || m === 12 || m === 1 || m === 2 || m === 3 || m === 5 || m === 6) {
    return 'icehockey_nhl'
  }

  return 'baseball_mlb'
}

export function getInitialSport() {
  return getStoredSport() || getSeasonalDefaultSport()
}
