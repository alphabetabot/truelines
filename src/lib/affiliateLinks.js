// Set VITE_AFFILIATE_* in Vercel when approved programs go live.
// Until then, links open sportsbook homepages without sponsored/commission labeling.

import { trackEvent } from './analytics.js'

const DEFAULT_LINKS = {
  draftkings: 'https://www.draftkings.com',
  fanduel: 'https://www.fanduel.com',
  betmgm: 'https://www.betmgm.com',
  williamhill_us: 'https://www.caesars.com/sportsbook',
  pinnacle: 'https://www.pinnacle.com',
  bet365: 'https://www.bet365.com',
}

const ENV_BY_BOOK = {
  draftkings: 'VITE_AFFILIATE_DRAFTKINGS',
  fanduel: 'VITE_AFFILIATE_FANDUEL',
  betmgm: 'VITE_AFFILIATE_BETMGM',
  williamhill_us: 'VITE_AFFILIATE_CAESARS',
  pinnacle: 'VITE_AFFILIATE_PINNACLE',
  bet365: 'VITE_AFFILIATE_BET365',
}

function envAffiliateUrl(bookKey) {
  const envName = ENV_BY_BOOK[bookKey]
  if (!envName) return ''
  const value = import.meta.env[envName]
  return typeof value === 'string' ? value.trim() : ''
}

export function isTrackedAffiliateLink(bookKey) {
  return Boolean(envAffiliateUrl(bookKey))
}

export function hasAnyTrackedAffiliateLinks() {
  return Object.keys(ENV_BY_BOOK).some(isTrackedAffiliateLink)
}

export function getAffiliateLink(bookKey) {
  const tracked = envAffiliateUrl(bookKey)
  if (tracked) return tracked
  return DEFAULT_LINKS[bookKey] || '#'
}

export function getAffiliateLinkRel(bookKey) {
  return isTrackedAffiliateLink(bookKey)
    ? 'noopener noreferrer sponsored'
    : 'noopener noreferrer'
}

export function trackAffiliateClick(bookKey, context = 'unknown') {
  trackEvent('affiliate_click', {
    book: bookKey,
    context,
    tracked: isTrackedAffiliateLink(bookKey),
  })
}
