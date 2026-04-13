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
      {/* Nav - dark charcoal with white text, easy to read */}
      <div style={{ background: '#1e293b', borderBottom: '3px solid #f59e0b' }}>
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between" style={{ height: 54 }}>
          {/* Logo */}
          <div className="flex items-center gap-2">
            <TrendingUp size={20} style={{ color: '#f59e0b' }} />
            <span className="font-bold text-lg tracking-tight" style={{ color: '#ffffff' }}>
              True<span style={{ color: '#f59e0b' }}>Lines</span>
            </span>
          </div>

          {/* Nav links - white text on dark bg, very readable */}
          <div className="flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-all"
                style={({ isActive }) => ({
                  background: isActive ? '#f59e0b' : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#1e293b' : '#ffffff',
                })}
              >
                <Icon size={13} />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Live dot */}
          <div className="flex items-center gap-1.5">
            <span className="live-dot w-2 h-2 rounded-full inline-block" style={{ background: '#4ade80' }} />
            <span className="text-xs font-medium" style={{ color: '#ffffff' }}>Live</span>
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
