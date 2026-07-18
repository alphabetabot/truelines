/** Edge Engine — weighted 0–100 score per game. */

import { EDGE_WEIGHTS, MIN_EDGE_SCORE_FREE, MIN_EDGE_SCORE_PREMIUM } from './weights.js'
import { scoreMarketAnalysis } from './market.js'
import { scoreMatchupAnalysis } from './matchup.js'
import { scoreAdvancedMetrics } from './metrics.js'
import { scorePlayerAnalysis } from './player.js'
import { scoreSituationalAnalysis } from './situational.js'

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

export { EDGE_WEIGHTS, MIN_EDGE_SCORE_FREE, MIN_EDGE_SCORE_PREMIUM }

/**
 * Score a slate game for publish approval.
 * @returns {{ edgeScore, categories, confidenceScore, keyReasons, riskFactors, passesFree, passesPremium }}
 */
export function scoreGameEdge(game, { mlbAnalysis = null, pickMeta = null, tier = 'free' } = {}) {
  const market = scoreMarketAnalysis(game, { mlbAnalysis, pickMeta })
  const matchup = scoreMatchupAnalysis(game, { mlbAnalysis })
  const metrics = scoreAdvancedMetrics(game, { mlbAnalysis })
  const player = scorePlayerAnalysis(game)
  const situational = scoreSituationalAnalysis(game)

  const edgeScore = clamp(Math.round(
    market.score * EDGE_WEIGHTS.market
    + matchup.score * EDGE_WEIGHTS.matchup
    + metrics.score * EDGE_WEIGHTS.metrics
    + player.score * EDGE_WEIGHTS.player
    + situational.score * EDGE_WEIGHTS.situational,
  ))

  const confidenceScore = Number(mlbAnalysis?.confidenceScore ?? pickMeta?.confidence_score) || Math.round(edgeScore * 0.9)

  const keyReasons = [
    ...market.reasons,
    ...matchup.reasons,
    ...metrics.reasons,
  ].slice(0, 5)

  const riskFactors = [
    ...market.risks,
    ...matchup.risks,
    ...metrics.risks,
    ...player.risks,
    ...situational.risks,
  ].slice(0, 4)

  const minScore = tier === 'free' ? MIN_EDGE_SCORE_FREE : MIN_EDGE_SCORE_PREMIUM

  return {
    edgeScore,
    confidenceScore,
    categories: {
      market: market.score,
      matchup: matchup.score,
      metrics: metrics.score,
      player: player.score,
      situational: situational.score,
    },
    marketEdge: market,
    keyReasons,
    riskFactors,
    fairOdds: market.fairOdds,
    expectedValue: market.expectedValue,
    bestOdds: market.bestOdds,
    passesFree: edgeScore >= MIN_EDGE_SCORE_FREE,
    passesPremium: edgeScore >= MIN_EDGE_SCORE_PREMIUM,
    passes: edgeScore >= minScore,
  }
}

export function rankScoredPicks(scoredPicks) {
  return [...(scoredPicks || [])].sort((a, b) => {
    const edgeDiff = (b.edgeScore || 0) - (a.edgeScore || 0)
    if (edgeDiff !== 0) return edgeDiff
    return (b.confidenceScore || 0) - (a.confidenceScore || 0)
  })
}
