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

  const recordLabel = stats.count === 0
    ? '—'
    : stats.pushes > 0
      ? `${stats.wins}-${stats.losses}-${stats.pushes}`
      : `${stats.wins}-${stats.losses}`

  const winRateLabel = stats.winRate != null ? `${stats.winRate}%` : '—'

  return (
    <section className="rounded-2xl overflow-hidden mb-5" style={{ border: '2px solid #f59e0b', background: '#fff' }}>
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2" style={{ background: '#0f172a' }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={16} style={{ color: '#f59e0b' }} />
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
                background: period === key ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                color: period === key ? '#0f172a' : 'rgba(255,255,255,0.85)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>Loading record…</p>
      ) : error ? (
        <div className="flex items-start gap-2 px-4 py-4">
          <AlertTriangle size={16} style={{ color: '#dc2626' }} className="shrink-0 mt-0.5" />
          <p className="text-xs" style={{ color: '#64748b' }}>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0">
          {[
            { label: 'Record', value: recordLabel, sub: stats.pushes > 0 ? 'W-L-P' : 'W-L' },
            { label: 'Win rate', value: winRateLabel, sub: stats.decided > 0 ? `${stats.decided} decided` : 'No decisions' },
            { label: 'Units', value: unitsLabel, sub: `${stats.count} graded` },
          ].map(({ label, value, sub }, i) => (
            <div
              key={label}
              className="text-center py-4 px-2"
              style={{ borderRight: i < 2 ? '1px solid #f1f5f9' : 'none' }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: '#94a3b8' }}>{label}</p>
              <p className="text-xl font-black" style={{ color: '#0f172a' }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{sub}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-center px-4 py-2.5" style={{ color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}>
        Graded to the game on each pick&apos;s date · Past results don&apos;t guarantee future performance
      </p>
    </section>
  )
}
