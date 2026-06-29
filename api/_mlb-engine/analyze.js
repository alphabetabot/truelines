/** Probability-based MLB game analysis — BET / LEAN / PASS / AVOID. */

import { getMarketMoneylineSnapshot } from './odds.js'
import { scorePitcher, starterDepthScore } from './pitcher.js'
import { evaluateMlbFactors } from './factors.js'

const BET_EDGE_MIN = 4
const LEAN_EDGE_MIN = 2
const BET_CONFIDENCE_MIN = 60
const BET_FACTORS_MIN = 4
const HEAVY_FAVORITE = -180
const HOME_FIELD_LOGIT = 0.12

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function logit(p) {
  const x = clamp(p, 0.01, 0.99)
  return Math.log(x / (1 - x))
}

function invLogit(x) {
  return 1 / (1 + Math.exp(-x))
}

function pct(prob) {
  return Math.round(prob * 1000) / 10
}

function formatAmerican(odds) {
  if (odds == null) return 'N/A'
  const n = Number(odds)
  return n > 0 ? `+${n}` : `${n}`
}

function pickSideFromFactors(factorEval, marketHomeProb) {
  const homeVotes = factorEval.factors.reduce((s, f) => s + (f.vote > 0 ? 1 : 0), 0)
  const awayVotes = factorEval.factors.reduce((s, f) => s + (f.vote < 0 ? 1 : 0), 0)
  if (homeVotes > awayVotes) return 'home'
  if (awayVotes > homeVotes) return 'away'
  return marketHomeProb >= 0.5 ? 'home' : 'away'
}

function modelProbability(game, market, factorEval) {
  const fairHome = (market.fairHomeImplied ?? market.rawHomeImplied ?? 50) / 100
  const fairAway = (market.fairAwayImplied ?? market.rawAwayImplied ?? 50) / 100
  const baseHome = fairHome / (fairHome + fairAway)

  let adjustment = HOME_FIELD_LOGIT * 0.35
  for (const f of factorEval.factors) {
    adjustment += f.vote * 0.045
  }

  const awayPitch = scorePitcher(game.stats?.awayPitcher)
  const homePitch = scorePitcher(game.stats?.homePitcher)
  if (awayPitch != null && homePitch != null) {
    adjustment += (homePitch - awayPitch) * 0.004
  }

  const awayDepth = starterDepthScore(game.stats?.awayPitcher)
  const homeDepth = starterDepthScore(game.stats?.homePitcher)
  if (awayDepth < 0.5 || homeDepth < 0.5) {
    adjustment += (homeDepth - awayDepth) * 0.08
  }

  return clamp(invLogit(logit(baseHome) + adjustment), 0.08, 0.92)
}

function computeConfidence(game, factorEval, edge, side, pickOdds) {
  let score = 72

  if (factorEval.missingCritical()) score -= 25
  if (factorEval.pitcherSample < 0.5) score -= 12
  if (factorEval.factors.some(f => f.key === 'lineup' && f.missing)) score -= 8
  if (factorEval.factors.some(f => f.key === 'bullpen' && f.missing)) score -= 10
  if (factorEval.factors.some(f => f.key === 'weather' && f.missing)) score -= 5
  if (factorEval.conflictingSignals()) score -= 18
  if (game.starterChanged) score -= 15

  const range = side === 'home' ? game.marketSnapshot?.homeRange : game.marketSnapshot?.awayRange
  if (range?.spread >= 15) score -= 10

  const factorsAgree = factorEval.countAgreeing(side)
  score += (factorsAgree - 5) * 2
  score += clamp(edge * 2.5, -4, 8)

  if (pickOdds != null && pickOdds <= HEAVY_FAVORITE && edge < BET_EDGE_MIN) score -= 12

  return clamp(Math.round(score), 0, 100)
}

function dataQualityScore(game, factorEval) {
  let score = 40
  if (game.marketSnapshot) score += 15
  if (game.stats?.awayPitcher?.era !== 'N/A') score += 10
  if (game.stats?.homePitcher?.era !== 'N/A') score += 10
  if (game.venue) score += 5
  if (game.stats?.weatherReport || game.weather?.temp) score += 5
  if (game.stats?.awayTeam?.wins) score += 5
  if (!factorEval.factors.some(f => f.missing)) score += 10
  score += factorEval.pitcherSample * 10
  return clamp(Math.round(score), 0, 100)
}

