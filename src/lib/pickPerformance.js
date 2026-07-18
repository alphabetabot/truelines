/** Aggregate graded pick rows for performance UI. */

export const TRACK_RECORD_ERA_START = '2026-07-01'
export const TRACK_RECORD_ERA_LABEL = 'Since July 1, 2026'

export const PERFORMANCE_PERIODS = [
  { key: 'since_july', label: 'Since July' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: 'all', label: 'All time' },
]

export function parsePickDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(`${dateStr}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function isGradedPick(pick) {
  return Boolean(pick?.result && String(pick.result).trim() !== '')
}

export function isPushResult(result) {
  const r = String(result || '').trim().toUpperCase()
  return r === 'P' || r === 'PUSH'
}

export function filterPicksByPeriod(picks, periodKey, now = new Date()) {
  const graded = (picks || []).filter(isGradedPick)
  if (periodKey === 'all') return graded

  if (periodKey === 'since_july') {
    const start = parsePickDate(TRACK_RECORD_ERA_START)
    return graded.filter(p => {
      const d = parsePickDate(p.date)
      return d && start && d >= start
    })
  }

  const days = periodKey === '7d' ? 7 : 30
  const cutoff = new Date(now)
  cutoff.setHours(12, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - days)
  const eraStart = parsePickDate(TRACK_RECORD_ERA_START)

  return graded.filter(p => {
    const d = parsePickDate(p.date)
    if (!d || d < cutoff) return false
    if (eraStart && d < eraStart) return false
    return true
  })
}

export function parsePickOdds(pick) {
  if (pick?.displayOdds != null) {
    const n = Number(pick.displayOdds)
    if (Number.isFinite(n)) return n
  }
  if (pick?.odds != null) {
    const n = Number(pick.odds)
    if (Number.isFinite(n)) return n
  }
  const match = String(pick?.bet || '').match(/([+-]\d{3,})/)
  return match ? parseInt(match[1], 10) : null
}

export function oddsBucketForPick(pick) {
  const odds = parsePickOdds(pick)
  if (!Number.isFinite(odds)) return 'unknown'
  if (odds >= 100) return 'dog'
  if (odds >= -115) return 'pickem'
  if (odds >= -150) return 'chalk'
  return 'heavy'
}

export const ODDS_BUCKET_LABELS = {
  dog: 'Plus money (+100+)',
  pickem: 'Pick’em (-114 to +99)',
  chalk: 'Chalk (-115 to -149)',
  heavy: 'Heavy chalk (-150+)',
  unknown: 'Unknown odds',
}

export function aggregateByOddsBucket(picks) {
  const buckets = { dog: [], pickem: [], chalk: [], heavy: [], unknown: [] }
  for (const pick of picks || []) {
    const key = oddsBucketForPick(pick)
    buckets[key].push(pick)
  }

  const summary = {}
  for (const [key, rows] of Object.entries(buckets)) {
    if (!rows.length) continue
    summary[key] = aggregatePickPerformance(rows, { includeByRecommendation: false, includeByOddsBucket: false })
  }
  return summary
}

export function aggregatePickPerformance(picks, { includeByRecommendation = true, includeByOddsBucket = true } = {}) {
  const graded = (picks || []).filter(isGradedPick)
  const wins = graded.filter(p => String(p.result).trim().toUpperCase() === 'W').length
  const losses = graded.filter(p => String(p.result).trim().toUpperCase() === 'L').length
  const pushes = graded.filter(p => isPushResult(p.result)).length
  const decided = wins + losses
  const totalUnits = graded.reduce((s, p) => s + (parseFloat(p.units) || 0), 0)
  const winRate = decided > 0 ? Math.round((wins / decided) * 100) : null
  const roi = decided > 0 ? Math.round((totalUnits / decided) * 1000) / 10 : null

  const withEdge = graded.filter(p => p.pick_meta?.calculated_edge != null || p.pickMeta?.calculated_edge != null)
  const avgEdge = withEdge.length
    ? Math.round(
      withEdge.reduce((s, p) => {
        const meta = p.pick_meta || p.pickMeta || {}
        return s + (Number(meta.calculated_edge) || 0)
      }, 0) / withEdge.length * 10
    ) / 10
    : null

  const withClv = graded.filter(p => {
    const meta = p.pick_meta || p.pickMeta || {}
    return meta.closing_line_value != null || meta.closing_line_value === 0
  })
  const avgClv = withClv.length
    ? Math.round(
      withClv.reduce((s, p) => {
        const meta = p.pick_meta || p.pickMeta || {}
        return s + (Number(meta.closing_line_value) || 0)
      }, 0) / withClv.length * 10
    ) / 10
    : null

  const withOdds = graded
    .map(p => ({ pick: p, odds: parsePickOdds(p) }))
    .filter(x => Number.isFinite(x.odds))
  const avgOdds = withOdds.length
    ? Math.round(withOdds.reduce((s, x) => s + x.odds, 0) / withOdds.length)
    : null

  return {
    wins,
    losses,
    pushes,
    decided,
    totalUnits,
    winRate,
    roi,
    avgEdge,
    avgClv,
    avgOdds,
    count: graded.length,
    ...(includeByRecommendation ? { byRecommendation: aggregateByRecommendation(graded) } : {}),
    ...(includeByOddsBucket ? { byOddsBucket: aggregateByOddsBucket(graded) } : {}),
  }
}

export function aggregateByRecommendation(picks) {
  const buckets = { BET: [], LEAN: [], PASS: [], AVOID: [], OTHER: [] }
  for (const pick of picks || []) {
    const rec = String(pick.recommendation || pick.pick_meta?.recommendation || pick.pickMeta?.recommendation || 'OTHER').toUpperCase()
    const key = buckets[rec] ? rec : 'OTHER'
    buckets[key].push(pick)
  }

  const summary = {}
  for (const [key, rows] of Object.entries(buckets)) {
    if (!rows.length) continue
    summary[key] = aggregatePickPerformance(rows, { includeByRecommendation: false })
  }
  return summary
}
