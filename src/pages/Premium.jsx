import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import SocialProofBar from '../components/SocialProofBar'
import { useAuth } from '../lib/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { openBillingPortal, startPremiumCheckout, syncCheckoutSession } from '../lib/billingApi'
import { PREMIUM_PRICE_DISPLAY } from '../lib/pickAccess'
import { trackEvent } from '../lib/analytics'

const PREMIUM_FEATURES = [
  {
    title: 'Full AI Picks tab',
    detail: 'All 3 daily picks with full write-ups, confidence scores, and on-demand generation.',
  },
  {
    title: 'Unlimited AI analysis',
    detail: 'Deep research on any game — injuries, weather, park factors, and advanced stats.',
  },
  {
    title: 'Vega + ChatGPT research',
    detail: 'No caps on AI breakdowns. Run as many reports as you need each slate.',
  },
]

export default function Premium() {
  const { user, loading: authLoading } = useAuth()
  const { isPremium, loading: subLoading, refresh, currentPeriodEnd, cancelAtPeriodEnd } = useSubscription()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const checkout = searchParams.get('checkout')
    const sessionId = searchParams.get('session_id')
    if (checkout !== 'success' || !sessionId || !user) return

    let cancelled = false
    async function completeCheckout() {
      setBusy(true)
      setMessage('Activating your Premium subscription…')
      try {
        await syncCheckoutSession(sessionId)
        if (!cancelled) {
          await refresh()
          setMessage('Premium is active. AI Picks and AI Analysis are unlocked.')
          trackEvent('premium_checkout_success')
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not confirm checkout')
      } finally {
        if (!cancelled) setBusy(false)
        setSearchParams({}, { replace: true })
      }
    }

    completeCheckout()
    return () => { cancelled = true }
  }, [searchParams, setSearchParams, user, refresh])

  useEffect(() => {
    if (searchParams.get('checkout') === 'cancelled') {
      setMessage('Checkout cancelled — no charge was made.')
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  async function handleSubscribe() {
    if (!user) {
      navigate('/login', { state: { from: '/premium' } })
      return
    }
    setBusy(true)
    setError('')
    try {
      trackEvent('premium_checkout_start')
      await startPremiumCheckout()
    } catch (err) {
      setError(err.message || 'Could not start checkout')
      setBusy(false)
    }
  }

  async function handleManageBilling() {
    setBusy(true)
    setError('')
    try {
      await openBillingPortal()
    } catch (err) {
      setError(err.message || 'Could not open billing portal')
      setBusy(false)
    }
  }

  const periodEndLabel = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <header
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, #0a0f1a 0%, #0f172a 45%, #1a2332 100%)',
          color: '#fff',
          margin: '0 -1rem',
          padding: '40px 1.5rem 48px',
        }}
      >
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} style={{ color: '#f59e0b' }} />
            <p className="text-xs font-bold uppercase" style={{ color: '#f59e0b', letterSpacing: '0.2em' }}>
              TrueOddsIQ Premium
            </p>
            {isPremium && (
              <span
                className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md"
                style={{ background: '#22c55e', color: '#0f172a', letterSpacing: '0.08em' }}
              >
                Active
              </span>
            )}
          </div>

          <h1
            className="font-black leading-tight mb-3"
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
            }}
          >
            Unlock AI Picks
            <em
              className="block not-italic"
              style={{ color: '#fbbf24', fontWeight: 500, fontStyle: 'italic', fontSize: '0.9em', marginTop: 4 }}
            >
              and unlimited analysis.
            </em>
          </h1>

          <p className="mb-6" style={{ fontSize: 18, color: 'rgba(255,255,255,0.92)', maxWidth: 520 }}>
            Full daily card, deep matchup reports, and uncapped Vega research —{' '}
            <strong style={{ color: '#fde68a' }}>{PREMIUM_PRICE_DISPLAY}</strong>.
          </p>

          <SocialProofBar compact dark />

          {message && (
            <div
              className="rounded-xl p-3 mt-5 text-sm"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(147,197,253,0.35)', color: '#bfdbfe' }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              className="rounded-xl p-3 mt-5 text-sm"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(252,165,165,0.35)', color: '#fecaca' }}
            >
              {error}
            </div>
          )}

          {isPremium && (
            <div
              className="rounded-xl p-4 mt-5 text-sm"
              style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(134,239,172,0.35)', color: '#bbf7d0' }}
            >
              <strong>Premium active.</strong>
              {periodEndLabel && (
                <span>
                  {' '}Renews {cancelAtPeriodEnd ? 'until' : 'on'} {periodEndLabel}
                  {cancelAtPeriodEnd ? ' (cancels at period end)' : ''}.
                </span>
              )}
              {' '}Open <Link to="/picks" style={{ color: '#4ade80', fontWeight: 600 }}>AI Picks</Link>
              {' '}or <Link to="/analysis" style={{ color: '#4ade80', fontWeight: 600 }}>AI Analysis</Link>.
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-6">
            {isPremium ? (
              <button
                type="button"
                onClick={handleManageBilling}
                disabled={busy || subLoading}
                className="px-6 py-3.5 rounded-xl text-sm font-bold"
                style={{ background: '#f59e0b', color: '#0f172a' }}
              >
                {busy ? 'Opening…' : 'Manage billing'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={busy || authLoading || subLoading}
                className="px-7 py-3.5 rounded-xl text-sm font-extrabold"
                style={{ background: '#f59e0b', color: '#0f172a' }}
              >
                {busy ? 'Redirecting…' : `Subscribe — ${PREMIUM_PRICE_DISPLAY}`}
              </button>
            )}
            <Link
              to={isPremium ? '/picks' : '/login'}
              state={!user ? { from: '/premium' } : undefined}
              className="px-6 py-3.5 rounded-xl text-sm font-semibold inline-flex items-center"
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              {!user ? 'Sign in first' : isPremium ? 'Go to AI Picks' : 'Preview locked tabs'}
            </Link>
          </div>

          {!authLoading && !user && (
            <p className="mt-4" style={{ fontSize: 16, color: 'rgba(255,255,255,0.82)' }}>
              Sign in to subscribe. Free accounts keep odds, newsletter, and the public tracker.
            </p>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto py-8">
        <section
          className="rounded-2xl p-5 mb-6 relative"
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
            What you get
          </span>
          <h2
            className="font-black text-xl mb-4"
            style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#fbbf24' }}
          >
            Premium includes
          </h2>
          {PREMIUM_FEATURES.map(f => (
            <div
              key={f.title}
              className="rounded-xl p-3.5 mb-2.5 last:mb-0"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245, 158, 11, 0.35)' }}
            >
              <strong className="block font-bold text-white mb-1" style={{ fontSize: 19 }}>{f.title}</strong>
              <span className="italic leading-relaxed" style={{ fontSize: 18, color: '#e2e8f0' }}>
                {f.detail}
              </span>
            </div>
          ))}
            <p className="mt-4 leading-relaxed" style={{ fontSize: 16, color: 'rgba(255,255,255,0.82)' }}>
            Odds, newsletter, and the public tracker stay free. Cancel Premium anytime from billing settings.
          </p>
        </section>

        <p className="text-center text-sm mt-8">
          <Link to="/welcome" style={{ color: '#2563eb', fontWeight: 600 }}>← Back to welcome</Link>
          {' · '}
          <Link to="/odds" style={{ color: '#2563eb', fontWeight: 600 }}>Live odds</Link>
        </p>
      </div>
    </div>
  )
}
