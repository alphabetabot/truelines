/** Slate quality, odds gates, and pick validation for Vega daily picks. */

import { parseAmericanOdds } from './pick-utils.js'

const HEAVY_CHALK = -180

export function countBooksWithMarket(game, marketKey) {
  return (game.bookmakers || []).filter(book =>
    book.markets?.some(m => m.key === marketKey && m.outcomes?.some(o => o.price != null))
  ).length
}

/** Game must have h2h prices from at least two books. */
export function hasActionableOdds(game) {
  if (countBooksWithMarket(game, 'h2h') < 2) return false
  for (const book of game.bookmakers || []) {
    const market = book.markets?.find(m => m.key === 'h2h')
    if (market?.outcomes?.some(o => {
      const price = Number(o.price)
      return !Number.isNaN(price) && Math.abs(price) >= 100
    })) {
      return true
    }
  }
  return false
}

export function mlbHasPitcherStats(game) {
  const away = game.stats?.awayPitcher
  const home = game.stats?.homePitcher
  const valid = p => p && p.era && p.era !== 'N/A' && p.whip && p.whip !== 'N/A'
  return Boolean(valid(away) || valid(home))
}

/** Higher = richer metrics for Claude (sort slate priority). */
export function scoreGameDataQuality(game) {
  let score = 0
  if (hasActionableOdds(game)) score += 3
  if (countBooksWithMarket(game, 'spreads') >= 2) score += 1
  if (countBooksWithMarket(game, 'totals') >= 2) score += 1

  if (game.sport === 'MLB') {
    if (mlbHasPitcherStats(game)) score += 3
    if (game.stats?.awayTeam?.wins) score += 1
    if (game.stats?.homeTeam?.wins) score += 1
    if (game.weather?.temp || game.stats?.weatherReport) score += 1
    if (game.venue) score += 1
    if (game.stats?.awayInjuries?.length) score += 1
    if (game.stats?.homeInjuries?.length) score += 1
  }

  if (game.sport === 'NBA') {
    if (game.stats?.awayStanding) score += 2
    if (game.stats?.homeStanding) score += 2
    if (game.stats?.awayInjuries?.length) score += 1
    if (game.stats?.homeInjuries?.length) score += 1
  }

  if (game.sport === 'NHL') {
    if (game.stats?.awayStanding) score += 2
    if (game.stats?.homeStanding) score += 2
    if (game.stats?.awayGoalie || game.stats?.homeGoalie) score += 2
    if (game.stats?.awayInjuries?.length) score += 1
    if (game.stats?.homeInjuries?.length) score += 1
  }

  return score
}

export function filterBettableGames(games) {
  return (games || []).filter(hasActionableOdds)
}

export function rankGamesByDataQuality(games) {
  return [...(games || [])].sort((a, b) => scoreGameDataQuality(b) - scoreGameDataQuality(a))
}

function normalizeMatchup(away, home) {
  return `${String(away || '').trim()} @ ${String(home || '').trim()}`.toLowerCase()
}

function pickMatchesGame(pick, entry) {
  const gameStr = String(pick.game || '').toLowerCase()
  const target = normalizeMatchup(entry.away, entry.home)
  return gameStr === target || gameStr.includes(entry.away?.toLowerCase()) && gameStr.includes(entry.home?.toLowerCase())
}

function oddsRoughlyMatch(pickOdds, referencePrice, tolerance = 25) {
  if (pickOdds == null || referencePrice == null) return true
  const a = Number(pickOdds)
  const b = Number(referencePrice)
  if (Number.isNaN(a) || Number.isNaN(b)) return true
  return Math.abs(a - b) <= tolerance
}

function bestPriceForPick(pick, entry) {
  const odds = pick.odds ?? parseAmericanOdds(pick.bet)
  const text = `${pick.pickSelection || ''} ${pick.bet || ''}`.toLowerCase()
  const bo = entry.bestOdds || {}

  if (/\bunder\b/.test(text) && bo.under) return bo.under.price
  if (/\bover\b/.test(text) && bo.over) return bo.over.price

  if (entry.home && text.includes(entry.home.toLowerCase().split(' ').pop())) {
    if (bo.homeSpread) return bo.homeSpread.price
    if (bo.homeML) return bo.homeML.price
  }
  if (entry.away && text.includes(entry.away.toLowerCase().split(' ').pop())) {
    if (bo.awaySpread) return bo.awaySpread.price
    if (bo.awayML) return bo.awayML.price
  }

  return bo.awayML?.price ?? bo.homeML?.price ?? null
}

/**
 * Drop picks that don't map to slate or have odds far from reference.
 * Returns { picks, warnings }.
 */
export function validatePicksAgainstSlate(picks, slateEntries) {
  const warnings = []
  const validated = []

  for (const pick of picks || []) {
    const entry = (slateEntries || []).find(e => pickMatchesGame(pick, e))
    if (!entry) {
      warnings.push(`No slate match for pick: ${pick.game || pick.pickSelection}`)
      continue
    }

    const refPrice = bestPriceForPick(pick, entry)
    const pickOdds = pick.odds ?? parseAmericanOdds(pick.bet)
    if (!oddsRoughlyMatch(pickOdds, refPrice)) {
      warnings.push(`Odds mismatch ${pickOdds} vs slate ${refPrice} for ${pick.game}`)
    }

    if (pickOdds != null && pickOdds <= HEAVY_CHALK && entry.sport === 'MLB' && !mlbHasPitcherStats(entry)) {
      warnings.push(`Heavy chalk without pitcher stats: ${pick.game}`)
    }

    validated.push(pick)
  }

  return { picks: validated, warnings }
}

export const PICK_METRICS_PROMPT_RULES = `
METRICS & CONFIDENCE RULES (strict):
11. Every Edge MUST cite at least TWO numeric facts from STATS or MATCHUP REFERENCE (ERA, WHIP, K/9, W-L, run diff, odds, spread, total line).
12. Confidence rubric: 5 = MLB both SP lines + weather/injury context + price edge, or NBA/NHL with records + injuries + goalie (NHL) + price edge; 4 = strong partial stats; 3 = thin data; never 5 without two numeric facts in Edge.
13. Avoid ML favorites worse than -180 unless ERA gap ≥1.5, run-diff gap ≥25 (MLB), or point-diff ≥8 (NBA/NHL) — explain in Edge.
14. If both SPs are TBD or stats missing, prefer spread/total or skip for a game with complete data.
15. Do not cite ballpark, weather, records, injuries, or goalies unless shown in STATS for that matchup.
16. Bet line odds and book MUST match MATCHUP REFERENCE best price exactly.
17. NBA picks should reference PPG/OPP PPG or home/road splits when provided; NHL picks should reference GF/GA, goalie names, and injury list when provided.
18. MLB totals/spreads must weigh weather (wind/temp) and listed injuries when relevant.
`.trim()
