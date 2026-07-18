/** Slate quality, odds gates, and pick validation for Vega daily picks. */

import { parseAmericanOdds } from './_pick-utils.js'
import {
  passesUnitEconomicsGate,
} from './_pick-economics.js'
import {
  BET_EDGE_MIN,
  DATA_QUALITY_MIN,
  HEAVY_CHALK,
  HEAVY_CHALK_EDGE_MIN,
  LEAN_SLOT_MIN_DATA_QUALITY,
  LEAN_SLOT_MIN_EDGE,
  MIN_EXPECTED_UNITS,
  MODEL_PROB_BUFFER,
  MODERATE_CHALK,
  MODERATE_CHALK_EDGE_MIN,
  PREMIUM_DAILY_PICK_COUNT,
  PUBLISH_BET_ONLY,
  PUBLISH_LEAN_SLOT,
} from './_pick-thresholds.js'

const MIN_SLATE_QUALITY = 6
const MIN_PUBLISH_CONFIDENCE = 5
const MIN_TOP_PICK_CONFIDENCE = 5
const ODDS_MATCH_TOLERANCE = 15

export function isMlbEnginePick(pick) {
  return pick?.sport === 'MLB' && pick?.pickMeta?.recommendation
}

export function isBetRecommendation(rec) {
  return rec === 'BET'
}

export function isPremiumLeanSlotRecommendation(rec) {
  return rec === 'LEAN'
}

/** Pick #1 (newsletter) must be BET; pick #2 may be BET or LEAN for Premium when enabled. */
export function mlbRecommendationAllowed(rec, slotIndex = 0) {
  if (isBetRecommendation(rec)) return true
  if (slotIndex > 0 && PUBLISH_LEAN_SLOT && isPremiumLeanSlotRecommendation(rec)) return true
  if (!PUBLISH_BET_ONLY) return rec === 'BET' || rec === 'LEAN'
  return false
}

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
  return Boolean(valid(away) && valid(home))
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

function passesChalkEdgeGate(pickOdds, meta) {
  if (pickOdds == null) return true
  const edge = Number(meta?.calculated_edge)
  if (!Number.isFinite(edge)) return pickOdds > HEAVY_CHALK

  if (pickOdds <= HEAVY_CHALK) {
    return edge >= HEAVY_CHALK_EDGE_MIN
  }
  if (pickOdds <= MODERATE_CHALK) {
    return edge >= MODERATE_CHALK_EDGE_MIN
  }
  return true
}

function passesPublishEconomics(pickOdds, meta, warnings, gameLabel) {
  if (!passesUnitEconomicsGate(pickOdds, meta, {
    buffer: MODEL_PROB_BUFFER,
    minExpectedUnits: MIN_EXPECTED_UNITS,
  })) {
    warnings.push(`Rejected juice economics for ${gameLabel} at ${pickOdds} — model edge does not clear breakeven + buffer`)
    return false
  }
  return true
}

/**
 * Stricter gate before storing/sending picks — rejects thin data, bad odds, low confidence.
 */
export function selectPublishablePicks(picks, slateEntries, {
  minConfidence = MIN_PUBLISH_CONFIDENCE,
  minTopPickConfidence = MIN_TOP_PICK_CONFIDENCE,
  minSlateQuality = MIN_SLATE_QUALITY,
} = {}) {
  const { picks: matched, warnings } = validatePicksAgainstSlate(picks, slateEntries)
  const publishable = []

  matched.forEach((pick, index) => {
    const entry = (slateEntries || []).find(e => pickMatchesGame(pick, e))
    if (!entry) return

    const pickOdds = pick.odds ?? parseAmericanOdds(pick.bet)
    const refPrice = bestPriceForPick(pick, entry)
    const slateQuality = scoreGameDataQuality(entry)
    const confidence = Number(pick.confidence) || 0
    const minConf = index === 0 ? minTopPickConfidence : minConfidence
    const meta = pick.pickMeta || pick.pick_meta || {}
    const recommendation = pick.recommendation || meta.recommendation

    if (!oddsRoughlyMatch(pickOdds, refPrice, ODDS_MATCH_TOLERANCE)) {
      warnings.push(`Rejected odds mismatch for ${pick.game} (${pickOdds} vs ${refPrice})`)
      return
    }
    if (entry.sport === 'MLB' && !mlbHasPitcherStats(entry)) {
      warnings.push(`Rejected MLB pick without both SP stat lines: ${pick.game}`)
      return
    }
    if (pickOdds != null && pickOdds <= HEAVY_CHALK && !passesChalkEdgeGate(pickOdds, meta)) {
      warnings.push(`Rejected expensive chalk without sufficient edge for ${pick.game}`)
      return
    }
    if (!passesPublishEconomics(pickOdds, meta, warnings, pick.game)) {
      return
    }
    if (slateQuality < minSlateQuality) {
      warnings.push(`Rejected thin data quality (${slateQuality}) for ${pick.game}`)
      return
    }
    if (confidence < minConf) {
      warnings.push(`Rejected confidence ${confidence} < ${minConf} for ${pick.game}`)
      return
    }

    if (recommendation && !mlbRecommendationAllowed(recommendation)) {
      warnings.push(`Rejected ${recommendation} recommendation for ${pick.game}`)
      return
    }

    if (meta?.calculated_edge != null) {
      const edge = Number(meta.calculated_edge)
      if (Number.isFinite(edge) && edge < BET_EDGE_MIN) {
        warnings.push(`Rejected edge ${edge}% below BET minimum ${BET_EDGE_MIN}% for ${pick.game}`)
        return
      }
    }

    if (meta?.data_quality_score != null && Number(meta.data_quality_score) < DATA_QUALITY_MIN) {
      warnings.push(`Rejected data quality ${meta.data_quality_score} < ${DATA_QUALITY_MIN} for ${pick.game}`)
      return
    }

    if (!pick.edge || String(pick.edge).trim().length < 80) {
      warnings.push(`Rejected short edge write-up for ${pick.game}`)
      return
    }

    publishable.push(pick)
  })

  return { picks: publishable, warnings }
}

