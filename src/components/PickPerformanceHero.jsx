import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, AlertTriangle } from 'lucide-react'
import {
  PERFORMANCE_PERIODS,
  TRACK_RECORD_ERA_LABEL,
  ODDS_BUCKET_LABELS,
  filterPicksByPeriod,
  aggregatePickPerformance,
} from '../lib/pickPerformance'
import { trackPickPerformanceView } from '../lib/analytics'

export default function PickPerformanceHero({ picks = [], loading = false, error = null }) {
  const [period, setPeriod] = useState('since_july')

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

  const avgOddsLabel = stats.avgOdds == null
    ? '—'
    : stats.avgOdds > 0
      ? `+${stats.avgOdds}`
      : `${stats.avgOdds}`

  const juiceNote = stats.avgOdds != null && stats.avgOdds < -115 && stats.winRate != null
    ? `Avg price ${avgOddsLabel} needs ~${Math.round((Math.abs(stats.avgOdds) / (Math.abs(stats.avgOdds) + 100)) * 100)}% to break even on units`
    : null

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
            { label: 'Units', value: unitsLabel, sub: stats.roi != null ? `${stats.roi > 0 ? '+' : ''}${stats.roi}% ROI` : `${stats.count} graded` },
            { label: 'Avg price', value: avgOddsLabel, sub: stats.avgEdge != null ? `Avg edge +${stats.avgEdge}%` : 'Listed bet odds' },
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
        {TRACK_RECORD_ERA_LABEL} uses juice-aware BET-only filters · Graded to each pick&apos;s game date
        {juiceNote ? ` · ${juiceNote}` : ''}
        {' · '}Past results don&apos;t guarantee future performance
      </p>
      {stats.byOddsBucket && Object.keys(stats.byOddsBucket).length > 1 && (
        <div className="px-4 pb-3 grid gap-2 sm:grid-cols-2">
          {Object.entries(stats.byOddsBucket).map(([key, bucket]) => (
            <div key={key} className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--bg-secondary)' }}>
              <p className="font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{ODDS_BUCKET_LABELS[key] || key}</p>
              <p style={{ color: 'var(--text-muted)' }}>
                {bucket.wins}-{bucket.losses}
                {bucket.winRate != null ? ` (${bucket.winRate}%)` : ''}
                {' · '}
                {bucket.totalUnits > 0 ? '+' : ''}{bucket.totalUnits.toFixed(2)}u
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
