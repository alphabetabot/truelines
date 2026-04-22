// Performance tracker — updated manually as picks are tracked
// Once we have real data, this becomes dynamic

const RECENT_PICKS = [
  // Format: { date, sport, game, pick, result, odds, units }
  // Will be populated as picks come in
  // Example entries shown for structure:
]

const STATS = {
  last7: { record: '—', units: '—', roi: '—' },
  last30: { record: '—', units: '—', roi: '—' },
  allTime: { record: '—', units: '—', roi: '—' },
  startDate: 'April 2026',
}

export default function PerformanceTracker() {
  const isNew = RECENT_PICKS.length === 0

  return (
    <div className="rounded-2xl overflow-hidden mb-6" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
        <div>
          <span className="text-sm font-black text-white">📊 Vega's Pick Performance</span>
          <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Tracking since {STATS.startDate}
          </span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
          Live
        </span>
      </div>

      {isNew ? (
        <div className="px-4 py-5 text-center">
          <p className="text-sm font-semibold mb-1" style={{ color: '#0f172a' }}>Track record starting now</p>
          <p className="text-xs" style={{ color: '#64748b' }}>
            We launched in April 2026. Every AI pick is logged and tracked here in real time.
            Check back daily as we build our verified record.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            {[
              { label: 'Picks Made', value: '0' },
              { label: 'Win Rate', value: '—' },
              { label: 'Units', value: '—' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-black" style={{ color: '#0f172a' }}>{value}</p>
                <p className="text-xs" style={{ color: '#94a3b8' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Last 7 Days', ...STATS.last7 },
              { label: 'Last 30 Days', ...STATS.last30 },
              { label: 'All Time', ...STATS.allTime },
            ].map(({ label, record, units, roi }) => (
              <div key={label} className="text-center p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#64748b' }}>{label}</p>
                <p className="text-base font-black" style={{ color: '#0f172a' }}>{record}</p>
                <p className="text-xs" style={{ color: units.startsWith('+') ? '#16a34a' : units.startsWith('-') ? '#dc2626' : '#94a3b8' }}>
                  {units} units
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pb-3">
        <p className="text-xs text-center" style={{ color: '#94a3b8' }}>
          All picks tracked from day of publication · Past results do not guarantee future performance
        </p>
      </div>
    </div>
  )
}
