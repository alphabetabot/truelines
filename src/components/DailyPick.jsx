import { useState, useEffect } from 'react'
import { Zap, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const sportColor = { MLB: '#22c55e', NBA: '#2563eb', NHL: '#6366f1' }

function isPlaceholderBet(bet) {
  return !bet || bet.includes('-10000') || bet.includes('-99999')
}

export default function DailyPick() {
  const [pick, setPick] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()

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
    <div className="rounded-2xl p-5 mb-5 animate-pulse" style={{ background: '#0f172a', height: 140 }} />
  )

  if (!pick) return null

  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ border: '2px solid #f59e0b', background: '#0f172a' }}>
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'rgba(245,158,11,0.15)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#f59e0b' }}>
            <Zap size={12} style={{ color: '#0f172a' }} />
          </div>
          <span className="text-xs font-black" style={{ color: '#f59e0b' }}>
            {user ? "VEGA'S TOP PICK TODAY" : "TODAY'S TOP PICK PREVIEW"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: (sportColor[pick.sport] || '#64748b') + '30', color: sportColor[pick.sport] || '#64748b' }}>
            {pick.sport}
          </span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="px-4 py-4">
        <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{pick.game}</p>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-black text-lg leading-tight" style={{ color: '#fff' }}>{pick.pick}</h3>
          <span className="text-sm flex-shrink-0 tracking-widest" style={{ color: '#f59e0b' }}>
            {typeof pick.confidence === 'string' && pick.confidence.includes('★')
              ? pick.confidence
              : '★'.repeat(Math.min(5, Math.max(1, parseInt(pick.confidence, 10) || 3)))}
          </span>
        </div>
        <p className="text-xs mb-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
          💡 {pick.edge}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
            {pick.bet}
          </span>
          <button
            onClick={() => navigate(user ? '/picks' : '/login')}
            className="flex items-center gap-1 text-xs font-bold"
            style={{ color: '#f59e0b' }}
          >
            {user ? 'See all 3 picks' : 'Sign up for all 3 picks'} <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div className="px-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {user
            ? 'For informational purposes only · Always bet responsibly · 21+'
            : 'Public preview of today\'s #1 pick · Free account unlocks all 3 newsletter picks · 21+'}
        </p>
      </div>
    </div>
  )
}
