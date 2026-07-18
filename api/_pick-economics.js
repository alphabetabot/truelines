/** Juice-aware helpers — flat 1u bets lose at ~50% win rate on minus money. */

export function breakevenWinProbability(americanOdds) {
  const o = Number(americanOdds)
  if (!Number.isFinite(o) || o === 0) return 0.5
  if (o > 0) return 100 / (o + 100)
  return Math.abs(o) / (Math.abs(o) + 100)
}

export function winProfitPerUnit(americanOdds) {
  const o = Number(americanOdds)
  if (!Number.isFinite(o)) return 1
  if (o > 0) return o / 100
  return 100 / Math.abs(o)
}

export function normalizeModelProbability(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return n > 1 ? n / 100 : n
}

/** Expected units won/lost per 1u flat bet. */
export function expectedUnits(americanOdds, modelProbability) {
  const prob = normalizeModelProbability(modelProbability)
  if (prob == null) return null
  const winPay = winProfitPerUnit(americanOdds)
  return prob * winPay - (1 - prob)
}

export function oddsBucket(americanOdds) {
  const o = Number(americanOdds)
  if (!Number.isFinite(o)) return 'unknown'
  if (o >= 100) return 'dog'
  if (o >= -115) return 'pickem'
  if (o >= -150) return 'chalk'
  return 'heavy'
}

export const ODDS_BUCKET_LABELS = {
  dog: 'Plus money (+100+)',
  pickem: 'Pick’em (-114 to +99)',
  chalk: 'Chalk (-115 to -149)',
  heavy: 'Heavy chalk (-150+)',
  unknown: 'Unknown odds',
}

/**
 * Model win probability must clear breakeven + buffer, with positive expected units.
 * Falls back to edge hurdles when model probability is missing.
 */
export function passesUnitEconomicsGate(pickOdds, meta, {
  buffer = 0.025,
  minExpectedUnits = 0.04,
} = {}) {
  if (pickOdds == null) return true

  const modelProb = normalizeModelProbability(
    meta?.model_probability ?? meta?.model_win_probability ?? meta?.modelWinProbability,
  )
  const breakeven = breakevenWinProbability(pickOdds)

  if (modelProb != null) {
    if (modelProb < breakeven + buffer) return false
    const ev = expectedUnits(pickOdds, modelProb)
    return ev == null || ev >= minExpectedUnits
  }

  const edge = Number(meta?.calculated_edge)
  if (!Number.isFinite(edge)) {
    return pickOdds >= 100
  }

  const minEdgeFromJuice = (breakeven + buffer - 0.5) * 100
  return edge >= Math.max(minEdgeFromJuice, 0)
}

/** Sort key: prefer positive EV, then plus money at similar edge. */
export function unitEconomicsSortScore(analysis) {
  const odds = analysis?.sportsbookOdds ?? analysis?.odds
  const modelProb = normalizeModelProbability(
    analysis?.modelWinProbability ?? analysis?.model_win_probability,
  )
  const edge = Number(analysis?.calculatedEdge ?? analysis?.calculated_edge) || 0
  const ev = modelProb != null && odds != null
    ? expectedUnits(odds, modelProb)
    : edge / 100
  const dogBonus = odds != null && odds >= 100 ? 0.05 : 0
  return (ev ?? 0) + dogBonus
}
