import { useState, useEffect } from 'react'
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'

const sportColor = { MLB: '#22c55e', NBA: '#2563eb', NHL: '#6366f1' }

function formatOdds(odds) {
  if (odds == null || odds === '') return ''
  const n = typeof odds === 'number' ? odds : parseInt(odds, 10)
  if (Number.isNaN(n)) return ''
  return n > 0 ? `+${n}` : `${n}`
}

export default function PerformanceTracker() {
  const [expanded, setExpanded] = useState(false)
  const [picks, setPicks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPicks() {
      try {
        const res = await fetch('/api/performance-picks')
        if (res.ok) {
          const data = await res.json()
          setPicks(data)
        }
      } catch (err) {
        console.error('Failed to fetch picks:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPicks()
  }, [])

  const picksWithResults = picks.filter(p => p.result && p.result !== '')
  const wins = picksWithResults.filter(p => p.result === 'W').length
  const losses = picksWithResults.filter(p => p.result === 'L').length
  const totalUnits = picksWithResults.reduce((s, p) => s + (parseFloat(p.units) || 0), 0)
  const winRate = picksWithResults.length > 0 ? Math.round((wins / picksWithResults.length) * 100) + '%' : '—'
  const isNew = !loading && picksWithResults.length === 0

  return (
    <div className="rounded-2xl overflow-hidden mb-6" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
        style={{ background: '#0f172a' }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} style={{ color: '#f59e0b' }} />
            <span className="text-sm font-black text-white">Vega's Pick Performance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
              ● Live
            </span>
            {expanded
              ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
              : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
            }
          </div>
        </div>

        <div className="grid grid-cols-3 gap-0 px-4 pb-3">
          {[
            { label: 'Record', record: isNew ? '—' : `${wins}-${losses}`, units: isNew ? 'Tracking live' : `${totalUnits > 0 ? '+' : ''}${totalUnits.toFixed(2)}u` },
            { label: 'Win Rate', record: winRate, units: isNew ? 'Results after games' : `${picksWithResults.length} graded` },
            { label: 'Status', record: '3/day', units: 'Picks daily' },
          ].map(({ label, record, units }, i) => (
            <div key={label} className="text-center" style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
              <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
              <p className="text-base font-black text-white">{record}</p>
              <p className="text-xs font-semibold" style={{ color: '#94a3b8' }}>{units}</p>
            </div>
          ))}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pt-3 pb-3">
          {loading ? (
            <p className="text-xs text-center py-4" style={{ color: '#94a3b8' }}>Loading results…</p>
          ) : isNew ? (
            <div className="text-center py-4">
              <p className="text-sm font-semibold mb-1" style={{ color: '#0f172a' }}>No graded picks yet</p>
              <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                Vega sends 3 picks every morning. Results appear here after games finish and are graded automatically.
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
                      <p className="text-xs truncate" style={{ color: '#94a3b8' }}>{pick.game}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {formatOdds(pick.displayOdds ?? pick.odds) && (
                      <span className="text-xs" style={{ color: '#94a3b8' }}>
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
          <p className="text-xs text-center mt-3" style={{ color: '#94a3b8' }}>
            All picks tracked from publication date · Past results don't guarantee future performance
          </p>
        </div>
      )}
    </div>
  )
}
