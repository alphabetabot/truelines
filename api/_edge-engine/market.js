/** Market analysis — 30% weight. Uses odds snapshot + model edge when available. */

import { breakevenWinProbability, expectedUnits } from '../_pick-economics.js'

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

export function scoreMarketAnalysis(game, { mlbAnalysis = null, pickMeta = null } = {}) {
  const reasons = []
  const risks = []
  let score = 50

  const meta = pickMeta || mlbAnalysis?.tracking || {}
  const odds = mlbAnalysis?.sportsbookOdds ?? game?.bestOdds?.awayML?.price ?? game?.bestOdds?.homeML?.price
  const edge = Number(mlbAnalysis?.calculatedEdge ?? meta.calculated_edge)
  const modelProb = Number(mlbAnalysis?.modelWinProbability ?? meta.model_probability)
  const marketProb = Number(mlbAnalysis?.marketImpliedProbability ?? meta.market_implied_probability)

  if (Number.isFinite(edge)) {
    score += clamp(edge * 4, -10, 25)
    reasons.push(`Model edge ${edge}% vs market`)
  }

  if (Number.isFinite(modelProb) && Number.isFinite(odds)) {
    const breakeven = breakevenWinProbability(odds) * 100
    const ev = expectedUnits(odds, modelProb)
    if (modelProb > breakeven + 2.5) {
      score += 8
      reasons.push(`Model ${modelProb}% clears breakeven ${breakeven.toFixed(1)}%`)
    } else {
      score -= 12
      risks.push('Model win rate below juice-adjusted breakeven')
    }
    if (ev != null && ev > 0.04) {
      score += 6
      reasons.push(`Positive expected value (+${ev.toFixed(2)}u per 1u)`)
    }
  }

  if (game?.marketSnapshot?.homeRange?.spread >= 12 || game?.marketSnapshot?.awayRange?.spread >= 12) {
    score -= 5
    risks.push('Wide cross-book price dispersion')
  } else if (game?.bookmakers?.length >= 2) {
    score += 5
    reasons.push('Multi-book line comparison available')
  }

  if (Number.isFinite(marketProb)) {
    reasons.push(`Fair market implied ${marketProb}%`)
  }

  const bookCount = (game?.bookmakers || []).length
  if (bookCount >= 4) score += 4

  return {
    score: clamp(Math.round(score)),
    reasons: reasons.slice(0, 4),
    risks: risks.slice(0, 2),
    fairOdds: meta.fair_odds ?? null,
    expectedValue: Number.isFinite(edge) ? edge : null,
    bestOdds: odds ?? null,
  }
}