function buildReasons(factorEval, side, game, edge, marketImplied, modelProb) {
  const reasons = []
  const favored = side === 'home' ? game.home : game.away
  reasons.push(
    `Model ${pct(modelProb)}% vs market ${pct(marketImplied)}% on ${favored} (${edge >= 0 ? '+' : ''}${pct(edge)} pt edge)`
  )

  const topFactors = [...factorEval.factors]
    .filter(f => (side === 'home' && f.vote > 0) || (side === 'away' && f.vote < 0))
    .sort((a, b) => Math.abs(b.vote) - Math.abs(a.vote))
    .slice(0, 2)

  for (const f of topFactors) {
    reasons.push(`${f.label}: ${f.detail}`)
  }

  while (reasons.length < 3) {
    reasons.push('Price checked against multi-book moneyline snapshot')
    break
  }

  return reasons.slice(0, 3)
}

function biggestRisk(factorEval, side, game, pickOdds) {
  if (factorEval.conflictingSignals()) return 'Factor signals conflict — model edge may be noise'
  if (factorEval.missingCritical()) return 'Missing or incomplete starting pitcher data'
  if (pickOdds != null && pickOdds <= HEAVY_FAVORITE) return 'Expensive favorite price — win probability alone does not justify lay'
  if (factorEval.factors.some(f => f.key === 'bullpen' && f.missing)) {
    return 'Bullpen workload unknown — late-inning leverage risk'
  }
  if (factorEval.factors.some(f => f.key === 'lineup' && f.missing)) {
    return 'Lineups not confirmed — offensive upside/downside unsettled'
  }
  const opp = side === 'home' ? game.awayPitcher : game.homePitcher
  return opp ? `${opp} can steal outs if offense stalls` : 'Market can correct before first pitch'
}

function resolveRecommendation(edge, confidence, factorEval, side, pickOdds) {
  if (factorEval.missingCritical() || factorEval.conflictingSignals()) {
    return 'AVOID'
  }

  if (pickOdds != null && pickOdds <= HEAVY_FAVORITE && edge < BET_EDGE_MIN) {
    return 'PASS'
  }

  const factorsAgree = factorEval.countAgreeing(side)
  if (edge >= BET_EDGE_MIN && confidence >= BET_CONFIDENCE_MIN && factorsAgree >= BET_FACTORS_MIN) {
    return 'BET'
  }
  if (edge >= LEAN_EDGE_MIN && edge < BET_EDGE_MIN) {
    return 'LEAN'
  }
  if (edge >= BET_EDGE_MIN && (confidence < BET_CONFIDENCE_MIN || factorsAgree < BET_FACTORS_MIN)) {
    return 'LEAN'
  }
  if (edge < LEAN_EDGE_MIN) return 'PASS'
  return 'PASS'
}

/**
 * Analyze one MLB game and return structured Vega recommendation.
 */
export function analyzeMlbGame(game) {
  const market = getMarketMoneylineSnapshot(game)
  if (!market) {
    return {
      sport: 'MLB',
      matchup: `${game.away} @ ${game.home}`,
      away: game.away,
      home: game.home,
      recommendation: 'AVOID',
      side: null,
      sportsbookOdds: null,
      marketImpliedProbability: null,
      modelWinProbability: null,
      calculatedEdge: null,
      confidenceScore: 0,
      topReasons: ['No actionable multi-book moneyline prices'],
      biggestRisk: 'Cannot price edge without market odds',
      dataQualityScore: 0,
      factorsAgreeing: 0,
      tracking: emptyTracking(),
    }
  }

  const enriched = { ...game, marketSnapshot: market }
  const factorEval = evaluateMlbFactors(enriched)
  const modelHomeProb = modelProbability(enriched, market, factorEval)
  const side = pickSideFromFactors(factorEval, modelHomeProb)
  const modelProb = side === 'home' ? modelHomeProb : 1 - modelHomeProb
  const marketImplied = (side === 'home' ? market.fairHomeImplied : market.fairAwayImplied) / 100
  const edge = modelProb - marketImplied
  const pickOdds = side === 'home' ? market.homeOdds : market.awayOdds
  const confidenceScore = computeConfidence(enriched, factorEval, edge * 100, side, pickOdds)
  const recommendation = resolveRecommendation(edge * 100, confidenceScore, factorEval, side, pickOdds)
  const teamName = side === 'home' ? game.home : game.away
  const dq = dataQualityScore(enriched, factorEval)

  return {
    sport: 'MLB',
    matchup: `${game.away} @ ${game.home}`,
    away: game.away,
    home: game.home,
    recommendation,
    side: teamName,
    sideKey: side,
    sportsbookOdds: pickOdds,
    marketImpliedProbability: pct(marketImplied),
    modelWinProbability: pct(modelProb),
    calculatedEdge: pct(edge),
    confidenceScore,
    topReasons: buildReasons(factorEval, side, game, edge * 100, marketImplied, modelProb),
    biggestRisk: biggestRisk(factorEval, side, game, pickOdds),
    dataQualityScore: dq,
    factorsAgreeing: factorEval.countAgreeing(side),
    factors: factorEval.factors,
    bestOdds: game.bestOdds,
    market,
    tracking: {
      opening_odds: side === 'home' ? market.openingHomeOdds : market.openingAwayOdds,
      odds_at_pick: pickOdds,
      closing_odds: null,
      closing_line_value: null,
      result: null,
      profit_loss: null,
      recommendation,
    },
    pickSelection: `${teamName} ML`,
    betLine: `ML at ${formatAmerican(pickOdds)} via ${side === 'home' ? market.homeBook : market.awayBook}`,
    game: `${game.away} @ ${game.home}`,
  }
}

