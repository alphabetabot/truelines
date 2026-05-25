// Replace placeholder URLs with approved affiliate tracking links before paid marketing.
// Until then, outbound links go to the sportsbook homepage (disclosed in UI).

export const AFFILIATE_LINKS = {
  draftkings: 'https://www.draftkings.com',       // Replace with your DraftKings affiliate link
  fanduel: 'https://www.fanduel.com',             // Replace with your FanDuel affiliate link
  betmgm: 'https://www.betmgm.com',               // Replace with your BetMGM affiliate link
  williamhill_us: 'https://www.caesars.com/sportsbook', // Replace with your Caesars affiliate link
  pinnacle: 'https://www.pinnacle.com',           // Replace with your Pinnacle affiliate link
  bet365: 'https://www.bet365.com',               // Replace with your Bet365 affiliate link
}

export function getAffiliateLink(bookKey) {
  return AFFILIATE_LINKS[bookKey] || '#'
}
