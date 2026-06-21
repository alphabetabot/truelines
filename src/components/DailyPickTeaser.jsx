import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ChevronRight } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { trackDailyPickTeaserClick } from '../lib/analytics'
import { DAILY_NEWSLETTER_PICK_COUNT } from '../lib/pickAccess'

function isPlaceholderBet(bet) {
  return !bet || bet.includes('-10000') || bet.includes('-99999')
}

/** Compact /odds teaser — one pick for everyone; full slate link for Premium only. */
export default function DailyPickTeaser() {
  const [pick, setPick] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isPremium } = useSubscription()

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
      <div className="rounded-xl mb-4 shimmer" style={{ height: 72, border: '1px solid var(--border)' }} />
    )
  }

  if (!pick) {
    return (
      <div
        className="rounded-xl mb-4 px-4 py-3"
        style={{ background: 'var(--odds-bg)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Today&apos;s AI picks</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          No picks published yet today. New picks land every morning (Pacific time).
          {isPremium ? ' Check /picks for the full slate once they drop.' : ' Premium unlocks all 3 daily picks with full write-ups.'}
        </p>
      </div>
    )
  }

  function goToTopPickAnalysis() {
    trackDailyPickTeaserClick('odds')
    navigate('/picks')
  }

  function goToFullSlate() {
    trackDailyPickTeaserClick('odds_premium_slate')
    navigate('/picks#todays-slate')
  }

  return (
    <div
      className="rounded-xl mb-4 overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1.5px solid var(--gold)',
        boxShadow: '0 2px 8px rgba(245,158,11,0.12)',
      }}
    >
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--gold)' }}>
          <Zap size={14} style={{ color: 'var(--text-primary)' }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold" style={{ color: 'var(--gold)' }}>Today&apos;s AI Pick</p>
          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{pick.pick}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{pick.game}</p>
        </div>
      </div>

      <div className="px-4 pb-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={goToTopPickAnalysis}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left font-bold text-sm transition-opacity hover:opacity-90"
          style={{ background: 'var(--odds-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          <span>{isPremium ? 'View top pick analysis' : 'View full analysis'}</span>
          <ChevronRight size={16} />
        </button>

        {isPremium ? (
          <button
            type="button"
            onClick={goToFullSlate}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left font-bold text-sm transition-opacity hover:opacity-90"
            style={{ background: 'var(--gold)', color: 'var(--text-primary)' }}
          >
            <span>All {DAILY_NEWSLETTER_PICK_COUNT} daily picks</span>
            <ChevronRight size={16} />
          </button>
        ) : (
          <p className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
            {user
              ? 'Free account: today\'s top pick with a short summary. Premium unlocks all 3 picks with full write-ups.'
              : 'One pick preview free · Premium unlocks all 3 daily picks with full write-ups.'}
          </p>
        )}
      </div>
    </div>
  )
}
