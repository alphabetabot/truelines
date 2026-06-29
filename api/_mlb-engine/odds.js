/** Moneyline implied probability and vig removal. */

export function americanToImpliedProbability(odds) {
  const n = Number(odds)
  if (!Number.isFinite(n) || Math.abs(n) < 100) return null
  if (n > 0) return 100 / (n + 100)
  return Math.abs(n) / (Math.abs(n) + 100)
}

export function impliedProbabilityToAmerican(prob) {
  const p = Number(prob)
  if (!Number.isFinite(p) || p <= 0 || p >= 1) return null
  if (p >= 0.5) return Math.round(-(p / (1 - p)) * 100)
  return Math.round(((1 - p) / p) * 100)
}

/** Remove vig when both sides have prices; returns decimal probs summing to 1. */
export function removeVig(impliedAway, impliedHome) {
  const a = Number(impliedAway)
  const h = Number(impliedHome)
  if (!Number.isFinite(a) || !Number.isFinite(h) || a <= 0 || h <= 0) {
    return { away: impliedAway, home: impliedHome, vigRemoved: false }
  }
  const total = a + h
  return {
    away: a / total,
    home: h / total,
    vigRemoved: true,
    overround: total - 1,
  }
}

function bestH2HPrice(game, teamName) {
  let best = null
  for (const book of game.bookmakers || []) {
    const market = book.markets?.find(m => m.key === 'h2h')
    const outcome = market?.outcomes?.find(o => o.name === teamName)
    if (outcome?.price == null) continue
    const price = Number(outcome.price)
    if (!Number.isFinite(price)) continue
    if (!best || price > best.price) {
      best = { price, book: book.key }
    }
  }
  return best
}

function h2hPriceRange(game, teamName) {
  const prices = []
  for (const book of game.bookmakers || []) {
    const market = book.markets?.find(m => m.key === 'h2h')
    const outcome = market?.outcomes?.find(o => o.name === teamName)
    if (outcome?.price != null) prices.push(Number(outcome.price))
  }
  if (!prices.length) return null
  return { min: Math.min(...prices), max: Math.max(...prices), spread: Math.max(...prices) - Math.min(...prices) }
}

export function getMarketMoneylineSnapshot(game) {
  const awayBest = bestH2HPrice(game, game.away)
  const homeBest = bestH2HPrice(game, game.home)
  if (!awayBest || !homeBest) return null

  const rawAway = americanToImpliedProbability(awayBest.price)
  const rawHome = americanToImpliedProbability(homeBest.price)
  const fair = removeVig(rawAway, rawHome)
  const awayRange = h2hPriceRange(game, game.away)
  const homeRange = h2hPriceRange(game, game.home)

  return {
    awayOdds: awayBest.price,
    homeOdds: homeBest.price,
    awayBook: awayBest.book,
    homeBook: homeBest.book,
    rawAwayImplied: rawAway != null ? rawAway * 100 : null,
    rawHomeImplied: rawHome != null ? rawHome * 100 : null,
    fairAwayImplied: fair.away != null ? fair.away * 100 : null,
    fairHomeImplied: fair.home != null ? fair.home * 100 : null,
    vigRemoved: fair.vigRemoved,
    awayRange,
    homeRange,
    openingAwayOdds: awayRange?.min ?? awayBest.price,
    openingHomeOdds: homeRange?.min ?? homeBest.price,
  }
}
