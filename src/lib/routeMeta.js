import { SEO_ROUTE_META } from '../seo/seoContent.js'

const SITE_URL = 'https://trueoddsiq.com'

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.svg`

/** Static route metadata for CSR pages. Blog posts override in Blog.jsx. */
export const ROUTE_META = {
  '/': {
    title: 'Daily AI Picks & Live Odds Comparison',
    description:
      'Vega\'s daily top pick, public track record, and live odds from six sportsbooks. Compare free vs Premium and sign up in minutes.',
  },
  '/plans': {
    title: 'Compare Free vs Premium',
    description:
      'Free account: morning newsletter with one top pick, live odds, and public tracker. Premium: full three-pick slate and unlimited AI analysis.',
  },
  '/odds': {
    title: 'Live Sports Betting Odds Comparison',
    description:
      'Compare current odds from six major sportsbooks in real time. MLB, NBA, and NHL with live scores.',
  },
  '/welcome': {
    title: 'Welcome — Graded Picks & Live Odds',
    description:
      'Public track record, daily newsletter, and live odds from six sportsbooks. Compare free vs Premium plans.',
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
  '/parlay': {
    title: 'AI Parlay Builder',
    description: 'Choose sport and leg count — Vega suggests a parlay from today\'s odds slate. Free account required. Illustrative only.',
  },
  '/analysis': {
    title: 'AI Game Analysis',
    description: 'Run Claude and ChatGPT analysis on live odds snapshots. MLB includes probable pitcher context when available.',
  },
  '/picks': {
    title: 'Daily AI Picks',
    description: 'Full daily pick card with write-ups for every pick. Premium subscription required — free newsletter is one top pick per morning.',
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
    description: 'Free account for odds, newsletter, and tracker. Premium unlocks AI Picks and AI Analysis.',
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
