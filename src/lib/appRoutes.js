/** App workspace routes — hide SEO nav bar; keep SEO links in footer. */

const APP_WORKSPACE_PATHS = new Set(['/odds', '/compare', '/analysis', '/picks'])

export function isAppWorkspaceRoute(pathname) {
  return APP_WORKSPACE_PATHS.has(pathname)
}
