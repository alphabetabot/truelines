// Outbound links to sportsbook websites (not affiliate — we do not earn commission today).
// If a book approves you later, set VITE_AFFILIATE_* in Vercel to override the URL only.

import { trackEvent } from './analytics.js'

const SPORTSBOOK_URLS = {
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

function envOverrideUrl(bookKey) {
  const envName = ENV_BY_BOOK[bookKey]
  if (!envName) return ''
  const value = import.meta.env[envName]
  return typeof value === 'string' ? value.trim() : ''
}

/** @deprecated Use getSportsbookLink — kept for existing imports */
export function getAffiliateLink(bookKey) {
  return getSportsbookLink(bookKey)
}

export function getSportsbookLink(bookKey) {
  const override = envOverrideUrl(bookKey)
  if (override) return override
  return SPORTSBOOK_URLS[bookKey] || '#'
}

export function getSportsbookLinkRel() {
  return 'noopener noreferrer'
}

/** @deprecated */
export function getAffiliateLinkRel() {
  return getSportsbookLinkRel()
}

export function isTrackedAffiliateLink() {
  return false
}

export function hasAnyTrackedAffiliateLinks() {
  return false
}

export function trackSportsbookClick(bookKey, context = 'unknown') {
  trackEvent('sportsbook_click', { book: bookKey, context })
}

/** @deprecated */
export function trackAffiliateClick(bookKey, context) {
  trackSportsbookClick(bookKey, context)
}
