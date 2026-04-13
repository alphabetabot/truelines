import { NavLink } from 'react-router-dom'
import { TrendingUp, Activity, BarChart2, Brain, Zap } from 'lucide-react'

const NAV = [
  { to: '/', label: 'Live Odds', icon: Activity, exact: true },
  { to: '/compare', label: 'Line Compare', icon: BarChart2 },
  { to: '/analysis', label: 'AI Analysis', icon: Brain },
  { to: '/picks', label: 'AI Picks', icon: Zap },
]

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Nav */}
      <div style={{ background: 'var(--bg-nav)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between" style={{ height: 54 }}>
          {/* Logo */}
          <div className="flex items-center gap-2">
            <TrendingUp size={20} style={{ color: 'var(--accent)' }} />
            <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
              True<span style={{ color: 'var(--accent)' }}>Lines</span>
            </span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={({ isActive }) => ({
                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--accent-glow)' : '1px solid transparent',
                })}
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Live dot */}
          <div className="flex items-center gap-1.5">
            <span className="live-dot w-2 h-2 rounded-full inline-block" style={{ background: 'var(--accent)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Live</span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-5">
        {children}
      </main>

      <footer className="text-center py-3 text-xs" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
        TrueLines · Odds via The Odds API · AI by Claude · For informational use only
      </footer>
    </div>
  )
}
