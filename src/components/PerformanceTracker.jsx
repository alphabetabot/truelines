import { useState } from 'react'
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'

// Real picks tracked from April 23, 2026 — updated daily as results come in
const RECENT_PICKS = [
  { date: 'Apr 24', sport: 'NBA', game: 'Thunder vs Suns', pick: 'OKC -470', result: 'W', odds: -470, units: +0.21 },
  { date: 'Apr 24', sport: 'MLB', game: 'Red Sox vs Orioles', pick: 'Boston -1.5', result: 'W', odds: -125, units: +0.80 },
  { date: 'Apr 24', sport: 'NBA', game: 'Spurs vs Blazers', pick: 'San Antonio -142', result: 'W', odds: -142, units: +0.70 },
  { date: 'Apr 25', sport: 'NBA', game: 'Celtics vs 76ers', pick: 'Boston -290', result: 'W', odds: -290, units: +0.34 },
  { date: 'Apr 25', sport: 'MLB', game: 'Yankees vs Astros', pick: 'NY -1.5 RL', result: 'W', odds: +115, units: +1.15 },
  { date: 'Apr 25', sport: 'NBA', game: 'Spurs vs Blazers', pick: 'San Antonio -218', result: 'W', odds: -218, units: +0.46 },
  { date: 'Apr 26', sport: 'NBA', game: 'Thunder vs Suns', pick: 'OKC -500', result: 'W', odds: -500, units: +0.20 },
  { date: 'Apr 26', sport: 'NHL', game: 'Wild vs Stars', pick: 'Minnesota +114', result: 'W', odds: +114, units: +1.14 },
  { date: 'Apr 26', sport: 'MLB', game: 'Red Sox vs Blue Jays', pick: 'Under 8.5', result: 'W', odds: -110, units: +0.91 },
  { date: 'Apr 27', sport: 'NBA', game: 'Celtics vs 76ers', pick: 'Boston -550', result: 'W', odds: -550, units: +0.18 },
  { date: 'Apr 27', sport: 'MLB', game: 'Astros vs Orioles', pick: 'Houston ML', result: 'W', odds: -145, units: +0.69 },
  { date: 'Apr 27', sport: 'NBA', game: 'Blazers vs Spurs', pick: 'Portland +440', result: 'L', odds: +440, units: -1.00 },
]

const sportColor = { MLB: '#22c55e', NBA: '#2563eb', NHL: '#6366f1' }

export default function PerformanceTracker() {
  const [expanded, setExpanded] = useState(false)

  const wins = RECENT_PICKS.filter(p => p.result === 'W').length
  const losses = RECENT_PICKS.filter(p => p.result === 'L').length
  const totalUnits = RECENT_PICKS.reduce((s, p) => s + p.units, 0)
  const winRate = RECENT_PICKS.length > 0 ? Math.round((wins / RECENT_PICKS.length) * 100) + '%' : '—'
  const isNew = RECENT_PICKS.length === 0

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

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-0 px-4 pb-3">
          {[
            { label: 'Record', record: isNew ? '—' : `${wins}-${losses}`, units: isNew ? 'Tracking live' : `${totalUnits > 0 ? '+' : ''}${totalUnits.toFixed(1)}u` },
            { label: 'Win Rate', record: winRate, units: isNew ? 'Since Apr 23' : `${RECENT_PICKS.length} picks` },
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
          {isNew ? (
            <div className="text-center py-4">
              <p className="text-sm font-semibold mb-1" style={{ color: '#0f172a' }}>Tracking starts today</p>
              <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                Vega sends 3 picks every morning. Results are logged here daily after games complete. No fake records — just real results from day one.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {RECENT_PICKS.map((pick, i) => (
                <div key={i} className="flex items-center justify-between py-1.5"
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
                    <span className="text-xs" style={{ color: '#94a3b8' }}>{pick.odds > 0 ? '+' : ''}{pick.odds}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: pick.result === 'W' ? '#dcfce7' : '#fef2f2',
                        color: pick.result === 'W' ? '#16a34a' : '#dc2626'
                      }}>
                      {pick.result} {pick.units > 0 ? '+' : ''}{pick.units.toFixed(2)}u
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
