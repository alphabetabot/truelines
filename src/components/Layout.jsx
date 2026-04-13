import { NavLink } from 'react-router-dom'
import { TrendingUp, Activity, BarChart2, Brain, Zap, Download } from 'lucide-react'
import { useState, useEffect } from 'react'

const NAV = [
  { to: '/', label: 'Live Odds', icon: Activity, exact: true },
  { to: '/compare', label: 'Line Compare', icon: BarChart2 },
  { to: '/analysis', label: 'AI Analysis', icon: Brain },
  { to: '/picks', label: 'AI Picks', icon: Zap },
]

export default function Layout({ children }) {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Android/Chrome install prompt
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstallBanner(true)
    })

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const standalone = window.navigator.standalone
    if (ios && !standalone) {
      setIsIOS(true)
      setShowInstallBanner(true)
    }
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }
    if (installPrompt) {
      await installPrompt.prompt()
      setShowInstallBanner(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Nav */}
      <div style={{ background: '#1e293b' }}>
        {/* Top row: logo + nav + install */}
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between" style={{ height: 50 }}>
          <div className="flex items-center gap-2 shrink-0">
            <TrendingUp size={18} style={{ color: '#f59e0b' }} />
            <span className="font-bold text-base tracking-tight" style={{ color: '#ffffff' }}>
              True<span style={{ color: '#f59e0b' }}>Lines</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-semibold transition-all"
                style={({ isActive }) => ({
                  background: isActive ? '#f59e0b' : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#1e293b' : '#ffffff',
                })}
              >
                <Icon size={12} />
                {label}
              </NavLink>
            ))}
          </div>

          {showInstallBanner && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold shrink-0"
              style={{ background: '#f59e0b', color: '#1e293b' }}
            >
              <Download size={12} />
              Install
            </button>
          )}
        </div>

        {/* Second row: LIVE indicator */}
        <div className="flex items-center gap-2 px-4 py-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '3px solid #f59e0b' }}>
          <span className="live-dot w-2 h-2 rounded-full inline-block shrink-0" style={{ background: '#4ade80' }} />
          <span className="text-xs font-bold" style={{ color: '#4ade80' }}>LIVE ODDS</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>· Auto-refreshing every 60s</span>
        </div>
      </div>

      {/* iOS install instructions banner */}
      {showIOSInstructions && (
        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: '#f59e0b', borderBottom: '1px solid #d97706' }}>
          <span className="text-sm font-medium" style={{ color: '#1e293b' }}>
            📲 Tap the <strong>Share</strong> button below, then <strong>"Add to Home Screen"</strong>
          </span>
          <button onClick={() => setShowIOSInstructions(false)}
            className="text-sm font-bold ml-4" style={{ color: '#1e293b' }}>✕</button>
        </div>
      )}

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-5">
        {children}
      </main>

      <footer className="text-center py-3 text-xs" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
        TrueLines · Odds via The Odds API · AI by Claude · For informational use only
      </footer>
    </div>
  )
}