/**
 * Premium slate: up to 2 picks — BET for pick #1 (newsletter), BET or LEAN for pick #2.
 */
export function buildPremiumDailySlate(extracted, slate, { enginePicks = [] } = {}) {
  const warnings = []
  const picks = []
  const seenGames = new Set()

  const tryAdd = (pick, { leanSlot = false } = {}) => {
    if (picks.length >= PREMIUM_DAILY_PICK_COUNT) return false
    const gameKey = String(pick.game || '').toLowerCase()
    if (seenGames.has(gameKey)) return false

    const entry = (slate || []).find(e => pickMatchesGame(pick, e))
    if (!entry) {
      warnings.push(`No slate match for pick: ${pick.game || pick.pickSelection}`)
      return false
    }

    const rec = pick.recommendation || pick.pickMeta?.recommendation || pick.pick_meta?.recommendation
    const slotIndex = picks.length
    if (!mlbRecommendationAllowed(rec, slotIndex) && !(leanSlot && rec === 'LEAN')) {
      return false
    }

    const ok = leanSlot || rec === 'LEAN'
      ? validateLeanPickForPublish(pick, entry, warnings)
      : validateBetPickForPublish(pick, entry, slotIndex, warnings)

    if (!ok) return false
    picks.push(pick)
    seenGames.add(gameKey)
    return true
  }

  const { picks: strictBets, warnings: strictWarnings } = selectPublishablePicks(extracted, slate)
  warnings.push(...strictWarnings)
  for (const pick of strictBets) tryAdd(pick)

  for (const pick of enginePicks || []) {
    const rec = pick.recommendation || pick.pickMeta?.recommendation
    if (rec === 'BET') tryAdd(pick)
  }

  if (picks.length < PREMIUM_DAILY_PICK_COUNT && PUBLISH_LEAN_SLOT) {
    const leanCandidates = [...(extracted || []), ...(enginePicks || [])]
      .filter(p => (p.recommendation || p.pickMeta?.recommendation) === 'LEAN')

    for (const pick of leanCandidates) {
      if (picks.length >= PREMIUM_DAILY_PICK_COUNT) break
      tryAdd(pick, { leanSlot: true })
    }
  }

  picks.sort((a, b) => {
    const ra = a.recommendation || a.pickMeta?.recommendation
    const rb = b.recommendation || b.pickMeta?.recommendation
    if (ra === 'BET' && rb !== 'BET') return -1
    if (rb === 'BET' && ra !== 'BET') return 1
    return 0
  })

  let tier = 'none'
  if (picks.length >= PREMIUM_DAILY_PICK_COUNT) tier = 'full'
  else if (picks.length === 1) tier = 'partial'

  return {
    picks: picks.slice(0, PREMIUM_DAILY_PICK_COUNT),
    warnings,
    tier,
  }
}

export function resolvePicksForPublish(extracted, slate, { enginePicks = [] } = {}) {
  return buildPremiumDailySlate(extracted, slate, { enginePicks })
}

