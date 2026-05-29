import { Link } from 'react-router-dom'
import PremiumTeaser from '../components/PremiumTeaser'
import SocialProofBar from '../components/SocialProofBar'

export default function Premium() {
  return (
    <div className="max-w-3xl mx-auto py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-black mb-2" style={{ color: '#0f172a' }}>
          Premium analysis <span style={{ color: '#f59e0b' }}>(coming soon)</span>
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
          TrueOddsIQ will offer a paid tier with the kind of deep research usually reserved for pro bettors:
          injuries, weather, pitcher/hitter splits, rest days, line movement context, and a long-form breakdown for every pick.
        </p>
      </div>

      <SocialProofBar compact />

      <PremiumTeaser showWaitlist />

      <div className="rounded-xl p-4 text-sm leading-relaxed" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
        <strong>What stays free:</strong> live odds comparison, today&apos;s top pick preview, and a free account for all 3 daily picks with full write-ups.
        Premium adds depth — not more picks for free users.
      </div>

      <p className="text-center text-sm mt-8">
        <Link to="/welcome" style={{ color: '#2563eb', fontWeight: 600 }}>← Back to welcome</Link>
        {' · '}
        <Link to="/" style={{ color: '#2563eb', fontWeight: 600 }}>Live odds</Link>
      </p>
    </div>
  )
}
