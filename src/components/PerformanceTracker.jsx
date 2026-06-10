import { useState, useEffect } from 'react'
import { TrendingUp, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { usePickPerformanceData } from '../hooks/usePickPerformanceData'
import { aggregatePickPerformance } from '../lib/pickPerformance'

const sportColor = { MLB: '#22c55e', NBA: '#2563eb', NHL: '#6366f1' }

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatOdds(odds) {
  if (odds == null || odds === '') return ''
  const n = typeof odds === 'number' ? odds : parseInt(odds, 10)
  if (Number.isNaN(n)) return ''
  return n > 0 ? `+${n}` : `${n}`
}

function PerformanceTrackerBody({
  defaultExpanded = false,
  trackerAnchor = false,
  onEngage,
  picks,
  loading,
  error,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [defaultExpanded])

  const picksWithResults = picks.filter(p => p.result && p.result !== '')
  const season = aggregatePickPerformance(picksWithResults)
  const wins = season.wins
  const losses = season.losses
  const totalUnits = season.totalUnits
  const winRate = season.decided > 0 ? `${season.winRate}%` : '—'
  const isNew = !loading && !error && picksWithResults.length === 0
  const latestDate = picksWithResults[0]?.date
  const unavailable = !loading && error

  return (
    <div
      id={trackerAnchor ? 'pick-tracker' : undefined}
      className="rounded-2xl overflow-hidden mb-6"
      style={{ background: '#fff', border: '1px solid #e2e8f0' }}
    >

      <button
        type="button"
        onClick={() => {
          const next = !expanded
          setExpanded(next)
          if (next && onEngage) onEngage()
        }}
        className="w-full text-left"
        style={{ background: '#0f172a' }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} style={{ color: '#f59e0b' }} />
            <span className="text-sm font-black text-white">Vega&apos;s Pick Performance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{
                background: unavailable ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                color: unavailable ? '#f87171' : '#22c55e',
                border: `1px solid ${unavailable ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
              }}>
              {unavailable ? 'Unavailable' : '● Tracked'}
            </span>
            {expanded
              ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.78)' }} />
              : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.78)' }} />
            }
          </div>
        </div>

        <div className="grid grid-cols-3 gap-0 px-4 pb-3">
          {[
            { label: 'Record', record: unavailable || isNew ? '—' : season.pushes > 0 ? `${wins}-${losses}-${season.pushes}` : `${wins}-${losses}`, units: unavailable ? 'Check back soon' : isNew ? 'Tracking live' : `${totalUnits > 0 ? '+' : ''}${totalUnits.toFixed(2)}u` },
            { label: 'Win Rate', record: unavailable || isNew ? '—' : winRate, units: unavailable ? '—' : isNew ? 'Results after games' : `${picksWithResults.length} graded` },
            { label: 'Last Graded', record: unavailable ? '—' : formatDate(latestDate), units: unavailable ? '—' : 'Auto-graded daily' },
          ].map(({ label, record, units }, i) => (
            <div key={label} className="text-center" style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
              <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
              <p className="text-base font-black text-white">{record}</p>
              <p className="text-xs font-semibold" style={{ color: '#64748b' }}>{units}</p>
            </div>
          ))}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pt-3 pb-3">
          {loading ? (
            <p className="text-xs text-center py-4" style={{ color: '#64748b' }}>Loading results…</p>
          ) : unavailable ? (
            <div className="flex items-start gap-3 py-4">
              <AlertTriangle size={18} style={{ color: '#dc2626' }} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#0f172a' }}>Tracker temporarily unavailable</p>
                <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{error}</p>
              </div>
            </div>
          ) : isNew ? (
            <div className="text-center py-4">
              <p className="text-sm font-semibold mb-1" style={{ color: '#0f172a' }}>No graded picks yet</p>
              <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>
                Vega sends daily picks in the morning. Results appear here after games finish and the grading job runs.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {picksWithResults.map((pick) => (
                <div key={pick.id || `${pick.date}-${pick.pick}`} className="flex items-center justify-between py-1.5"
                  style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0"
                      style={{ background: sportColor[pick.sport] + '20', color: sportColor[pick.sport] }}>
                      {pick.sport}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: '#0f172a' }}>{pick.pick}</p>
                      <p className="text-xs truncate" style={{ color: '#64748b' }}>
                        {formatDate(pick.date)} · {pick.game}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {formatOdds(pick.displayOdds ?? pick.odds) && (
                      <span className="text-xs" style={{ color: '#64748b' }}>
                        {formatOdds(pick.displayOdds ?? pick.odds)}
                      </span>
                    )}
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: pick.result === 'W' ? '#dcfce7' : '#fef2f2',
                        color: pick.result === 'W' ? '#16a34a' : '#dc2626',
                      }}>
                      {pick.result} {(pick.units > 0 ? '+' : '')}{(parseFloat(pick.units) || 0).toFixed(2)}u
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-center mt-3" style={{ color: '#64748b' }}>
            Results matched to the game on each pick&apos;s date · Re-verified after every scores cron · Past results don&apos;t guarantee future performance
          </p>
        </div>
      )}
    </div>
  )
}

function PerformanceTrackerWithFetch(props) {
  const data = usePickPerformanceData()
  return (
    <PerformanceTrackerBody
      {...props}
      picks={data.picks}
      loading={data.loading}
      error={data.error}
    />
  )
}

export default function PerformanceTracker(props) {
  if (props.picks !== undefined) {
    return (
      <PerformanceTrackerBody
        {...props}
        picks={props.picks}
        loading={props.loading}
        error={props.error}
      />
    )
  }
  return <PerformanceTrackerWithFetch {...props} />
}