function emptyTracking() {
  return {
    opening_odds: null,
    odds_at_pick: null,
    closing_odds: null,
    closing_line_value: null,
    result: null,
    profit_loss: null,
    recommendation: 'AVOID',
  }
}

/** Run engine on all MLB games; attach analysis to each. */
export function analyzeMlbSlate(games) {
  return (games || [])
    .filter(g => g.sport === 'MLB')
    .map(g => ({ game: g, analysis: analyzeMlbGame(g) }))
}

/** Select publishable MLB picks (BET/LEAN), sorted by edge. */
export function selectMlbEnginePicks(analyses, { max = 3 } = {}) {
  return analyses
    .filter(({ analysis }) => analysis.recommendation === 'BET' || analysis.recommendation === 'LEAN')
    .sort((a, b) => {
      const recOrder = { BET: 0, LEAN: 1 }
      const ra = recOrder[a.analysis.recommendation] ?? 2
      const rb = recOrder[b.analysis.recommendation] ?? 2
      if (ra !== rb) return ra - rb
      return (b.analysis.calculatedEdge || 0) - (a.analysis.calculatedEdge || 0)
    })
    .slice(0, max)
    .map(({ analysis }) => analysis)
}

export function formatEngineBlockForPrompt(analyses) {
  const lines = analyses.map(a => {
    const x = a.analysis
    return [
      `${x.matchup}`,
      `  Recommendation: ${x.recommendation} | Side: ${x.side || '—'}`,
      `  Odds: ${formatAmerican(x.sportsbookOdds)} | Market: ${x.marketImpliedProbability}% | Model: ${x.modelWinProbability}% | Edge: ${x.calculatedEdge}%`,
      `  Confidence: ${x.confidenceScore}/100 | Factors agreeing: ${x.factorsAgreeing} | Data quality: ${x.dataQualityScore}`,
      `  Reasons: ${(x.topReasons || []).join(' · ')}`,
      `  Risk: ${x.biggestRisk}`,
    ].join('\n')
  })
  return lines.join('\n\n')
}

export function engineAnalysisToPick(analysis, edgeNarrative = '') {
  const edge = edgeNarrative || [
    ...analysis.topReasons,
    `Biggest risk: ${analysis.biggestRisk}`,
    `Vega ${analysis.recommendation}: ${analysis.calculatedEdge}% edge vs market (${analysis.modelWinProbability}% model vs ${analysis.marketImpliedProbability}% implied).`,
  ].join(' ')

  const legacyConfidence = analysis.recommendation === 'BET'
    ? Math.min(5, Math.max(4, Math.round(analysis.confidenceScore / 20)))
    : analysis.recommendation === 'LEAN'
      ? 3
      : 2

  return {
    game: analysis.game,
    pickSelection: analysis.pickSelection,
    sport: 'MLB',
    bet: analysis.betLine,
    betType: 'ML',
    odds: analysis.sportsbookOdds,
    bestBook: analysis.market?.homeBook || analysis.market?.awayBook,
    confidence: legacyConfidence,
    edge,
    recommendation: analysis.recommendation,
    pickMeta: {
      opening_odds: analysis.tracking.opening_odds,
      odds_at_pick: analysis.tracking.odds_at_pick,
      closing_odds: null,
      closing_line_value: null,
      market_implied: analysis.marketImpliedProbability,
      model_probability: analysis.modelWinProbability,
      calculated_edge: analysis.calculatedEdge,
      confidence_score: analysis.confidenceScore,
      data_quality_score: analysis.dataQualityScore,
      top_reasons: analysis.topReasons,
      biggest_risk: analysis.biggestRisk,
      factors_agreeing: analysis.factorsAgreeing,
      recommendation: analysis.recommendation,
    },
    engineGenerated: true,
  }
}
