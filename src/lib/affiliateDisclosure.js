import { isTrackedAffiliateLink, hasAnyTrackedAffiliateLinks } from './affiliateLinks'

export const AFFILIATE_DISCLOSURE_SHORT =
  '21+ · External sportsbook link. We may earn a commission on some books when affiliate tracking is enabled.'

export function getAffiliateDisclosureInline(bookKey) {
  if (bookKey && isTrackedAffiliateLink(bookKey)) {
    return 'Affiliate link — commission possible. Verify lines on the book before betting.'
  }
  if (hasAnyTrackedAffiliateLinks()) {
    return 'Opens sportsbook site. Verify lines before betting. (This book is not an affiliate link.)'
  }
  return 'Opens sportsbook site. Verify lines on the book before betting. (Non-affiliate link.)'
}

/** @deprecated Use getAffiliateDisclosureInline(bookKey) for per-book copy */
export const AFFILIATE_DISCLOSURE_INLINE =
  'Opens sportsbook site. Verify lines on the book before betting.'
