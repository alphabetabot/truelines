import { NavLink, Link } from 'react-router-dom'
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
    const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches
    if (ios && !standalone) {
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
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between" style={{ height: 72 }}>
          {/* Logo */}
          <div className="flex items-center">
            <img src="/logo.jpg" alt="TrueOddsIQ" style={{ height: 52, width: 'auto', maxWidth: 180, objectFit: 'contain' }} />
          </div>

          <div className="flex items-center gap-3">
            {showInstall && (
              <button onClick={handleInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: '#f59e0b', color: '#0f172a' }}>
                <Download size={12} /> {isIOS ? 'Add to Home Screen' : 'Install App'}
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
        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: '#f59e0b' }}>
          <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>
            📲 Tap the <strong>Share ⬆️</strong> button at the bottom of Safari → then tap <strong>"Add to Home Screen"</strong>
          </span>
          <button onClick={() => setShowIOSHint(false)}
            className="font-bold ml-4 text-lg" style={{ color: '#0f172a' }}>✕</button>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-5" style={{ paddingLeft: 16, paddingRight: 16 }}>
        {children}
      </main>

      <footer className="py-4 px-4" style={{ borderTop: '1px solid #e2e8f0', background: '#fff' }}>
        <div className="max-w-5xl mx-auto flex flex-col gap-2">
          <div className="text-center" style={{ color: '#94a3b8', fontSize: 11 }}>
            TrueOddsIQ · Odds via The Odds API · AI by Claude & ChatGPT · Must be 21+ to wager · For informational use only
          </div>
          <div className="text-center" style={{ fontSize: 11, color: '#94a3b8' }}>
            Gambling problem? Call <a href="tel:1-800-426-2537" style={{ color: '#16a34a', fontWeight: 700 }}>1-800-GAMBLER</a>
            {' '}·{' '}
            <Link to="/disclaimer" style={{ color: '#2563eb', fontWeight: 600 }}>Site Disclaimer</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
