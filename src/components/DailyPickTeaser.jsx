import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ChevronRight } from 'lucide-react'
import { trackDailyPickTeaserClick } from '../lib/analytics'

function isPlaceholderBet(bet) {
  return !bet || bet.includes('-10000') || bet.includes('-99999')
}

/** Compact /odds teaser — full pick lives on /picks. */
export default function DailyPickTeaser() {
  const [pick, setPick] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/todays-pick')
        const text = await res.text()
        if (!res.ok || cancelled) return
        const data = text ? JSON.parse(text) : null
        if (data?.bet && !isPlaceholderBet(data.bet) && !cancelled) {
          setPick(data)
        }
      } catch {
        // optional teaser
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl mb-4 shimmer" style={{ height: 72, border: '1px solid #e2e8f0' }} />
    )
  }

  if (!pick) return null

  function goToPicks() {
    trackDailyPickTeaserClick('odds')
    navigate('/picks')
  }

  return (
    <button
      type="button"
      onClick={goToPicks}
      className="w-full text-left rounded-xl mb-4 overflow-hidden transition-opacity hover:opacity-95"
      style={{
        background: '#fff',
        border: '1.5px solid #f59e0b',
        boxShadow: '0 2px 8px rgba(245,158,11,0.12)',
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#f59e0b' }}>
            <Zap size={14} style={{ color: '#0f172a' }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold" style={{ color: '#f59e0b' }}>Today&apos;s AI Pick</p>
            <p className="text-sm font-bold truncate" style={{ color: '#0f172a' }}>{pick.pick}</p>
            <p className="text-xs truncate" style={{ color: '#475569' }}>{pick.game}</p>
          </div>
        </div>
        <span className="flex items-center gap-0.5 text-xs font-bold shrink-0" style={{ color: '#0f172a' }}>
          View full analysis
          <ChevronRight size={14} />
        </span>
      </div>
    </button>
  )
}
