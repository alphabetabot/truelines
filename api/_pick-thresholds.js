/** Shared publish thresholds for Vega picks (July 2026 tightening). */

export const TRACK_RECORD_ERA_START = '2026-07-01'

export const BET_EDGE_MIN = 5
export const BET_CONFIDENCE_MIN = 70
export const BET_FACTORS_MIN = 5
export const DATA_QUALITY_MIN = 75

export const HEAVY_CHALK = -150
export const HEAVY_CHALK_EDGE_MIN = 6

/** @deprecated LEAN is no longer used for pick #1 — kept for premium slot #2 */
export const LEAN_EDGE_MIN = 3.5

export const MAX_DAILY_PICKS = 4
export const FREE_DAILY_PICK_COUNT = 1
export const PREMIUM_DAILY_PICK_COUNT = 3
export const PUBLISH_BET_ONLY = true
export const PUBLISH_LEAN_SLOT = false

/** Second premium slot may use LEAN when no second BET clears the bar. */
export const LEAN_SLOT_MIN_DATA_QUALITY = 65
export const LEAN_SLOT_MIN_EDGE = LEAN_EDGE_MIN
