import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { trackEvent } from '../lib/analytics'
import { useAuth } from '../lib/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { startPremiumCheckout } from '../lib/billingApi'
import { PREMIUM_PRICE_DISPLAY } from '../lib/pickAccess'

const PREMIUM_FEATURES = [
  'Full AI Picks tab — all 3 daily picks',
  'Unlimited AI analysis on any game',
  'Injury, weather & advanced stats',
  'On-demand pick generation',
]

export default function PremiumTeaser({ showWaitlist = true }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isPremium } = useSubscription()
  const [busy, setBusy] = useState(false)

  async function handlePremiumCta() {
    if (!user) {
      navigate('/login', { state: { from: '/premium' } })
      return
    }
    if (isPremium) {
      navigate('/premium')
      return
    }
    setBusy(true)
    try {
      trackEvent('premium_checkout_start', { source: 'premium_teaser' })
      await startPremiumCheckout()
    } catch {
      navigate('/premium')
      setBusy(false)
    }
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={18} style={{ color: '#f59e0b' }} />
        <h2 className="text-lg font-black" style={{ color: '#0f172a' }}>
          Upgrade to Premium
        </h2>
      </div>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: '#64748b' }}>
        Unlock the full AI Picks and AI Analysis tabs — {PREMIUM_PRICE_DISPLAY}.
      </p>

      <div
        className="rounded-2xl p-4 flex flex-col relative max-w-lg"
        style={{
          background: 'linear-gradient(165deg, #0f172a 0%, #1e293b 100%)',
          border: '2px solid #f59e0b',
          boxShadow: '0 12px 40px rgba(245, 158, 11, 0.18)',
          color: '#fff',
        }}
      >
        <span
          className="absolute -top-2.5 right-4 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md"
          style={{ background: '#f59e0b', color: '#0f172a', letterSpacing: '0.1em' }}
        >
          Recommended
        </span>
        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#fbbf24' }}>
          Premium
        </p>
        <p className="text-xl font-black mb-3" style={{ color: '#fde68a' }}>{PREMIUM_PRICE_DISPLAY}</p>
        <ul className="text-sm space-y-2 mb-4 flex-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {PREMIUM_FEATURES.map(f => (
            <li key={f} className="flex gap-2">
              <span style={{ color: '#f59e0b' }}>✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
        {showWaitlist && (
          <button
            type="button"
            onClick={handlePremiumCta}
            disabled={busy}
            className="w-full py-2.5 rounded-xl text-sm font-extrabold"
            style={{ background: '#f59e0b', color: '#0f172a' }}
          >
            {busy ? 'Redirecting…' : isPremium ? 'Manage Premium' : `Subscribe — ${PREMIUM_PRICE_DISPLAY}`}
          </button>
        )}
        {!showWaitlist && isPremium && (
          <p className="text-xs font-bold text-center py-2" style={{ color: '#4ade80' }}>Your plan is active</p>
        )}
      </div>
    </section>
  )
}
