/** Advanced team metrics — 20% weight. */

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

function pitcherQuality(p) {
  if (!p?.era || p.era === 'N/A') return 0
  const era = parseFloat(p.era)
  const whip = parseFloat(p.whip)
  let q = 0
  if (Number.isFinite(era) && era < 3.5) q += 2
  if (Number.isFinite(whip) && whip < 1.15) q += 2
  if (p.k9 && parseFloat(p.k9) > 8) q += 1
  return q
}

export function scoreAdvancedMetrics(game, { mlbAnalysis = null } = {}) {
  const reasons = []
  const risks = []
  let score = 45
  const sport = game?.sport || 'MLB'
  const stats = game?.stats || {}

  if (sport === 'MLB') {
    const awayQ = pitcherQuality(stats.awayPitcher)
    const homeQ = pitcherQuality(stats.homePitcher)
    score += (awayQ + homeQ) * 3

    if (stats.awayPitcher?.whip && stats.homePitcher?.whip) {
      reasons.push(`SP WHIP ${stats.awayPitcher.whip} / ${stats.homePitcher.whip}`)
    }
    if (stats.awayPitcher?.k9 && stats.homePitcher?.k9) {
      reasons.push(`K/9 ${stats.awayPitcher.k9} / ${stats.homePitcher.k9}`)
    }

    if (game?.weather?.temp || stats.weatherReport) {
      score += 5
      reasons.push('Weather factored into slate')
    }

    if (!stats.awayPitcher?.era || !stats.homePitcher?.era) {
      score -= 20
      risks.push('Incomplete starting pitcher metrics')
    }
  }

  const dq = Number(mlbAnalysis?.dataQualityScore)
  if (Number.isFinite(dq)) {
    score += clamp((dq - 50) / 2, -10, 15)
    reasons.push(`Data quality score ${dq}/100`)
  }

  return {
    score: clamp(Math.round(score)),
    reasons: reasons.slice(0, 4),
    risks: risks.slice(0, 2),
  }
}
