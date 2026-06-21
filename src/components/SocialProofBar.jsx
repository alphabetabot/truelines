import { Link } from 'react-router-dom'
import { TrendingUp, Shield } from 'lucide-react'
import { usePickPerformance } from '../hooks/usePickPerformance'

export default function SocialProofBar({ compact = false, dark = false }) {
  const { loading, error, wins, losses, winRate, totalUnits, gradedCount, hasRecord } = usePickPerformance()

  const spacing = compact ? 'p-3 mb-0' : 'p-4 mb-6'

  if (loading) {
    return (
      <div
        className={`rounded-xl animate-pulse ${compact ? 'h-14' : 'h-20 mb-6'}`}
        style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'var(--border)' }}
      />
    )
  }

  if (hasRecord && !error) {
    const unitsLabel = `${totalUnits > 0 ? '+' : ''}${totalUnits.toFixed(2)} units`
    return (
      <div
        className={`rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${spacing}`}
        style={
          dark
            ? { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(134,239,172,0.35)' }
            : { background: 'var(--odds-bg-best)', border: '1px solid #bbf7d0' }
        }
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={18} style={{ color: dark ? 'var(--green-live)' : 'var(--green)' }} />
          <div>
            <p className="text-sm font-black" style={{ color: dark ? '#bbf7d0' : '#15803d' }}>
              Vega&apos;s graded record: {wins}-{losses} ({winRate}%)
            </p>
            <p className="text-xs" style={{ color: dark ? 'rgba(187,247,208,0.85)' : '#166534' }}>
              {gradedCount} picks graded · {unitsLabel} · Updated after games settle
            </p>
          </div>
        </div>
        <Link
          to="/odds?tracker=1#pick-tracker"
          className="text-xs font-bold shrink-0"
          style={{ color: dark ? 'var(--green-live)' : '#15803d' }}
        >
          View full tracker →
        </Link>
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl flex items-start gap-3 ${spacing}`}
      style={
        dark
          ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }
          : { background: 'var(--odds-bg)', border: '1px solid var(--border)' }
      }
    >
      <Shield size={18} className="shrink-0 mt-0.5" style={{ color: dark ? 'rgba(255,255,255,0.78)' : 'var(--text-muted)' }} />
      <div>
        <p className="text-sm font-bold" style={{ color: dark ? '#fff' : 'var(--text-primary)' }}>
          Transparent track record
        </p>
        <p className="text-xs leading-relaxed mt-1" style={{ color: dark ? 'rgba(255,255,255,0.82)' : 'var(--text-muted)' }}>
          {error
            ? 'Performance tracker is temporarily unavailable.'
            : 'We grade every newsletter pick after games finish. Record will appear here as results come in — no fabricated stats.'}
        </p>
      </div>
    </div>
  )
}
