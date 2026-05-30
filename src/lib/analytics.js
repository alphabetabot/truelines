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

/** Phase 3 — product flow events */
export function trackSportSelect(sportKey, page, source = 'manual') {
  trackEvent('sport_select', { sport_key: sportKey, page, source })
}

export function trackDailyPickTeaserClick(fromPage = 'odds') {
  trackEvent('daily_pick_teaser_click', { from_page: fromPage })
}

export function trackMatchupCardClick({ sportKey, gameId, action = 'compare' }) {
  trackEvent('matchup_card_click', { sport_key: sportKey, game_id: gameId, action })
}

export function trackCompareInteraction(action, extra = {}) {
  trackEvent('compare_interaction', { action, ...extra })
}

export function trackAnalysisOpen({ sportKey, gameId, provider }) {
  trackEvent('analysis_open', { sport_key: sportKey, game_id: gameId, provider })
}

export function trackScoresTabOpen(sportKey, page = 'odds') {
  trackEvent('scores_tab_open', { sport_key: sportKey, page })
}

export function trackMoreToolsEngagement(tool) {
  trackEvent('more_tools_engagement', { tool })
}

/** Phase 3.5 — wayfinding & retention */
export function trackPickPerformanceView(period) {
  trackEvent('pick_performance_view', { period })
}

export function trackStickySportBarShown() {
  trackEvent('sticky_sport_bar_shown', {})
}

export function trackRecentGameClick(page, sportKey, gameId) {
  trackEvent('recent_game_click', { page, sport_key: sportKey, game_id: gameId })
}

export function trackGameNavPrevNext(page, direction, sportKey, gameId) {
  trackEvent('game_nav_prev_next', { page, direction, sport_key: sportKey, game_id: gameId })
}

export { GA_MEASUREMENT_ID }
