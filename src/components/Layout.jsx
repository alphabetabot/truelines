import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { Activity, BarChart2, Brain, Zap, Download, BookOpen, Lock, Layers } from 'lucide-react'
import { useState, useEffect } from 'react'
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
} from '../lib/appRoutes'

const NAV = [
  { to: '/odds', label: 'Live Odds', shortLabel: 'Odds', icon: Activity, exact: true },
  { to: '/compare', label: 'Line Compare', shortLabel: 'Compare', icon: BarChart2 },
  { to: '/parlay', label: 'Parlay Builder', shortLabel: 'Parlay', icon: Layers },
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
        background: isActive ? 'var(--gold)' : 'transparent',
        color: isActive ? 'var(--text-on-cta)' : 'rgba(255,255,255,0.8)',
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

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-primary)' }}
    >
      {!hideRouteSEO && <RouteSEO />}

      {!marketingHome && (
      <div style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--green-border)' }}>
        <div
          className="max-w-5xl mx-auto px-4 flex items-center justify-between"
          style={{ height: appWorkspace ? 56 : 68 }}
        >
          <LogoLink height={48} maxWidth={220} theme="marketing" />

          <div className="flex items-center gap-3">
            {showInstall && (
              <button onClick={handleInstall}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: 'var(--gold)', color: 'var(--text-on-cta)' }}>
                <Download size={12} /> Download
              </button>
            )}
            {user ? (
              <button onClick={signOut}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                Sign Out
              </button>
            ) : (
              <button onClick={() => navigate('/login')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: 'var(--gold)', color: 'var(--text-on-cta)' }}>
                Sign In
              </button>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'var(--green-dim)', border: '1px solid var(--green-border)' }}>
              <span className="live-dot w-2 h-2 rounded-full inline-block" style={{ background: 'var(--green-live)' }} />
              <span style={{ color: 'var(--green-live)', fontSize: 11, fontWeight: 800, letterSpacing: '0.5px' }}>LIVE</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {!marketingHome && (
        <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--green-border)' }}>
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
                <div className="flex items-center gap-1" style={{ height: 36, borderTop: '1px solid var(--border-light)' }}>
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

      {showIOSHint && (
        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: 'var(--gold)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-on-cta)' }}>
            📲 Tap the <strong>Share ⬆️</strong> button at the bottom of Safari → then tap <strong>"Add to Home Screen"</strong>
          </span>
          <button onClick={() => setShowIOSHint(false)}
            className="font-bold ml-4 text-lg" style={{ color: 'var(--text-on-cta)' }}>✕</button>
        </div>
      )}

      <main
        className={`flex-1 w-full ${marketingHome ? 'max-w-none px-0 py-0' : `max-w-5xl mx-auto px-4 ${appWorkspace ? 'py-2 sm:py-3' : 'py-5'}`}`}
        style={marketingHome ? undefined : { paddingLeft: 16, paddingRight: 16 }}
      >
        {children}
      </main>

      <CookieConsent />

      {!marketingHome && (
      <footer
        className="px-4 pb-20 sm:pb-6 py-4 sm:pb-4"
        style={{ borderTop: '1px solid var(--green-border)', background: 'var(--bg-secondary)' }}
      >
        <div className="max-w-5xl mx-auto flex flex-col gap-2">
          <SeoFooterNav variant="default" />
          <div className="text-center" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            TrueOddsIQ · Odds via The Odds API · AI by Claude & ChatGPT · Must be 21+ to wager · For informational use only
          </div>
          <div className="text-center" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Gambling problem? Call <a href="tel:1-800-426-2537" style={{ color: 'var(--green)', fontWeight: 700 }}>1-800-GAMBLER</a>
            {' '}·{' '}
            <Link to="/about" style={{ color: 'var(--accent)', fontWeight: 600 }}>About</Link>
            {' '}·{' '}
            <Link to="/disclaimer" style={{ color: 'var(--accent)', fontWeight: 600 }}>Site Disclaimer</Link>
            {' '}·{' '}
            <Link to="/privacy" style={{ color: 'var(--accent)', fontWeight: 600 }}>Privacy</Link>
            {' '}·{' '}
            <Link to="/terms" style={{ color: 'var(--accent)', fontWeight: 600 }}>Terms</Link>
            {' '}·{' '}
            <button
              type="button"
              onClick={openCookiePreferences}
              style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 11 }}
            >
              Cookie preferences
            </button>
            {' '}·{' '}
            <a href="mailto:info@trueoddsiq.com" style={{ color: 'var(--accent)', fontWeight: 600 }}>Contact Us</a>
          </div>
        </div>
      </footer>
      )}
    </div>
  )
}
