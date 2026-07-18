/** Situational factors — 10% weight. */

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

export function scoreSituationalAnalysis(game) {
  const reasons = []
  const risks = []
  let score = 52

  if (game?.venue) {
    score += 3
    reasons.push(`Venue: ${game.venue}`)
  }

  if (game?.weather?.wind) {
    reasons.push(`Wind: ${game.weather.wind}`)
    score += 2
  }

  if (game?.stats?.weatherReport) {
    score += 4
    reasons.push(game.stats.weatherReport)
  }

  return {
    score: clamp(Math.round(score)),
    reasons: reasons.slice(0, 3),
    risks: risks.slice(0, 1),
  }
}
