import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { Activity, BarChart2, Brain, Zap, Download, BookOpen, Lock } from 'lucide-react'
import { useState, useEffect } from 'react'
import ScoreTicker from './ScoreTicker'
import CollapsibleScoreTicker from './CollapsibleScoreTicker'
import PageMeta from './PageMeta'
import CookieConsent, { openCookiePreferences } from './CookieConsent'
import LogoLink from './LogoLink'
import { useAuth } from '../lib/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { getRouteMeta } from '../lib/routeMeta'
import SeoNavBar from '../seo/components/SeoNavBar'
import SeoFooterNav from '../seo/components/SeoFooterNav'
import {
  isAppWorkspaceRoute,
  isMarketingHomepage,
  showCollapsibleScoreTicker,
  hideGlobalScoreTicker,
} from '../lib/appRoutes'

const NAV = [
  { to: '/odds', label: 'Live Odds', shortLabel: 'Odds', icon: Activity, exact: true },
  { to: '/compare', label: 'Line Compare', shortLabel: 'Compare', icon: BarChart2 },
  { to: '/analysis', label: 'AI Analysis', shortLabel: 'Analysis', icon: Brain, premium: true },
  { to: '/picks', label: 'AI Picks', shortLabel: 'Picks', icon: Zap, premium: true },
  { to: '/blog', label: 'Blog', shortLabel: 'Blog', icon: BookOpen },
]

function PrimaryNavLink({ to, label, shortLabel, icon: Icon, exact, compact, locked }) {
  const displayLabel = compact ? shortLabel : label
  const iconSize = compact ? 13 : 14
  const fontSize = compact ? 12 : 14
  const gap = compact ? 'gap-1' : 'gap-2'
  const px = compact ? 'px-2.5' : 'px-4'

  return (
    <NavLink
      key={to}
      to={to}
      end={exact}
      className={`flex items-center ${gap} ${px} h-full font-bold transition-all whitespace-nowrap shrink-0`}
      style={({ isActive }) => ({
        background: isActive ? '#f59e0b' : 'transparent',
        color: isActive ? '#0f172a' : compact ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.8)',
        fontSize,
      })}
    >
      <Icon size={iconSize} />
      {displayLabel}
      {locked && <Lock size={10} style={{ opacity: 0.85 }} />}
    </NavLink>
  )
}

function RouteSEO() {
  const { pathname } = useLocation()
  const meta = getRouteMeta(pathname)
  return (
    <PageMeta
      title={meta.title}
      description={meta.description}
      path={meta.path || pathname}
      noindex={meta.noindex}
    />
  )
}

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const { isPremium } = useSubscription()
  const navigate = useNavigate()
  const location = useLocation()
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

  const hideRouteSEO = location.pathname.startsWith('/blog/') && location.pathname.length > '/blog/'.length
  const pathname = location.pathname
  const appWorkspace = isAppWorkspaceRoute(pathname)
  const marketingHome = isMarketingHomepage(pathname)
  const showCollapsibleTicker = showCollapsibleScoreTicker(pathname)
  const showFullTicker = !hideGlobalScoreTicker(pathname)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {!hideRouteSEO && <RouteSEO />}

      {/* ── Top bar: Logo + Install + Live (logo lives in Welcome hero on marketing home) ── */}
      <div style={{ background: '#0f172a' }}>
        <div
          className="max-w-5xl mx-auto px-4 flex items-center justify-between"
          style={{ height: marketingHome ? 48 : appWorkspace ? 56 : 68 }}
        >
          {!marketingHome && <LogoLink />}
          {marketingHome && <div className="w-0 sm:w-auto" aria-hidden />}

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
            ) : marketingHome ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/premium')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold hidden sm:inline-flex"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  Premium
                </button>
                <button onClick={() => navigate('/login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: '#f59e0b', color: '#0f172a' }}>
                  Sign In
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/login')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: '#f59e0b', color: '#0f172a' }}>
                Sign In
              </button>
            )}
            {!marketingHome && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)' }}>
                <span className="live-dot w-2 h-2 rounded-full inline-block" style={{ background: '#4ade80' }} />
                <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 800, letterSpacing: '0.5px' }}>LIVE</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Nav tabs (hidden on marketing homepage — tools live on /odds, /compare, etc.) ── */}
      {!marketingHome && (
        <div style={{ background: '#1e293b', borderBottom: '3px solid #f59e0b' }}>
          <div className="max-w-5xl mx-auto px-3">
            {appWorkspace ? (
              <div
                className="flex items-center gap-0.5 overflow-x-auto"
                style={{ height: 36, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}
              >
                {NAV.map(item => (
                  <PrimaryNavLink key={item.to} {...item} compact locked={item.premium && !isPremium} />
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1" style={{ height: 40 }}>
                  {NAV.slice(0, 2).map(item => (
                    <PrimaryNavLink key={item.to} {...item} compact={false} locked={item.premium && !isPremium} />
                  ))}
                </div>
                <div className="flex items-center gap-1" style={{ height: 36, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  {NAV.slice(2).map(item => (
                    <PrimaryNavLink key={item.to} {...item} compact={false} locked={item.premium && !isPremium} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!appWorkspace && !marketingHome && <SeoNavBar />}

      {/* ── Score ticker: hidden on /odds; collapsible on other app pages; full elsewhere ── */}
      {showCollapsibleTicker && <CollapsibleScoreTicker />}
      {showFullTicker && <ScoreTicker />}

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
      <main
        className={`flex-1 w-full ${marketingHome ? 'max-w-none px-0 py-0' : `max-w-5xl mx-auto px-4 ${appWorkspace ? 'py-2 sm:py-3' : 'py-5'}`}`}
        style={marketingHome ? undefined : { paddingLeft: 16, paddingRight: 16 }}
      >
        {children}
      </main>

      <CookieConsent />

      <footer
        className={`px-4 pb-20 sm:pb-6 ${marketingHome ? 'pt-10 sm:pt-12' : 'py-4 sm:pb-4'}`}
        style={{
          borderTop: marketingHome ? '4px solid #0f172a' : '1px solid #e2e8f0',
          background: marketingHome ? '#f1f5f9' : '#fff',
        }}
      >
        <div className="max-w-5xl mx-auto flex flex-col gap-2">
          {marketingHome && (
            <p
              className="text-center text-xs font-black uppercase tracking-[0.2em] mb-4"
              style={{ color: '#0f172a' }}
            >
              Explore the site
            </p>
          )}
          <SeoFooterNav variant={marketingHome ? 'marketing' : 'default'} />
          <div
            className={marketingHome ? 'pt-6 mt-4' : undefined}
            style={marketingHome ? { borderTop: '2px solid #cbd5e1' } : undefined}
          >
          <div className="text-center" style={{ color: marketingHome ? '#0f172a' : '#334155', fontSize: 11 }}>
            TrueOddsIQ · Odds via The Odds API · AI by Claude & ChatGPT · Must be 21+ to wager · For informational use only
          </div>
          <div className="text-center" style={{ fontSize: 11, color: marketingHome ? '#0f172a' : '#334155' }}>
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
            <button
              type="button"
              onClick={openCookiePreferences}
              style={{ color: '#2563eb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 11 }}
            >
              Cookie preferences
            </button>
            {' '}·{' '}
            <a href="mailto:info@trueoddsiq.com" style={{ color: '#2563eb', fontWeight: 600 }}>Contact Us</a>
          </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
