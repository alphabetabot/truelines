import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function HeroBanner({ campaignMode = false }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  if (user) return null

  if (campaignMode) {
    return (
      <div className="rounded-2xl p-5 mb-5" style={{ background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-elevated))', border: '1px solid var(--border)' }}>
        <h2 className="font-black mb-2 leading-tight" style={{ color: 'var(--text-primary)', fontSize: '1.35rem' }}>
          Today&apos;s free pick + live odds from <span style={{ color: 'var(--gold)' }}>6 books</span>
        </h2>
        <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          See the top AI pick below, then compare lines across DraftKings, FanDuel, BetMGM, and more.
          Free account adds newsletter email and the public tracker.
        </p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full py-3 rounded-xl font-black text-sm"
          style={{ background: 'var(--gold)', color: 'var(--text-primary)' }}
        >
          Create free account →
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-elevated))', border: '1px solid var(--border)' }}>
      <h2 className="font-black mb-1 leading-tight" style={{ color: 'var(--text-primary)', fontSize: '1.25rem' }}>
        Compare the Market with Data —<br />
        <span style={{ color: 'var(--gold)' }}>Not Hype</span>
      </h2>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Everyone gets today&apos;s top pick with a short summary below. Free accounts add newsletter email and the public tracker.
        Premium unlocks the full AI Picks and AI Analysis tabs.
      </p>
      <div className="flex flex-wrap gap-3 mb-4">
        {[
          '✔ Top pick preview (public)',
          '✔ Newsletter + tracker (free account)',
          '✔ Full AI picks + analysis (Premium)',
        ].map(item => (
          <span key={item} className="text-xs font-semibold" style={{ color: 'var(--green-live)' }}>{item}</span>
        ))}
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        New picks every morning · Pacific time
      </p>
      <button
        type="button"
        onClick={() => navigate('/login')}
        className="w-full py-3 rounded-xl font-black text-sm"
        style={{ background: 'var(--gold)', color: 'var(--text-primary)' }}
      >
        Create Free Account →
      </button>
    </div>
  )
}
