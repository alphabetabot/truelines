// Outbound sportsbook destinations. If affiliate tracking URLs are added here,
// keep the on-page and disclaimer disclosures in sync.

export const AFFILIATE_LINKS = {
  draftkings: 'https://www.draftkings.com',
  fanduel: 'https://www.fanduel.com',
  betmgm: 'https://www.betmgm.com',
  williamhill_us: 'https://www.caesars.com/sportsbook',
  pinnacle: 'https://www.pinnacle.com',
  bet365: 'https://www.bet365.com',
}

export const AFFILIATE_DISCLOSURE = 'Sportsbook links may earn us a commission. Odds rankings are not affected.'

export function getAffiliateLink(bookKey) {
  return AFFILIATE_LINKS[bookKey] || '#'
}
