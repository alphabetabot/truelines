import { format } from 'date-fns'

/** Scores API game: in progress only when scores exist and game is not final. */
export function isScoresGameLive(game) {
  if (!game || game.completed) return false
  return Array.isArray(game.scores) && game.scores.some(
    (s) => s.score != null && s.score !== '' && !Number.isNaN(Number(s.score))
  )
}

export function isScoresGameFinal(game) {
  return Boolean(game?.completed)
}

/** Odds-only games never show LIVE — we only have commence time, not game state. */
export function getOddsGameTimeLabel(commenceTime) {
  const gameTime = new Date(commenceTime)
  if (Number.isNaN(gameTime.getTime())) return 'TBD'
  return format(gameTime, 'EEE M/d · h:mm a')
}

export function getScoresTickerLabel(game) {
  if (isScoresGameFinal(game)) return 'FINAL'
  if (isScoresGameLive(game)) return '● LIVE'
  const gameTime = new Date(game.commence_time)
  return gameTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function getScoresTickerColor(game) {
  if (isScoresGameFinal(game)) return '#94a3b8'
  if (isScoresGameLive(game)) return '#4ade80'
  return '#fbbf24'
}
