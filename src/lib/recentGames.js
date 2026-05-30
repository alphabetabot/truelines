/** Recently viewed matchups (localStorage). */

export const RECENT_GAMES_KEY = 'trueoddsiq_recent_games'
const MAX_RECENT = 8

export function normalizeRecentGame(game, sportKey) {
  if (!game?.id) return null
  return {
    id: game.id,
    sport: sportKey || game.sport,
    away: game.away || game.away_team,
    home: game.home || game.home_team,
    commenceTime: game.commenceTime || game.commence_time,
    viewedAt: Date.now(),
  }
}

export function getRecentGames() {
  try {
    const raw = localStorage.getItem(RECENT_GAMES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addRecentGame(game, sportKey) {
  const entry = normalizeRecentGame(game, sportKey)
  if (!entry) return getRecentGames()

  const list = getRecentGames().filter(g => g.id !== entry.id)
  const next = [entry, ...list].slice(0, MAX_RECENT)
  try {
    localStorage.setItem(RECENT_GAMES_KEY, JSON.stringify(next))
  } catch {
    // private browsing
  }
  return next
}

export function formatRecentGameLabel(game) {
  const away = game.away?.split(' ').slice(-1)[0] || game.away
  const home = game.home?.split(' ').slice(-1)[0] || game.home
  return `${away} @ ${home}`
}
