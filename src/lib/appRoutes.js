/** App workspace routes — hide SEO nav bar; keep SEO links in footer. */

const APP_WORKSPACE_PATHS = new Set(['/odds', '/compare', '/parlay', '/analysis', '/picks'])

/** Guest marketing landing — no tool nav (features stay on other routes). */
export function isMarketingHomepage(pathname) {
  return pathname === '/'
}

export function isAppWorkspaceRoute(pathname) {
  return APP_WORKSPACE_PATHS.has(pathname)
}
