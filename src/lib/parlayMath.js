/** Convert American odds to decimal multiplier (profit per $1 staked, including stake). */
export function americanToDecimal(american) {
  const n = Number(american)
  if (!Number.isFinite(n) || n === 0) return null
  if (n > 0) return 1 + n / 100
  return 1 + 100 / Math.abs(n)
}

/** Combined American odds from independent legs (illustrative — not book SGP pricing). */
export function combineParlayAmericanOdds(americanOddsList) {
  if (!americanOddsList?.length) return null
  let decimalProduct = 1
  for (const american of americanOddsList) {
    const d = americanToDecimal(american)
    if (!d) return null
    decimalProduct *= d
  }
  const profitPerDollar = decimalProduct - 1
  if (profitPerDollar <= 0) return null
  if (profitPerDollar >= 1) {
    return Math.round(profitPerDollar * 100)
  }
  return Math.round(-100 / profitPerDollar)
}

export function formatAmericanOdds(american) {
  if (american == null) return '—'
  return american > 0 ? `+${american}` : `${american}`
}

/** Payout including returned stake for a winning parlay. */
export function parlayPayout(stake, americanOddsList) {
  const stakeNum = Number(stake)
  if (!Number.isFinite(stakeNum) || stakeNum <= 0) return 0
  let decimalProduct = 1
  for (const american of americanOddsList) {
    const d = americanToDecimal(american)
    if (!d) return 0
    decimalProduct *= d
  }
  return stakeNum * decimalProduct
}
