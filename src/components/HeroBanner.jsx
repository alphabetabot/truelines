import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function HeroBanner({ campaignMode = false }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  if (user) return null

  if (campaignMode) {
    return (
      <div className="rounded-2xl p-5 mb-5" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', border: '1px solid #334155' }}>
        <h2 className="font-black mb-2 leading-tight" style={{ color: '#fff', fontSize: '1.35rem' }}>
          Today&apos;s free pick + live odds from <span style={{ color: '#f59e0b' }}>6 books</span>
        </h2>
        <p className="text-sm mb-4 leading-relaxed" style={{ color: '#64748b' }}>
          See the top AI pick below, then compare lines across DraftKings, FanDuel, BetMGM, and more.
          Free account adds newsletter email and the public tracker.
        </p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full py-3 rounded-xl font-black text-sm"
          style={{ background: '#f59e0b', color: '#0f172a' }}
        >
          Create free account →
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', border: '1px solid #334155' }}>
      <h2 className="font-black mb-1 leading-tight" style={{ color: '#fff', fontSize: '1.25rem' }}>
        Compare the Market with Data —<br />
        <span style={{ color: '#f59e0b' }}>Not Hype</span>
      </h2>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: '#64748b' }}>
        Everyone gets today&apos;s top pick with a short summary below. Free accounts add newsletter email and the public tracker.
        Premium unlocks the full AI Picks and AI Analysis tabs.
      </p>
      <div className="flex flex-wrap gap-3 mb-4">
        {[
          '✔ Top pick preview (public)',
          '✔ Newsletter + tracker (free account)',
          '✔ Full AI picks + analysis (Premium)',
        ].map(item => (
          <span key={item} className="text-xs font-semibold" style={{ color: '#4ade80' }}>{item}</span>
        ))}
      </div>
      <p className="text-xs mb-4" style={{ color: '#64748b' }}>
        New picks every morning · Pacific time
      </p>
      <button
        type="button"
        onClick={() => navigate('/login')}
        className="w-full py-3 rounded-xl font-black text-sm"
        style={{ background: '#f59e0b', color: '#0f172a' }}
      >
        Create Free Account →
      </button>
    </div>
  )
}
