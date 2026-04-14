import { NavLink } from 'react-router-dom'
import { TrendingUp, Activity, BarChart2, Brain, Zap, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import ScoreTicker from './ScoreTicker'

const NAV = [
  { to: '/', label: 'Live Odds', icon: Activity, exact: true },
  { to: '/compare', label: 'Line Compare', icon: BarChart2 },
  { to: '/analysis', label: 'AI Analysis', icon: Brain },
  { to: '/picks', label: 'AI Picks', icon: Zap },
]

export default function Layout({ children }) {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstall(true)
    })
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (ios && !window.navigator.standalone) {
      setIsIOS(true)
      setShowInstall(true)
    }
  }, [])

  const handleInstall = async () => {
    if (isIOS) { setShowIOSHint(true); return }
    if (installPrompt) { await installPrompt.prompt(); setShowInstall(false) }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>

      {/* ── Top bar: Logo + Install + Live ── */}
      <div style={{ background: '#0f172a' }}>
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between" style={{ height: 52 }}>
          {/* Logo */}
          <div className="flex items-center gap-2">
            <TrendingUp size={20} style={{ color: '#f59e0b' }} />
            <span style={{ color: '#ffffff', fontWeight: 900, fontSize: 20, letterSpacing: '-0.5px' }}>
              True<span style={{ color: '#f59e0b' }}>Lines</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {showInstall && (
              <button onClick={handleInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: '#f59e0b', color: '#0f172a' }}>
                <Download size={12} /> Install App
              </button>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)' }}>
              <span className="live-dot w-2 h-2 rounded-full inline-block" style={{ background: '#4ade80' }} />
              <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 800, letterSpacing: '0.5px' }}>LIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav tabs ── */}
      <div style={{ background: '#1e293b', borderBottom: '3px solid #f59e0b' }}>
        <div className="max-w-5xl mx-auto px-3 flex items-center gap-1" style={{ height: 44 }}>
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className="flex items-center gap-1.5 px-3 h-full font-bold transition-all whitespace-nowrap"
              style={({ isActive }) => ({
                background: isActive ? '#f59e0b' : 'transparent',
                color: isActive ? '#0f172a' : 'rgba(255,255,255,0.7)',
                borderRadius: isActive ? '6px 6px 0 0' : 0,
                fontSize: 13,
                letterSpacing: '0.2px',
              })}
            >
              <Icon size={13} />
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* ── Score ticker ── */}
      <ScoreTicker />

      {/* ── iOS install hint ── */}
      {showIOSHint && (
        <div className="flex items-center justify-between px-4 py-2.5"
          style={{ background: '#f59e0b' }}>
          <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>
            📲 Tap <strong>Share</strong> → <strong>"Add to Home Screen"</strong>
          </span>
          <button onClick={() => setShowIOSHint(false)}
            className="font-bold ml-4" style={{ color: '#0f172a' }}>✕</button>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-5">
        {children}
      </main>

      <footer className="text-center py-3"
        style={{ color: '#94a3b8', borderTop: '1px solid #e2e8f0', fontSize: 11 }}>
        TrueLines · Odds via The Odds API · AI by Claude & ChatGPT · For informational use only
      </footer>
    </div>
  )
}
