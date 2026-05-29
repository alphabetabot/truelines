import { useNavigate } from 'react-router-dom'
import { Sparkles, Mail } from 'lucide-react'
import { trackEvent } from '../lib/analytics'

const TIERS = [
  {
    name: 'Public preview',
    price: 'Free',
    features: ['Today\'s top pick', 'Short edge summary', 'Live odds from 6 books'],
    highlight: false,
  },
  {
    name: 'Free account',
    price: 'Free',
    features: ['All 3 daily picks', 'Full write-up on each pick', 'Email newsletter + tracker'],
    highlight: true,
    cta: 'Create free account',
    to: '/login',
  },
  {
    name: 'Premium analysis',
    price: 'Coming soon',
    features: [
      'Injury & lineup context',
      'Weather & park factors (MLB)',
      'Advanced stats & matchup models',
      'Long-form breakdown per pick',
    ],
    highlight: false,
    waitlist: true,
  },
]

export default function PremiumTeaser({ showWaitlist = true }) {
  const navigate = useNavigate()

  function notifyPremiumInterest() {
    trackEvent('premium_interest', { source: 'premium_teaser' })
    window.location.href = 'mailto:info@trueoddsiq.com?subject=TrueOddsIQ%20Premium%20waitlist'
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={18} style={{ color: '#f59e0b' }} />
        <h2 className="text-lg font-black" style={{ color: '#0f172a' }}>
          How picks work today — and what&apos;s next
        </h2>
      </div>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: '#64748b' }}>
        We&apos;re building toward paid premium picks with deeper research. Right now everything below is free except
        the future premium tier.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {TIERS.map(tier => (
          <div
            key={tier.name}
            className="rounded-2xl p-4 flex flex-col"
            style={{
              background: '#fff',
              border: tier.highlight ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              boxShadow: tier.highlight ? '0 4px 20px rgba(245,158,11,0.12)' : 'none',
            }}
          >
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>
              {tier.name}
            </p>
            <p className="text-xl font-black mb-3" style={{ color: '#0f172a' }}>{tier.price}</p>
            <ul className="text-sm space-y-2 mb-4 flex-1" style={{ color: '#475569' }}>
              {tier.features.map(f => (
                <li key={f} className="flex gap-2">
                  <span style={{ color: '#22c55e' }}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {tier.cta && (
              <button
                type="button"
                onClick={() => navigate(tier.to)}
                className="w-full py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#f59e0b', color: '#0f172a' }}
              >
                {tier.cta}
              </button>
            )}
            {showWaitlist && tier.waitlist && (
              <button
                type="button"
                onClick={notifyPremiumInterest}
                className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: '#0f172a', color: '#fff' }}
              >
                <Mail size={14} />
                Join premium waitlist
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
