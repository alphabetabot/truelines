/** Juice-aware helpers for edge scoring and publish gates. */

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

export function expectedUnits(americanOdds, modelProbability) {
  const n = Number(modelProbability)
  if (!Number.isFinite(n)) return null
  const prob = n > 1 ? n / 100 : n
  const winPay = winProfitPerUnit(americanOdds)
  return prob * winPay - (1 - prob)
}