function validateBetPickForPublish(pick, entry, index, warnings) {
  const pickOdds = pick.odds ?? parseAmericanOdds(pick.bet)
  const refPrice = bestPriceForPick(pick, entry)
  const slateQuality = scoreGameDataQuality(entry)
  const confidence = Number(pick.confidence) || 0
  const minConf = index === 0 ? MIN_TOP_PICK_CONFIDENCE : MIN_PUBLISH_CONFIDENCE
  const meta = pick.pickMeta || pick.pick_meta || {}
  const recommendation = pick.recommendation || meta.recommendation

  if (!oddsRoughlyMatch(pickOdds, refPrice, ODDS_MATCH_TOLERANCE)) {
    warnings.push(`Rejected odds mismatch for ${pick.game} (${pickOdds} vs ${refPrice})`)
    return false
  }
  if (entry.sport === 'MLB' && !mlbHasPitcherStats(entry)) {
    warnings.push(`Rejected MLB pick without both SP stat lines: ${pick.game}`)
    return false
  }
  if (pickOdds != null && pickOdds <= HEAVY_CHALK && !passesChalkEdgeGate(pickOdds, meta)) {
    warnings.push(`Rejected expensive chalk without sufficient edge: ${pick.game}`)
    return false
  }
  if (!passesPublishEconomics(pickOdds, meta, warnings, pick.game)) {
    return false
  }
  if (slateQuality < MIN_SLATE_QUALITY) {
    warnings.push(`Rejected thin data quality (${slateQuality}) for ${pick.game}`)
    return false
  }
  if (confidence < minConf) {
    warnings.push(`Rejected confidence ${confidence} < ${minConf} for ${pick.game}`)
    return false
  }
  if (recommendation && !isBetRecommendation(recommendation)) {
    warnings.push(`Rejected non-BET recommendation for ${pick.game}`)
    return false
  }
  if (meta?.calculated_edge != null) {
    const edge = Number(meta.calculated_edge)
    if (Number.isFinite(edge) && edge < BET_EDGE_MIN) {
      warnings.push(`Rejected edge ${edge}% below BET minimum ${BET_EDGE_MIN}% for ${pick.game}`)
      return false
    }
  }
  if (meta?.data_quality_score != null && Number(meta.data_quality_score) < DATA_QUALITY_MIN) {
    warnings.push(`Rejected data quality ${meta.data_quality_score} < ${DATA_QUALITY_MIN} for ${pick.game}`)
    return false
  }
  if (!pick.edge || String(pick.edge).trim().length < 80) {
    warnings.push(`Rejected short edge write-up for ${pick.game}`)
    return false
  }
  return true
}

function validateLeanPickForPublish(pick, entry, warnings) {
  const meta = pick.pickMeta || pick.pick_meta || {}
  const recommendation = pick.recommendation || meta.recommendation
  if (recommendation !== 'LEAN') return false

  const pickOdds = pick.odds ?? parseAmericanOdds(pick.bet)
  const refPrice = bestPriceForPick(pick, entry)
  if (!oddsRoughlyMatch(pickOdds, refPrice, ODDS_MATCH_TOLERANCE)) {
    warnings.push(`Rejected LEAN odds mismatch for ${pick.game}`)
    return false
  }
  if (entry.sport === 'MLB' && !mlbHasPitcherStats(entry)) {
    warnings.push(`Rejected LEAN MLB pick without both SP lines: ${pick.game}`)
    return false
  }
  const edge = Number(meta.calculated_edge)
  if (Number.isFinite(edge) && edge < LEAN_SLOT_MIN_EDGE) {
    warnings.push(`Rejected LEAN edge ${edge}% below ${LEAN_SLOT_MIN_EDGE}% for ${pick.game}`)
    return false
  }
  const dq = Number(meta.data_quality_score)
  if (Number.isFinite(dq) && dq < LEAN_SLOT_MIN_DATA_QUALITY) {
    warnings.push(`Rejected LEAN data quality ${dq} for ${pick.game}`)
    return false
  }
  if (!pick.edge || String(pick.edge).trim().length < 60) {
    warnings.push(`Rejected short LEAN write-up for ${pick.game}`)
    return false
  }
  return true
}

export const PICK_METRICS_PROMPT_RULES = `
METRICS & CONFIDENCE RULES (strict — July 2026 era):
11. Every Edge MUST cite at least TWO numeric facts from STATS or MATCHUP REFERENCE OR engine model vs market probabilities.
12. Confidence rubric: 5 = MLB engine BET with ≥5% edge + 70+ confidence score + data quality ≥75; never 5 without two numeric facts in Edge.
13. Avoid ML favorites worse than -150 unless model edge ≥6% — explain in Edge.
14. If both SPs are TBD or stats missing, PASS — do not publish.
15. Do not cite ballpark, weather, records, injuries, or goalies unless shown in STATS for that matchup.
16. Bet line odds and book MUST match MATCHUP REFERENCE or MLB engine best price exactly.
17. NBA/NHL: only publish with confidence 5 and a clear price edge — otherwise skip.
18. MLB totals/spreads must weigh weather (wind/temp) and listed injuries when relevant.
19. Premium daily card: ${PREMIUM_DAILY_PICK_COUNT} picks — Pick #1 must be BET (free newsletter). Pick #2 may be BET or LEAN (Premium only).
20. Prefer underdogs and plus-money when model edge is similar; expensive favorites need model win % above breakeven + 2.5 pts and ≥${MODERATE_CHALK_EDGE_MIN}% edge (-115 to -130) or ≥${HEAVY_CHALK_EDGE_MIN}% below -130.
21. Never publish a minus-money favorite unless expected units per 1u bet is positive at the listed price.
21. Pick #1: "- Recommendation: BET". Pick #2: "- Recommendation: BET" or "- Recommendation: LEAN".
`.trim()
