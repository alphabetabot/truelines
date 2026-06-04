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

export function aggregatePickPerformance(picks) {
  const graded = (picks || []).filter(isGradedPick)
  const wins = graded.filter(p => String(p.result).trim().toUpperCase() === 'W').length
  const losses = graded.filter(p => String(p.result).trim().toUpperCase() === 'L').length
  const pushes = graded.filter(p => isPushResult(p.result)).length
  const decided = wins + losses
  const totalUnits = graded.reduce((s, p) => s + (parseFloat(p.units) || 0), 0)
  const winRate = decided > 0 ? Math.round((wins / decided) * 100) : null

  return {
    wins,
    losses,
    pushes,
    decided,
    totalUnits,
    winRate,
    count: graded.length,
  }
}
