import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  initAnalyticsFromStorage,
} from '../lib/analytics'

const PREFS_EVENT = 'trueoddsiq:cookie_preferences'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    initAnalyticsFromStorage()
    if (!getAnalyticsConsent()) setVisible(true)

    function openPreferences() {
      setVisible(true)
    }
    window.addEventListener(PREFS_EVENT, openPreferences)
    return () => window.removeEventListener(PREFS_EVENT, openPreferences)
  }, [])

  function accept() {
    setAnalyticsConsent('granted')
    setVisible(false)
  }

  function decline() {
    setAnalyticsConsent('denied')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 py-4"
      style={{ background: 'rgba(15, 23, 42, 0.97)', borderTop: '1px solid #334155' }}
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-sm flex-1 leading-relaxed" style={{ color: '#e2e8f0' }}>
          We use cookies for essential site features and optional Google Analytics to understand traffic.
          See our{' '}
          <Link to="/privacy" className="underline font-semibold" style={{ color: '#f59e0b' }}>
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={decline}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'transparent', color: '#64748b', border: '1px solid #475569' }}
          >
            Decline analytics
          </button>
          <button
            type="button"
            onClick={accept}
            className="px-4 py-2 rounded-lg text-sm font-bold"
            style={{ background: '#f59e0b', color: '#0f172a' }}
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  )
}

export function openCookiePreferences() {
  window.dispatchEvent(new Event(PREFS_EVENT))
}
