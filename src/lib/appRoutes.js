/** App workspace routes — hide SEO nav bar; keep SEO links in footer. */

const APP_WORKSPACE_PATHS = new Set(['/odds', '/compare', '/analysis', '/picks'])

const COLLAPSIBLE_TICKER_PATHS = new Set(['/compare', '/analysis', '/picks'])

export function isAppWorkspaceRoute(pathname) {
  return APP_WORKSPACE_PATHS.has(pathname)
}

/** Full ticker hidden only where collapsible ticker is used. */
export function hideGlobalScoreTicker(pathname) {
  return showCollapsibleScoreTicker(pathname)
}

export function showCollapsibleScoreTicker(pathname) {
  return COLLAPSIBLE_TICKER_PATHS.has(pathname)
}
