import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function HeroBanner() {
  const navigate = useNavigate()
  const { user } = useAuth()

  if (user) return null

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', border: '1px solid #334155' }}>
      <h2 className="font-black mb-1 leading-tight" style={{ color: '#fff', fontSize: '1.25rem' }}>
        Compare the Market with Data —<br />
        <span style={{ color: '#f59e0b' }}>Not Hype</span>
      </h2>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: '#94a3b8' }}>
        Everyone gets today&apos;s top pick with a short summary below. A free account unlocks all 3 daily picks,
        email delivery, and the performance tracker. Premium (coming later) adds deep breakdowns — injuries, weather, stats, and more.
      </p>
      <div className="flex flex-wrap gap-3 mb-4">
        {[
          '✔ 1 pick preview + brief edge (free)',
          '✔ All 3 picks + tracker (free account)',
          '✔ Live odds from 6 books',
        ].map(item => (
          <span key={item} className="text-xs font-semibold" style={{ color: '#4ade80' }}>{item}</span>
        ))}
      </div>
      <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
        New picks every morning · Pacific time
      </p>
      <button
        onClick={() => navigate('/login')}
        className="w-full py-3 rounded-xl font-black text-sm"
        style={{ background: '#f59e0b', color: '#0f172a' }}
      >
        Unlock All 3 Picks — Free Account →
      </button>
    </div>
  )
}
