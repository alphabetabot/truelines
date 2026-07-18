/** Shared publish thresholds for Vega picks (July 2026 tightening). */

export const TRACK_RECORD_ERA_START = '2026-07-01'

export const BET_EDGE_MIN = 6
export const BET_CONFIDENCE_MIN = 72
export const BET_FACTORS_MIN = 5
export const DATA_QUALITY_MIN = 75

/** Favorites at or below this line need extra edge + model vs breakeven clearance. */
export const HEAVY_CHALK = -130
export const HEAVY_CHALK_EDGE_MIN = 8

/** Standard juice band (-131 to -115). */
export const MODERATE_CHALK = -115
export const MODERATE_CHALK_EDGE_MIN = 7

/** Model win % must exceed implied breakeven by this margin (e.g. 0.025 = 2.5 pts). */
export const MODEL_PROB_BUFFER = 0.025

/** Minimum expected units per 1u flat bet to publish. */
export const MIN_EXPECTED_UNITS = 0.04

/** @deprecated LEAN is no longer used for pick #1 — kept for premium slot #2 */
export const LEAN_EDGE_MIN = 5

export const MAX_DAILY_PICKS = 2
export const PREMIUM_DAILY_PICK_COUNT = 2
export const PUBLISH_BET_ONLY = true

/** Second premium slot: BET only until unit record stabilizes. */
export const PUBLISH_LEAN_SLOT = false

/** Second premium slot may use LEAN when enabled and no second BET clears the bar. */
export const LEAN_SLOT_MIN_DATA_QUALITY = 70
export const LEAN_SLOT_MIN_EDGE = LEAN_EDGE_MIN
