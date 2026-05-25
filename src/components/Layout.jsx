import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { TrendingUp, Activity, BarChart2, Brain, Zap, Download, BookOpen, Trophy } from 'lucide-react'
import { useState, useEffect } from 'react'
import ScoreTicker from './ScoreTicker'
import PageMeta from './PageMeta'
import { getRouteMeta } from '../lib/routeMeta'
import { useAuth } from '../lib/AuthContext'

const NAV = [
  { to: '/', label: 'Live Odds', icon: Activity, exact: true },
  { to: '/compare', label: 'Line Compare', icon: BarChart2 },
  { to: '/analysis', label: 'AI Analysis', icon: Brain },
  { to: '/picks', label: 'AI Picks', icon: Zap },
  { to: '/blog', label: 'Blog', icon: BookOpen },
  { to: '/fantasy', label: 'DFS Preview', icon: Trophy },
]

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const routeMeta = getRouteMeta(location.pathname)
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- install banner runs once on mount
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
      <PageMeta {...routeMeta} />

      {/* ── Top bar: Logo + Install + Live ── */}
      <div style={{ background: '#0f172a' }}>
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between" style={{ height: 68 }}>
          {/* Logo */}
          <div className="flex items-center">
            <img src="/logo.svg" alt="TrueOddsIQ" style={{ height: 60, width: 'auto', maxWidth: 200, objectFit: 'contain' }} />
          </div>

          <div className="flex items-center gap-3">
            {showInstall && (
              <button onClick={handleInstall}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: '#f59e0b', color: '#0f172a' }}>
                <Download size={12} /> Download
              </button>
            )}
            {user ? (
              <button onClick={signOut}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                Sign Out
              </button>
            ) : (
              <button onClick={() => navigate('/login')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: '#f59e0b', color: '#0f172a' }}>
                Sign In
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
        <div className="max-w-5xl mx-auto px-3">
          {/* Row 1: Live Odds + Line Compare */}
          <div className="flex items-center gap-1" style={{ height: 40 }}>
            {NAV.slice(0, 2).map(({ to, label, icon, exact }) => {
                const NavIcon = icon
                return (
              <NavLink key={to} to={to} end={exact}
                className="flex items-center gap-2 px-4 h-full font-bold transition-all whitespace-nowrap"
                style={({ isActive }) => ({
                  background: isActive ? '#f59e0b' : 'transparent',
                  color: isActive ? '#0f172a' : 'rgba(255,255,255,0.8)',
                  fontSize: 14,
                })}>
                <NavIcon size={14} />{label}
              </NavLink>
            )})}
          </div>
          {/* Row 2: AI Analysis + AI Picks + Blog + Fantasy Sports */}
          <div className="flex items-center gap-1" style={{ height: 36, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {NAV.slice(2).map(({ to, label, icon, exact }) => {
                const NavIcon = icon
                return (
              <NavLink key={to} to={to} end={exact}
                className="flex items-center gap-1.5 px-3 h-full font-bold transition-all whitespace-nowrap"
                style={({ isActive }) => ({
                  background: isActive ? '#f59e0b' : 'transparent',
                  color: isActive ? '#0f172a' : 'rgba(255,255,255,0.7)',
                  fontSize: 13,
                })}>
                <NavIcon size={13} />{label}
              </NavLink>
            )})}

          </div>
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
            <Link to="/about" style={{ color: '#2563eb', fontWeight: 600 }}>About</Link>
            {' '}·{' '}
            <Link to="/disclaimer" style={{ color: '#2563eb', fontWeight: 600 }}>Site Disclaimer</Link>
            {' '}·{' '}
            <Link to="/privacy" style={{ color: '#2563eb', fontWeight: 600 }}>Privacy</Link>
            {' '}·{' '}
            <Link to="/terms" style={{ color: '#2563eb', fontWeight: 600 }}>Terms</Link>
            {' '}·{' '}
            <a href="mailto:info@trueoddsiq.com" style={{ color: '#2563eb', fontWeight: 600 }}>Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
