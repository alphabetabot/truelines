/**
 * Feature flags for premium / splits — off until backends exist.
 * Gate UI with isFeatureEnabled() and PremiumFeatureSlot.
 */

export const FEATURE_FLAGS = {
  bettingSplits: false,
  sharpPublicPercentages: false,
  steamMoves: false,
  premiumAIPicks: false,
  historicalPickPerformance: false,
  savedBettingTracker: false,
}

const PREMIUM_GATED_FEATURES = new Set([
  'bettingSplits',
  'sharpPublicPercentages',
  'steamMoves',
  'premiumAIPicks',
  'historicalPickPerformance',
  'savedBettingTracker',
])

export function isFeatureEnabled(flag, { isPremium = false } = {}) {
  if (PREMIUM_GATED_FEATURES.has(flag)) return isPremium
  return FEATURE_FLAGS[flag] === true
}

/** Override flags in tests or staging via window (optional). */
export function getFeatureFlags() {
  if (typeof window !== 'undefined' && window.__TRUEODDSIQ_FLAGS__) {
    return { ...FEATURE_FLAGS, ...window.__TRUEODDSIQ_FLAGS__ }
  }
  return FEATURE_FLAGS
}

export function isFeatureEnabledSafe(flag, options = {}) {
  if (PREMIUM_GATED_FEATURES.has(flag)) return Boolean(options.isPremium)
  return getFeatureFlags()[flag] === true
}
