import { NavLink } from 'react-router-dom'
import { TrendingUp, Activity, BarChart2, Brain, Zap } from 'lucide-react'

const NAV = [
  { to: '/', label: 'Live Odds', icon: Activity, exact: true },
  { to: '/compare', label: 'Line Compare', icon: BarChart2 },
  { to: '/analysis', label: 'AI Analysis', icon: Brain },
  { to: '/picks', label: 'AI Picks', icon: Zap },
]

const SPORTS_NAV = [
  { to: '/nfl', label: 'NFL' },
  { to: '/ncaaf', label: 'NCAAF' },
  { to: '/nba', label: 'NBA' },
  { to: '/ncaab', label: 'NCAAB' },
  { to: '/mlb', label: 'MLB' },
  { to: '/nhl', label: 'NHL' },
  { to: '/epl', label: 'Soccer' },
  { to: '/mma', label: 'MMA' },
]

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>

      {/* Top bar */}
      <div style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-screen-2xl mx-auto px-4 flex items-center justify-between" style={{ height: 48 }}>

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <TrendingUp size={18} style={{ color: 'var(--accent)' }} />
            <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
              True<span style={{ color: 'var(--accent)' }}>Lines</span>
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded font-medium ml-1"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(56,139,253,0.3)', fontSize: 10 }}>
              BETA
            </span>
          </div>

          {/* Main nav */}
          <div className="flex items-center h-full">
            {NAV.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className="flex items-center gap-1.5 px-4 h-full text-xs font-medium border-b-2 transition-colors"
                style={({ isActive }) => ({
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  borderBottomColor: isActive ? 'var(--accent)' : 'transparent',
                })}
              >
                <Icon size={13} />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="live-dot w-2 h-2 rounded-full" style={{ background: 'var(--green)', display: 'inline-block' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Live</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-5">
        {children}
      </main>

      <footer className="text-center py-3 text-xs" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)' }}>
        TrueLines · Odds via The Odds API · AI by Claude · For informational use only
      </footer>
    </div>
  )
}
