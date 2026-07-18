/** Player / injury analysis — 15% weight. */

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

export function scorePlayerAnalysis(game) {
  const reasons = []
  const risks = []
  let score = 50
  const stats = game?.stats || {}

  const awayInj = stats.awayInjuries?.length || 0
  const homeInj = stats.homeInjuries?.length || 0

  if (awayInj || homeInj) {
    score += 8
    reasons.push(`Injury report: ${awayInj} away / ${homeInj} home listed`)
  } else {
    score -= 4
    risks.push('No injury list in slate data')
  }

  if (game?.awayPitcher && game?.homePitcher) {
    score += 6
    reasons.push(`Probable SPs: ${game.awayPitcher} vs ${game.homePitcher}`)
  }

  if (game?.starterChanged) {
    score -= 12
    risks.push('Starter change detected — re-verify line')
  }

  return {
    score: clamp(Math.round(score)),
    reasons: reasons.slice(0, 3),
    risks: risks.slice(0, 2),
  }
}
