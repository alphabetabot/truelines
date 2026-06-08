import { SEO_ROUTE_META } from '../seo/seoContent.js'

const SITE_URL = 'https://trueoddsiq.com'

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.svg`

/** Static route metadata for CSR pages. Blog posts override in Blog.jsx. */
export const ROUTE_META = {
  '/': {
    title: 'Daily AI Picks & Live Odds Comparison',
    description:
      'Vega\'s daily betting card — three picks, public track record, and live odds from six sportsbooks. Free account for the full card; Premium for in-depth reports.',
  },
  '/odds': {
    title: 'Live Sports Betting Odds Comparison',
    description:
      'Compare current odds from six major sportsbooks in real time. MLB, NBA, and NHL with live scores.',
  },
  '/welcome': {
    title: 'Welcome — Free Pick Preview & Live Odds',
    description:
      'See today\'s top AI pick, compare odds across six sportsbooks, and create a free account for all three daily picks.',
  },
  '/premium': {
    title: 'Premium Analysis — $19.95/mo',
    description:
      'Unlimited AI analysis, injury and weather depth, and long-form pick reports — $19.95/month.',
  },
  '/compare': {
    title: 'Line Comparison Across Sportsbooks',
    description: 'Side-by-side moneyline, spread, and total lines from DraftKings, FanDuel, BetMGM, Caesars, Pinnacle, and Bet365.',
  },
  '/analysis': {
    title: 'AI Game Analysis',
    description: 'Run Claude and ChatGPT analysis on live odds snapshots. MLB includes probable pitcher context when available.',
  },
  '/picks': {
    title: 'Daily AI Picks',
    description: 'View the same daily picks from the TrueOddsIQ newsletter. Free account required for the full pick slate.',
  },
  '/blog': {
    title: 'Sports Betting Blog',
    description: 'Guides on line shopping, odds reading, and how Vega\'s daily picks pipeline works.',
  },
  '/about': {
    title: 'About TrueOddsIQ',
    description: 'How TrueOddsIQ compares sportsbook odds, what data powers AI analysis, and our independence policy.',
  },
  '/disclaimer': {
    title: 'Site Disclaimer',
    description: 'Informational use only. AI picks and odds data are not guaranteed. Must be 21+ in legal jurisdictions.',
  },
  '/privacy': {
    title: 'Privacy Policy',
    description: 'How TrueOddsIQ handles account data, newsletters, Google Analytics, cookies, and third-party providers.',
  },
  '/terms': {
    title: 'Terms of Service',
    description: 'Terms governing use of TrueOddsIQ odds comparison, AI tools, and newsletter services.',
  },
  '/login': {
    title: 'Sign In or Create Account',
    description: 'Free account for all daily picks, AI analysis, and optional newsletter delivery.',
    noindex: true,
  },
  '/auth/reset': {
    title: 'Reset Password',
    description: 'Set a new password for your TrueOddsIQ account.',
    noindex: true,
  },
  '/fantasy': {
    title: 'DFS Optimizer Preview',
    description: 'Sample DFS research experience with fictional demo data — not live salary or ownership feeds.',
    noindex: true,
  },
  '/unsubscribe': {
    title: 'Unsubscribe',
    description: 'Manage TrueOddsIQ newsletter subscription preferences.',
    noindex: true,
  },
}

export function getRouteMeta(pathname) {
  if (SEO_ROUTE_META[pathname]) {
    return { ...SEO_ROUTE_META[pathname], path: pathname }
  }
  if (ROUTE_META[pathname]) {
    return { ...ROUTE_META[pathname], path: pathname }
  }
  if (pathname.startsWith('/blog/')) {
    return {
      title: 'Blog Article',
      description: 'Sports betting research and product updates from TrueOddsIQ.',
      path: pathname,
    }
  }
  return {
    title: 'Page Not Found',
    description: 'The page you requested is not available on TrueOddsIQ.',
    path: pathname,
    noindex: true,
  }
}

export function buildCanonical(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (normalized === '/') return `${SITE_URL}/`
  return `${SITE_URL}${normalized}`
}
