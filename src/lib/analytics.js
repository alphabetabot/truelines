const GA_MEASUREMENT_ID = 'G-W6K2P39FPD'
export const ANALYTICS_CONSENT_KEY = 'trueoddsiq_analytics_consent'

export function getAnalyticsConsent() {
  try {
    return localStorage.getItem(ANALYTICS_CONSENT_KEY)
  } catch {
    return null
  }
}

export function setAnalyticsConsent(status) {
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, status)
  } catch {
    // private browsing
  }
  applyAnalyticsConsent(status === 'granted')
  if (status === 'granted' && typeof window.gtag === 'function') {
    window.gtag('event', 'cookie_consent', { status: 'granted' })
  }
}

/** Apply stored or new consent to gtag (Consent Mode v2). */
export function applyAnalyticsConsent(granted) {
  if (typeof window.gtag !== 'function') return
  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
}

export function initAnalyticsFromStorage() {
  const stored = getAnalyticsConsent()
  if (stored === 'granted') applyAnalyticsConsent(true)
  if (stored === 'denied') applyAnalyticsConsent(false)
}

export function trackEvent(eventName, params = {}) {
  if (getAnalyticsConsent() !== 'granted') return
  if (typeof window.gtag !== 'function') return
  window.gtag('event', eventName, params)
}

export { GA_MEASUREMENT_ID }
