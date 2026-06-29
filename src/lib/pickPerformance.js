/** Aggregate graded pick rows for performance UI. */

export const PERFORMANCE_PERIODS = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: 'all', label: 'Total' },
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

  const days = periodKey === '7d' ? 7 : 30
  const cutoff = new Date(now)
  cutoff.setHours(12, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - days)

  return graded.filter(p => {
    const d = parsePickDate(p.date)
    return d && d >= cutoff
  })
}

export function aggregatePickPerformance(picks, { includeByRecommendation = true } = {}) {
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
    count: graded.length,
    ...(includeByRecommendation ? { byRecommendation: aggregateByRecommendation(graded) } : {}),
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
