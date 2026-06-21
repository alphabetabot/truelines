import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="text-center py-20 px-4">
      <p className="text-6xl font-black mb-3" style={{ color: 'var(--border)' }}>404</p>
      <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Page not found</h1>
      <p className="text-sm mb-6 max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        That URL does not exist on TrueOddsIQ. Head back to live odds, AI picks, or our blog.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/odds" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--bg-secondary)' }}>
          Live Odds
        </Link>
        <Link to="/picks" className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'var(--gold)', color: 'var(--text-primary)' }}>
          AI Picks
        </Link>
        <Link to="/blog" className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
          Blog
        </Link>
      </div>
    </div>
  )
}
