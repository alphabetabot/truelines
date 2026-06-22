import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ChevronRight, Star } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

function isPlaceholderBet(bet) {
  return !bet || bet.includes('-10000') || bet.includes('-99999')
}

function formatConfidence(confidence) {
  if (typeof confidence === 'string' && confidence.includes('★')) {
    return confidence
  }
  const stars = Math.min(5, Math.max(1, parseInt(confidence, 10) || 4))
  return '★'.repeat(stars)
}

export default function AIPickTeaser() {
  const [pick, setPick] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    loadTeaserPick()
  }, [])

  async function loadTeaserPick() {
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
          console.warn('Teaser pick fetch failed:', res.status, errMsg || text.slice(0, 200))
        }
        return
      }

      const data = text ? JSON.parse(text) : null
      if (!data?.bet || isPlaceholderBet(data.bet)) return

      setPick({
        game: data.game,
        pick: data.pick,
        confidence: formatConfidence(data.confidence),
        bullets: data.edge ? [data.edge] : [],
        sport: data.sport || 'MLB',
      })
    } catch (e) {
      console.warn('Teaser pick failed:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl p-4 mb-6 shimmer" style={{ height: 120, border: '1px solid var(--border)' }} />
    )
  }

  if (!pick) return null

  return (
    <div className="rounded-2xl overflow-hidden mb-6"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--bg-elevated)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-secondary) 100%)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2">
          <Zap size={14} style={{ color: 'var(--gold)' }} />
          <span className="text-xs font-bold tracking-wider" style={{ color: 'var(--gold)' }}>
            VEGA'S PICK OF THE DAY
          </span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--gold)', border: '1px solid rgba(245,158,11,0.3)' }}>
          {pick.sport}
        </span>
      </div>

      {/* Pick content */}
      <div className="px-4 py-4">
        <p className="text-xs mb-1" style={{ color: 'var(--text-primary)' }}>{pick.game}</p>
        <p className="text-xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>{pick.pick}</p>
        <p className="text-sm mb-3" style={{ color: 'var(--gold)' }}>{pick.confidence}</p>

        {/* Bullet points */}
        {pick.bullets?.length > 0 && (
          <ul className="mb-3 space-y-1">
            {pick.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--gold)', marginTop: 2 }}>•</span>
                {b}
              </li>
            ))}
          </ul>
        )}

        {/* Teaser hook */}
        <p className="text-xs italic" style={{ color: 'var(--text-primary)' }}>
          🔒 Full analysis + line value breakdown available to members
        </p>
      </div>

      {/* CTA */}
      {!user ? (
        <button
          onClick={() => navigate('/login')}
          className="w-full flex items-center justify-center gap-2 py-3 font-bold text-sm transition-all"
          style={{ background: 'var(--gold)', color: 'var(--text-primary)' }}
        >
          <Star size={14} />
          Sign up free to see all picks + full analysis
          <ChevronRight size={14} />
        </button>
      ) : (
        <button
          onClick={() => navigate('/picks')}
          className="w-full flex items-center justify-center gap-2 py-3 font-bold text-sm transition-all"
          style={{ background: 'var(--gold)', color: 'var(--text-primary)' }}
        >
          <Star size={14} />
          View all picks + full analysis
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  )
}
