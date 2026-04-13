import { NavLink } from 'react-router-dom'
import { TrendingUp, Activity, BarChart2, Brain, Zap } from 'lucide-react'

const NAV = [
  { to: '/', label: 'Live Odds', icon: Activity, exact: true },
  { to: '/compare', label: 'Line Compare', icon: BarChart2 },
  { to: '/analysis', label: 'AI Analysis', icon: Brain },
  { to: '/picks', label: 'AI Picks', icon: Zap },
]

const SPORTS_NAV = [
  { key: 'americanfootball_nfl', label: 'NFL' },
  { key: 'americanfootball_ncaaf', label: 'NCAAF' },
  { key: 'basketball_nba', label: 'NBA' },
  { key: 'basketball_ncaab', label: 'NCAAB' },
  { key: 'baseball_mlb', label: 'MLB' },
  { key: 'icehockey_nhl', label: 'NHL' },
  { key: 'soccer_epl', label: 'Soccer' },
  { key: 'mma_mixed_martial_arts', label: 'MMA' },
]

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Top nav bar */}
      <div style={{ background: 'var(--bg-nav)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between" style={{ height: 52 }}>
          <div className="flex items-center gap-2">
            <TrendingUp size={20} color="#4ade80" />
            <span className="font-bold text-lg tracking-tight text-white">
              True<span style={{ color: '#4ade80' }}>Lines</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all"
                style={({ isActive }) => ({
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                })}
              >
                <Icon size={13} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-4">
        {children}
      </main>

      <footer className="text-center py-3 text-xs" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
        TrueLines · Odds via The Odds API · AI by Claude · For informational use only
      </footer>
    </div>
  )
}
