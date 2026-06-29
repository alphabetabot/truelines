/** Pitcher scoring with advanced-metric proxies when FIP/xFIP unavailable. */

function num(value, fallback = null) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function estimateFip(stats = {}) {
  const era = num(stats.era)
  const whip = num(stats.whip)
  const k9 = num(stats.k9)
  const hr9 = num(stats.hr9)
  const bb9 = num(stats.bb9)
  const ip = num(stats.ip, 0)

  if (ip >= 20 && k9 != null && hr9 != null && bb9 != null) {
    // Rough FIP-style composite from rate stats
    return 3.1 + hr9 * 1.35 + bb9 * 0.95 - k9 * 0.22
  }
  if (era != null && whip != null) {
    return era * 0.72 + whip * 1.85
  }
  if (era != null) return era
  return null
}

export function estimateXfip(stats = {}) {
  const fip = estimateFip(stats)
  const hr9 = num(stats.hr9)
  if (fip == null) return null
  // Regress HR/9 toward league average (~1.1)
  return fip - (hr9 != null ? (hr9 - 1.1) * 0.35 : 0)
}

export function pitcherSampleQuality(stats = {}) {
  const ip = num(stats.ip, 0)
  if (ip >= 40) return 1
  if (ip >= 20) return 0.75
  if (ip >= 8) return 0.45
  return 0.2
}

/** Higher = better pitcher profile (0-100). */
export function scorePitcher(stats = {}) {
  if (!stats || stats.era === 'N/A') return null

  const fip = estimateFip(stats)
  const xfip = estimateXfip(stats)
  const k9 = num(stats.k9)
  const whip = num(stats.whip)
  const hr9 = num(stats.hr9, 1.1)
  const bb9 = num(stats.bb9, whip != null ? Math.max(1.5, whip * 2.8) : 3.2)
  const sample = pitcherSampleQuality(stats)

  if (fip == null && whip == null) return null

  let score = 50
  if (fip != null) score += (4.2 - fip) * 6.5
  if (xfip != null) score += (4.1 - xfip) * 4
  if (k9 != null) score += (k9 - 7.8) * 1.6
  if (whip != null) score += (1.28 - whip) * 18
  if (hr9 != null) score += (1.1 - hr9) * 4
  if (bb9 != null) score += (3.1 - bb9) * 2.2

  score = 50 + (score - 50) * (0.55 + sample * 0.45)
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function starterDepthScore(stats = {}) {
  const ip = num(stats.ip, 0)
  const gs = num(stats.gamesStarted, num(stats.gs, 0))
  if (ip <= 0) return 0.35
  const ipPerStart = gs > 0 ? ip / gs : ip / Math.max(1, Math.round(ip / 5.5))
  if (ipPerStart >= 5.8) return 1
  if (ipPerStart >= 5.2) return 0.8
  if (ipPerStart >= 4.6) return 0.55
  return 0.35
}
