import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PremiumTeaser from '../components/PremiumTeaser'
import SocialProofBar from '../components/SocialProofBar'
import { useAuth } from '../lib/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { openBillingPortal, startPremiumCheckout, syncCheckoutSession } from '../lib/billingApi'
import { trackEvent } from '../lib/analytics'

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
          setMessage('Premium is active. Unlimited AI analysis is unlocked.')
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
    <div className="max-w-3xl mx-auto py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-black mb-2" style={{ color: '#0f172a' }}>
          Premium analysis
          {isPremium && (
            <span className="ml-2 text-sm font-bold uppercase px-2 py-1 rounded-md" style={{ background: '#dcfce7', color: '#166534' }}>
              Active
            </span>
          )}
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
          Deep research for serious bettors: injuries, weather, stats, unlimited AI analysis on any game,
          and long-form breakdowns on every pick. <strong style={{ color: '#0f172a' }}>$19.95/month</strong> — same 3 daily picks, more depth.
        </p>
      </div>

      <SocialProofBar compact />

      {!authLoading && !user && (
        <div className="rounded-xl p-4 mb-4 text-sm" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
          <Link to="/login" state={{ from: '/premium' }} style={{ color: '#b45309', fontWeight: 700 }}>
            Sign in
          </Link>
          {' '}to subscribe. Free accounts still get all 3 daily picks.
        </div>
      )}

      {isPremium && (
        <div className="rounded-xl p-4 mb-4 text-sm" style={{ background: '#ecfdf5', border: '1px solid #86efac', color: '#166534' }}>
          <strong>Premium active.</strong>
          {periodEndLabel && (
            <span>
              {' '}Renews {cancelAtPeriodEnd ? 'until' : 'on'} {periodEndLabel}
              {cancelAtPeriodEnd ? ' (cancels at period end)' : ''}.
            </span>
          )}
          {' '}Use <Link to="/analysis" style={{ color: '#15803d', fontWeight: 600 }}>AI Analysis</Link> on any game.
        </div>
      )}

      {message && (
        <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        {isPremium ? (
          <button
            type="button"
            onClick={handleManageBilling}
            disabled={busy || subLoading}
            className="px-5 py-3 rounded-xl text-sm font-bold"
            style={{ background: '#0f172a', color: '#fff' }}
          >
            {busy ? 'Opening…' : 'Manage billing'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={busy || authLoading || subLoading}
            className="px-5 py-3 rounded-xl text-sm font-bold"
            style={{ background: '#f59e0b', color: '#0f172a' }}
          >
            {busy ? 'Redirecting…' : 'Subscribe — $19.95/mo'}
          </button>
        )}
        <Link
          to="/analysis"
          className="px-5 py-3 rounded-xl text-sm font-bold inline-flex items-center"
          style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0' }}
        >
          {isPremium ? 'Run AI analysis' : 'Preview analysis page'}
        </Link>
      </div>

      <PremiumTeaser showWaitlist={false} />

      <div className="rounded-xl p-4 text-sm leading-relaxed" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
        <strong>What stays free:</strong> live odds comparison, today&apos;s top pick preview, and a free account for all 3 daily picks with full write-ups.
        Premium adds depth and unlimited AI analysis — not more free picks.
      </div>

      <p className="text-center text-sm mt-8">
        <Link to="/welcome" style={{ color: '#2563eb', fontWeight: 600 }}>← Back to welcome</Link>
        {' · '}
        <Link to="/odds" style={{ color: '#2563eb', fontWeight: 600 }}>Live odds</Link>
      </p>
    </div>
  )
}
