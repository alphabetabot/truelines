import { Link, useNavigate } from 'react-router-dom'
import { Activity, BarChart2, Zap, CheckCircle2 } from 'lucide-react'
import DailyPick from '../components/DailyPick'
import SocialProofBar from '../components/SocialProofBar'
import PremiumTeaser from '../components/PremiumTeaser'
import { trackEvent } from '../lib/analytics'

const STEPS = [
  { icon: Zap, title: 'See today\'s top pick', text: 'One free pick every morning with a clear bet line and short summary.' },
  { icon: Activity, title: 'Shop the best odds', text: 'Compare lines across six major sportsbooks before you place a bet.' },
  { icon: BarChart2, title: 'Unlock the full slate', text: 'Free account = all 3 daily picks, email delivery, and a public track record.' },
]

export default function Welcome() {
  const navigate = useNavigate()

  function ctaSignup() {
    trackEvent('welcome_cta', { action: 'signup' })
    navigate('/login')
  }

  function ctaOdds() {
    trackEvent('welcome_cta', { action: 'browse_odds' })
    navigate('/odds')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#f59e0b' }}>
          TrueOddsIQ
        </p>
        <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4" style={{ color: '#0f172a' }}>
          Smarter bets start with<br />
          <span style={{ color: '#f59e0b' }}>better data</span>
        </h1>
        <p className="text-base leading-relaxed mb-6" style={{ color: '#64748b' }}>
          Live odds comparison plus AI-assisted daily picks — no hype, no touts. See one pick free; create a free account for the full newsletter slate.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={ctaSignup}
            className="px-6 py-3 rounded-xl font-black text-sm"
            style={{ background: '#f59e0b', color: '#0f172a' }}
          >
            Get all 3 picks — free account
          </button>
          <button
            type="button"
            onClick={ctaOdds}
            className="px-6 py-3 rounded-xl font-bold text-sm"
            style={{ background: '#fff', color: '#0f172a', border: '1.5px solid #e2e8f0' }}
          >
            Browse live odds
          </button>
        </div>
      </div>

      <SocialProofBar />

      <DailyPick />

      <section className="mb-8">
        <h2 className="text-lg font-black mb-4" style={{ color: '#0f172a' }}>How it works</h2>
        <div className="space-y-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="flex gap-4 p-4 rounded-xl" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm"
                style={{ background: '#0f172a', color: '#f59e0b' }}
              >
                {i + 1}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={16} style={{ color: '#f59e0b' }} />
                  <p className="font-bold text-sm" style={{ color: '#0f172a' }}>{title}</p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PremiumTeaser />

      <section
        className="rounded-2xl p-5 mb-6"
        style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', border: '1px solid #334155' }}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 size={22} className="shrink-0" style={{ color: '#4ade80' }} />
          <div>
            <p className="font-bold text-white mb-2">Built for bettors, not sportsbooks</p>
            <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
              We don&apos;t take bets. OPEN/VISIT buttons go straight to each book&apos;s website so you can verify lines —
              we&apos;re not on an affiliate program yet. Picks are informational only. 21+ where legal.
            </p>
          </div>
        </div>
      </section>

      <p className="text-center text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
        Already have an account?{' '}
        <Link to="/login" className="font-semibold" style={{ color: '#2563eb' }}>Sign in</Link>
        {' · '}
        <Link to="/premium" className="font-semibold" style={{ color: '#2563eb' }}>Premium plans</Link>
        {' · '}
        <Link to="/disclaimer" className="font-semibold" style={{ color: '#2563eb' }}>Disclaimer</Link>
      </p>
    </div>
  )
}
