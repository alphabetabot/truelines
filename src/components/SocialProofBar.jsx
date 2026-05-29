import { Link } from 'react-router-dom'
import { TrendingUp, Shield } from 'lucide-react'
import { usePickPerformance } from '../hooks/usePickPerformance'

export default function SocialProofBar({ compact = false }) {
  const { loading, error, wins, losses, winRate, totalUnits, gradedCount, hasRecord } = usePickPerformance()

  if (loading) {
    return (
      <div
        className={`rounded-xl animate-pulse ${compact ? 'h-14 mb-4' : 'h-20 mb-6'}`}
        style={{ background: '#e2e8f0' }}
      />
    )
  }

  if (hasRecord && !error) {
    const unitsLabel = `${totalUnits > 0 ? '+' : ''}${totalUnits.toFixed(2)} units`
    return (
      <div
        className={`rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${compact ? 'p-3 mb-4' : 'p-4 mb-6'}`}
        style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={18} style={{ color: '#16a34a' }} />
          <div>
            <p className="text-sm font-black" style={{ color: '#15803d' }}>
              Vega&apos;s graded record: {wins}-{losses} ({winRate}%)
            </p>
            <p className="text-xs" style={{ color: '#166534' }}>
              {gradedCount} picks graded · {unitsLabel} · Updated after games settle
            </p>
          </div>
        </div>
        <Link
          to="/odds?tracker=1#pick-tracker"
          className="text-xs font-bold shrink-0"
          style={{ color: '#15803d' }}
        >
          View full tracker →
        </Link>
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl flex items-start gap-3 ${compact ? 'p-3 mb-4' : 'p-4 mb-6'}`}
      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
    >
      <Shield size={18} className="shrink-0 mt-0.5" style={{ color: '#64748b' }} />
      <div>
        <p className="text-sm font-bold" style={{ color: '#0f172a' }}>
          Transparent track record
        </p>
        <p className="text-xs leading-relaxed mt-1" style={{ color: '#64748b' }}>
          {error
            ? 'Performance tracker is temporarily unavailable.'
            : 'We grade every newsletter pick after games finish. Record will appear here as results come in — no fabricated stats.'}
        </p>
      </div>
    </div>
  )
}
