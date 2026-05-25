/** Canonical site origin for Supabase email redirects (confirm, reset). */
export function getSiteOrigin() {
  const env = import.meta.env.VITE_SITE_URL
  if (env && typeof env === 'string') return env.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://trueoddsiq.com'
}
