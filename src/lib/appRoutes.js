/** App workspace routes — hide SEO nav bar; keep SEO links in footer. */

const APP_WORKSPACE_PATHS = new Set(['/odds', '/compare', '/analysis', '/picks'])

const COLLAPSIBLE_TICKER_PATHS = new Set(['/compare', '/analysis', '/picks'])

export function isAppWorkspaceRoute(pathname) {
  return APP_WORKSPACE_PATHS.has(pathname)
}

/** /odds has its own Scores tab — no global ticker. */
export function hideGlobalScoreTicker(pathname) {
  return pathname === '/odds' || isAppWorkspaceRoute(pathname)
}

export function showCollapsibleScoreTicker(pathname) {
  return COLLAPSIBLE_TICKER_PATHS.has(pathname)
}
