import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, ChevronRight } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import PickPerformanceHero from '../components/PickPerformanceHero'
import { usePickPerformanceData } from '../hooks/usePickPerformanceData'
import { FREE_DAILY_PICK_COUNT } from '../lib/pickAccess'

function StoredPickCard({ pick }) {
  const meta = pick?.pick_meta || pick?.pickMeta || {}
  return (
    <div className="rounded-xl overflow-hidden mb-4" style={{ border: '2px solid var(--gold)', background: 'var(--bg-card)' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(245,158,11,0.12)' }}>
        <span className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--gold)' }}>Today&apos;s Free Pick</span>
        {pick.edge_score != null && (
          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Edge {pick.edge_score}</span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{pick.game}</p>
        <p className="text-lg font-black mb-2" style={{ color: 'var(--text-primary)' }}>{pick.pick}</p>
        {pick.bet && <p className="text-sm font-semibold mb-3" style={{ color: 'var(--gold)' }}>{pick.bet}</p>}
        {pick.edge && <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{pick.edge}</p>}
        {meta.key_reasons?.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {meta.key_reasons.slice(0, 3).map((r, i) => <li key={i}>• {r}</li>)}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function FreePicks() {
  const [pick, setPick] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isPremium } = useSubscription()
  const performance = usePickPerformanceData()

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/todays-pick')
        if (!res.ok) throw new Error('No free pick published yet today')
        const data = await res.json()
        if (!cancelled) setPick(data)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={20} style={{ color: 'var(--gold)' }} />
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Free Picks</h1>
      </div>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Up to {FREE_DAILY_PICK_COUNT} official AI pick daily when it clears our edge standards.
        We email you when it&apos;s live — the full analysis stays on the site.
      </p>

      <PickPerformanceHero picks={performance.picks} loading={performance.loading} error={performance.error} />

      {loading && <p style={{ color: 'var(--text-muted)' }}>Loading today&apos;s pick…</p>}
      {!loading && error && (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No free pick yet today</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            When a game meets our expected-value bar, we publish here and send a pick alert — never the play in email.
          </p>
        </div>
      )}
      {!loading && pick && <StoredPickCard pick={pick} />}

      {!isPremium && (
        <div className="rounded-xl p-4 mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold)' }}>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Premium unlocks up to 3 daily picks, each released with its own alert when ready.
          </p>
          <button type="button" onClick={() => navigate(user ? '/premium' : '/login', user ? undefined : { state: { from: '/premium' } })}
            className="px-4 py-2 rounded-lg text-sm font-bold shrink-0"
            style={{ background: 'var(--gold)', color: 'var(--text-primary)' }}>
            {user ? 'Upgrade' : 'Sign in'}
          </button>
        </div>
      )}

      {isPremium && (
        <Link to="/picks" className="inline-flex items-center gap-1 text-sm font-bold mt-4" style={{ color: 'var(--gold)' }}>
          View all premium picks <ChevronRight size={14} />
        </Link>
      )}
    </div>
  )
}
