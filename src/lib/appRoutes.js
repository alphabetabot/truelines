/** App workspace routes — hide SEO nav bar; keep SEO links in footer. */

const APP_WORKSPACE_PATHS = new Set(['/odds', '/compare', '/parlay', '/analysis', '/picks'])

const COLLAPSIBLE_TICKER_PATHS = new Set(['/compare', '/parlay', '/analysis', '/picks'])

/** Guest marketing landing — no tool nav or score ticker (features stay on other routes). */
export function isMarketingHomepage(pathname) {
  return pathname === '/'
}

export function isAppWorkspaceRoute(pathname) {
  return APP_WORKSPACE_PATHS.has(pathname)
}

/** Hide full-width ticker on app sub-pages and on the marketing homepage. */
export function hideGlobalScoreTicker(pathname) {
  return showCollapsibleScoreTicker(pathname) || isMarketingHomepage(pathname)
}

export function showCollapsibleScoreTicker(pathname) {
  return COLLAPSIBLE_TICKER_PATHS.has(pathname)
}
