import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, AlertTriangle } from 'lucide-react'
import {
  PERFORMANCE_PERIODS,
  filterPicksByPeriod,
  aggregatePickPerformance,
} from '../lib/pickPerformance'
import { trackPickPerformanceView } from '../lib/analytics'

export default function PickPerformanceHero({ picks = [], loading = false, error = null }) {
  const [period, setPeriod] = useState('7d')

  useEffect(() => {
    trackPickPerformanceView(period)
  }, [period])

  const stats = useMemo(() => {
    const filtered = filterPicksByPeriod(picks, period)
    return aggregatePickPerformance(filtered)
  }, [picks, period])

  const unitsLabel = stats.count === 0
    ? '—'
    : `${stats.totalUnits > 0 ? '+' : ''}${stats.totalUnits.toFixed(2)}u`

  const roiLabel = stats.roi != null ? `${stats.roi > 0 ? '+' : ''}${stats.roi}%` : '—'
  const edgeLabel = stats.avgEdge != null ? `+${stats.avgEdge}%` : '—'

  const recordLabel = stats.count === 0
    ? '—'
    : stats.pushes > 0
      ? `${stats.wins}-${stats.losses}-${stats.pushes}`
      : `${stats.wins}-${stats.losses}`

  const winRateLabel = stats.winRate != null ? `${stats.winRate}%` : '—'

  return (
    <section className="rounded-2xl overflow-hidden mb-5" style={{ border: '2px solid var(--gold)', background: 'var(--bg-card)' }}>
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2" style={{ background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={16} style={{ color: 'var(--gold)' }} />
          <span className="text-sm font-black text-white">Pick performance</span>
        </div>
        <div className="flex gap-1">
          {PERFORMANCE_PERIODS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
              style={{
                background: period === key ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                color: period === key ? 'var(--text-on-cta)' : 'rgba(255,255,255,0.85)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Loading record…</p>
      ) : error ? (
        <div className="flex items-start gap-2 px-4 py-4">
          <AlertTriangle size={16} style={{ color: '#dc2626' }} className="shrink-0 mt-0.5" />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
          {[
            { label: 'Record', value: recordLabel, sub: stats.pushes > 0 ? 'W-L-P' : 'W-L' },
            { label: 'Win rate', value: winRateLabel, sub: stats.decided > 0 ? `${stats.decided} decided` : 'No decisions' },
            { label: 'ROI', value: roiLabel, sub: `${stats.count} graded` },
            { label: 'Avg edge', value: edgeLabel, sub: stats.avgClv != null ? `CLV ${stats.avgClv > 0 ? '+' : ''}${stats.avgClv}%` : 'Edge vs market' },
          ].map(({ label, value, sub }, i, arr) => (
            <div
              key={label}
              className="text-center py-4 px-2"
              style={{ borderRight: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-center px-4 py-2.5" style={{ color: 'var(--text-muted)', borderTop: '1px solid #f1f5f9' }}>
        Graded to the game on each pick&apos;s date · Past results don&apos;t guarantee future performance
      </p>
    </section>
  )
}
