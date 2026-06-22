import { useState, useEffect } from 'react'
import { Zap, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSubscription } from '../hooks/useSubscription'
import { briefEdgeSummary } from '../lib/pickText'

const sportColor = { MLB: 'var(--green)', NBA: 'var(--accent)', NHL: '#6366f1' }

function isPlaceholderBet(bet) {
  return !bet || bet.includes('-10000') || bet.includes('-99999')
}

export default function DailyPick() {
  const [pick, setPick] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { isPremium } = useSubscription()

  useEffect(() => {
    async function fetchPick() {
      try {
        const res = await fetch('/api/todays-pick')
        const text = await res.text()

        if (!res.ok) {
          let errMsg = ''
          try {
            const body = text ? JSON.parse(text) : null
            errMsg = body?.error || ''
          } catch {
            // Response body may not be JSON
          }
          if (errMsg || text) {
            console.warn('Daily pick fetch failed:', res.status, errMsg || text.slice(0, 200))
          }
          return
        }

        const data = text ? JSON.parse(text) : null
        if (data?.bet && !isPlaceholderBet(data.bet)) {
          setPick(data)
        }
      } catch (e) {
        console.warn('Daily pick failed:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchPick()
  }, [])

  if (loading) return (
    <div className="rounded-2xl p-5 mb-5 animate-pulse" style={{ background: 'var(--bg-secondary)', height: 140 }} />
  )

  if (!pick) return null

  const edgeDisplay = isPremium ? pick.edge : briefEdgeSummary(pick.edge)

  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ border: '2px solid var(--gold)', background: 'var(--bg-secondary)' }}>
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'rgba(245,158,11,0.15)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--gold)' }}>
            <Zap size={12} style={{ color: 'var(--text-primary)' }} />
          </div>
          <span className="text-xs font-black" style={{ color: 'var(--gold)' }}>
            {isPremium ? "VEGA'S TOP PICK TODAY" : "TODAY'S TOP PICK PREVIEW"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: (sportColor[pick.sport] || 'var(--text-muted)') + '30', color: sportColor[pick.sport] || 'var(--text-muted)' }}>
            {pick.sport}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="px-4 py-4">
        <p className="text-xs mb-2" style={{ color: 'var(--text-primary)' }}>{pick.game}</p>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-black text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>{pick.pick}</h3>
          <span className="text-sm flex-shrink-0 tracking-widest" style={{ color: 'var(--gold)' }}>
            {typeof pick.confidence === 'string' && pick.confidence.includes('★')
              ? pick.confidence
              : '★'.repeat(Math.min(5, Math.max(1, parseInt(pick.confidence, 10) || 3)))}
          </span>
        </div>
        {edgeDisplay && (
          <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            💡 {edgeDisplay}
          </p>
        )}
        {!isPremium && pick.edge && edgeDisplay !== pick.edge && (
          <p className="text-xs mb-3" style={{ color: 'rgba(245,158,11,0.85)' }}>
            Premium unlocks full write-ups for all 3 picks plus injury, weather &amp; stat deep dives
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)' }}>
            {pick.bet}
          </span>
          <button
            onClick={() => navigate('/premium')}
            className="flex items-center gap-1 text-xs font-bold"
            style={{ color: 'var(--gold)' }}
          >
            {isPremium ? 'View all picks' : 'Unlock all 3 picks'} <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div className="px-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
          {isPremium
            ? 'For informational purposes only · Always bet responsibly · 21+'
            : 'Public preview — brief edge only · Premium = full card · 21+'}
        </p>
      </div>
    </div>
  )
}
