/** Matchup analysis — 25% weight. */

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

export function scoreMatchupAnalysis(game, { mlbAnalysis = null } = {}) {
  const reasons = []
  const risks = []
  let score = 48
  const sport = game?.sport || 'MLB'
  const stats = game?.stats || {}

  if (sport === 'MLB') {
    const awayEra = parseFloat(stats.awayPitcher?.era)
    const homeEra = parseFloat(stats.homePitcher?.era)
    if (Number.isFinite(awayEra) && Number.isFinite(homeEra)) {
      const gap = Math.abs(awayEra - homeEra)
      if (gap >= 1.2) {
        score += 12
        reasons.push(`Starter ERA gap ${gap.toFixed(2)} (${awayEra} vs ${homeEra})`)
      } else if (gap >= 0.6) {
        score += 6
        reasons.push(`Moderate starter ERA split (${awayEra} vs ${homeEra})`)
      }
    }

    const awayRd = stats.awayTeam?.runDiff
    const homeRd = stats.homeTeam?.runDiff
    if (awayRd != null && homeRd != null) {
      const rdGap = Math.abs(awayRd - homeRd)
      if (rdGap >= 20) {
        score += 8
        reasons.push(`Run differential gap ${rdGap} (${awayRd} vs ${homeRd})`)
      }
    }

    if (game?.venue) {
      score += 3
      reasons.push(`Ballpark context: ${game.venue}`)
    }
  }

  if (sport === 'NBA' && stats.awayStanding && stats.homeStanding) {
    score += 10
    reasons.push('Team ratings and standings in slate')
  }

  if (sport === 'NHL' && (stats.awayGoalie || stats.homeGoalie)) {
    score += 10
    reasons.push('Confirmed goalie matchup data')
  }

  const factors = mlbAnalysis?.factors || []
  const agreeing = factors.filter(f => f.vote !== 0).length
  if (agreeing >= 4) {
    score += 8
    reasons.push(`${agreeing} matchup factors align with model side`)
  }

  if (mlbAnalysis?.biggestRisk?.includes('conflict')) {
    score -= 15
    risks.push('Conflicting matchup signals')
  }

  return {
    score: clamp(Math.round(score)),
    reasons: reasons.slice(0, 4),
    risks: risks.slice(0, 2),
  }
}
