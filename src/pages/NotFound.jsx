import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Mail } from 'lucide-react'

export default function NotFound() {
  const location = useLocation()

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: '#0f172a' }}
      >
        <Search size={28} style={{ color: '#f59e0b' }} />
      </div>

      <p className="text-xs font-bold tracking-widest mb-2" style={{ color: '#d97706' }}>
        404 - PAGE NOT FOUND
      </p>
      <h1 className="text-3xl font-black mb-3" style={{ color: '#0f172a' }}>
        This page is off the board
      </h1>
      <p className="text-sm leading-relaxed mb-2" style={{ color: '#64748b' }}>
        We could not find <span className="font-mono">{location.pathname}</span>.
      </p>
      <p className="text-sm leading-relaxed mb-8" style={{ color: '#64748b' }}>
        The link may be outdated, mistyped, or from an old campaign. Start from one of the active TrueOddsIQ pages below.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 mb-8">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm"
          style={{ background: '#0f172a', color: '#fff', textDecoration: 'none' }}
        >
          <Home size={16} />
          Go to Odds Board
        </Link>
        <Link
          to="/picks"
          className="flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm"
          style={{ background: '#f59e0b', color: '#0f172a', textDecoration: 'none' }}
        >
          View AI Picks
        </Link>
      </div>

      <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
        <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
          Need help or found a broken link?
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <a href="mailto:info@trueoddsiq.com" className="flex items-center gap-1 font-semibold" style={{ color: '#2563eb' }}>
            <Mail size={14} />
            Contact us
          </a>
          <Link to="/about" className="font-semibold" style={{ color: '#2563eb' }}>About</Link>
          <Link to="/privacy" className="font-semibold" style={{ color: '#2563eb' }}>Privacy</Link>
          <Link to="/terms" className="font-semibold" style={{ color: '#2563eb' }}>Terms</Link>
        </div>
      </div>
    </div>
  )
}
