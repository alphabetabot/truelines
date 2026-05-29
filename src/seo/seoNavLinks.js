import { SEO_SPORT_SLUGS, SEO_SPORTS } from './seoContent'

/** Hub pages — shown in main nav row */
export const SEO_NAV_HUBS = [
  { to: '/ai-sports-picks', label: 'Picks Guide', shortLabel: 'Picks Guide' },
  { to: '/sportsbook-comparison', label: 'Compare Books', shortLabel: 'Books' },
]

export const SEO_NAV_ODDS = SEO_SPORT_SLUGS.map(slug => ({
  to: `/odds/${slug}`,
  label: `${SEO_SPORTS[slug].label} Odds`,
}))

export const SEO_NAV_PICKS = SEO_SPORT_SLUGS.map(slug => ({
  to: `/picks/${slug}`,
  label: `${SEO_SPORTS[slug].label} Picks`,
}))

/** Flat list for footer */
export const SEO_FOOTER_SECTIONS = [
  { title: 'Guides', links: SEO_NAV_HUBS },
  { title: 'Odds by sport', links: SEO_NAV_ODDS },
  { title: 'Picks by sport', links: SEO_NAV_PICKS },
]

export function isSeoNavPath(pathname) {
  if (SEO_NAV_HUBS.some(l => l.to === pathname)) return true
  if (SEO_NAV_ODDS.some(l => l.to === pathname)) return true
  if (SEO_NAV_PICKS.some(l => l.to === pathname)) return true
  return false
}
