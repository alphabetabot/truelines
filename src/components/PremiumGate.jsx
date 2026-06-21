import { Link } from 'react-router-dom'
import { Lock, Sparkles } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { startPremiumCheckout } from '../lib/billingApi'
import { PREMIUM_PRICE_DISPLAY } from '../lib/pickAccess'
import { useState } from 'react'

export default function PremiumGate({
  children,
  title = 'Premium feature',
  description = 'AI Picks and AI Analysis are included with a Premium subscription.',
}) {
  const { user, loading: authLoading } = useAuth()
  const { isPremium, loading: subLoading } = useSubscription()
  const [busy, setBusy] = useState(false)

  if (authLoading || subLoading) {
    return (
      <div className="text-center py-16">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    )
  }

  if (isPremium) return children

  async function handleSubscribe() {
    if (!user) return
    setBusy(true)
    try {
      await startPremiumCheckout()
    } catch {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto py-10 px-4 text-center">
      <div
        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
        style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)' }}
      >
        <Lock size={24} style={{ color: 'var(--gold)' }} />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>
        Premium subscribers only
      </p>
      <h1 className="text-2xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>{title}</h1>
      <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
        {description}
      </p>
      <p className="text-sm font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        {PREMIUM_PRICE_DISPLAY} · full daily picks + unlimited AI research
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {!user ? (
          <Link
            to="/login"
            state={{ from: window.location.pathname }}
            className="px-6 py-3 rounded-xl text-sm font-bold"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          >
            Sign in to subscribe
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={busy}
            className="px-6 py-3 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2"
            style={{ background: 'var(--gold)', color: 'var(--text-primary)' }}
          >
            <Sparkles size={15} />
            {busy ? 'Redirecting…' : `Subscribe — ${PREMIUM_PRICE_DISPLAY}`}
          </button>
        )}
        <Link
          to="/premium"
          className="px-6 py-3 rounded-xl text-sm font-bold"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        >
          See what&apos;s included
        </Link>
      </div>

      <p className="text-xs mt-8" style={{ color: 'var(--text-muted)' }}>
        Free account still includes live odds, line compare, newsletter email, and the public tracker.
      </p>
    </div>
  )
}
