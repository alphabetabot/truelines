/**
 * SEO landing page copy and routing config.
 * Isolated from core app — safe to remove this folder + App route imports.
 */

export const SEO_SPORT_SLUGS = ['mlb', 'nba', 'nfl', 'nhl']

export const SEO_SPORTS = {
  mlb: {
    slug: 'mlb',
    label: 'MLB',
    sportKey: 'baseball_mlb',
    pickSport: 'MLB',
    color: 'var(--green)',
  },
  nba: {
    slug: 'nba',
    label: 'NBA',
    sportKey: 'basketball_nba',
    pickSport: 'NBA',
    color: 'var(--accent)',
  },
  nfl: {
    slug: 'nfl',
    label: 'NFL',
    sportKey: 'americanfootball_nfl',
    pickSport: 'NFL',
    color: '#7c3aed',
  },
  nhl: {
    slug: 'nhl',
    label: 'NHL',
    sportKey: 'icehockey_nhl',
    pickSport: 'NHL',
    color: '#6366f1',
  },
}

export const RESPONSIBLE_GAMBLING_SEO =
  'TrueOddsIQ provides odds comparison, AI-generated analysis, and pick tracking for informational and entertainment purposes only. No pick is guaranteed. Please bet responsibly.'

export function getSeoSport(slug) {
  return SEO_SPORTS[slug] || null
}

export function isValidSeoSportSlug(slug) {
  return SEO_SPORT_SLUGS.includes(slug)
}

/** Meta for getRouteMeta() integration */
export const SEO_ROUTE_META = {
  '/ai-sports-picks': {
    title: 'AI Sports Picks — Daily Analysis & Free Preview',
    description:
      'AI-assisted daily picks for MLB, NBA, and NHL with transparent tracking. Free top pick preview; full slate with Premium. Informational only.',
  },
  '/sportsbook-comparison': {
    title: 'Sportsbook Odds Comparison — 6 Books Side by Side',
    description:
      'Compare moneyline, spread, and total odds from DraftKings, FanDuel, BetMGM, Caesars, Pinnacle, and Bet365 in one view.',
  },
  ...Object.fromEntries(
    SEO_SPORT_SLUGS.flatMap(slug => {
      const s = SEO_SPORTS[slug]
      return [
        [`/odds/${slug}`, {
          title: `${s.label} Odds Comparison — Live Lines from 6 Sportsbooks`,
          description: `Compare live ${s.label} betting odds across major US sportsbooks. Moneyline, spread, and totals updated regularly. Informational use only.`,
        }],
        [`/picks/${slug}`, {
          title: `${s.label} AI Picks — Daily Analysis from Vega`,
          description: `See how TrueOddsIQ surfaces ${s.label} picks with AI analysis, odds context, and public performance tracking. Free preview available.`,
        }],
      ]
    })
  ),
}

export function getOddsSportFaqs(sport) {
  return [
    {
      question: `How does TrueOddsIQ compare ${sport.label} odds?`,
      answer: `We pull live ${sport.label} odds from six sportsbooks and highlight the best available prices on moneyline, spread, and total markets when data is available. Lines change quickly — always confirm on the book before betting.`,
    },
    {
      question: `Which sportsbooks are included for ${sport.label}?`,
      answer: 'DraftKings, FanDuel, BetMGM, Caesars, Pinnacle, and Bet365 when lines are available from our data provider.',
    },
    {
      question: 'Are these odds guaranteed at bet time?',
      answer: 'No. Odds move constantly. The preview on this page may not reflect the latest number. Use the live odds tool to refresh before placing a wager.',
    },
  ]
}

export function getPicksSportFaqs(sport) {
  return [
    {
      question: `Does TrueOddsIQ only pick ${sport.label} games?`,
      answer: `Our daily newsletter focuses on the best edges across MLB, NBA, and NHL when games are on the slate. ${sport.label} picks appear when they qualify — not every sport every day.`,
    },
    {
      question: 'Are AI picks guaranteed to win?',
      answer: 'No. All picks are informational. Past results are tracked publicly when graded, but future performance is never guaranteed.',
    },
    {
      question: 'How do I see the full daily pick slate?',
      answer: 'Subscribe to Premium to unlock all three daily picks on the AI Picks tab, plus unlimited AI analysis. Free accounts get one top pick in the morning newsletter, live odds tools, and the public tracker.',
    },
  ]
}

export const AI_PICKS_FAQS = [
  {
    question: 'What are AI sports picks on TrueOddsIQ?',
    answer: 'Each morning our pipeline reviews live odds and matchup data to surface a short list of bets. The homepage shows a free top pick preview; Premium subscribers get the full three-pick slate.',
  },
  {
    question: 'Is this a sportsbook?',
    answer: 'No. We do not accept wagers. We compare odds and publish analysis for entertainment and research.',
  },
  {
    question: 'Will premium picks be different?',
    answer: 'Premium (coming later) will add deeper injury, weather, and statistical breakdowns per matchup. The free tier remains odds comparison plus the daily newsletter picks.',
  },
]

export const SPORTSBOOK_FAQS = [
  {
    question: 'Why compare odds across sportsbooks?',
    answer: 'A half-point or a few cents on juice compounds over a season. Shopping lines is one of the few edges bettors control without predicting outcomes better.',
  },
  {
    question: 'Does TrueOddsIQ earn affiliate commission?',
    answer: 'VISIT links open each sportsbook website directly. We are not on an affiliate program today — links are for line shopping convenience only.',
  },
  {
    question: 'How often do odds update?',
    answer: 'Live odds pages refresh on a short interval when games are scheduled. SEO previews may lag — use /odds for the latest numbers.',
  },
]

export function getInternalLinks({ pageType, sportSlug }) {
  const sport = sportSlug ? SEO_SPORTS[sportSlug] : null
  const core = [
    { to: '/odds', label: 'Live odds (all sports)' },
    { to: '/picks', label: 'Today\'s AI picks' },
    { to: '/compare', label: 'Line compare tool' },
    { to: '/ai-sports-picks', label: 'AI sports picks guide' },
    { to: '/sportsbook-comparison', label: 'Sportsbook comparison' },
    { to: '/analysis', label: 'AI game analysis' },
    { to: '/blog', label: 'Betting guides blog' },
  ]

  const sportOdds = SEO_SPORT_SLUGS.map(s => ({
    to: `/odds/${s}`,
    label: `${SEO_SPORTS[s].label} odds`,
  }))
  const sportPicks = SEO_SPORT_SLUGS.map(s => ({
    to: `/picks/${s}`,
    label: `${SEO_SPORTS[s].label} AI picks`,
  }))

  if (pageType === 'odds-sport' && sport) {
    return [
      { to: `/odds`, label: 'Open live odds tool' },
      ...sportPicks,
      ...sportOdds.filter(l => !l.to.endsWith(sport.slug)),
      ...core.filter(l => !l.to.includes(`/${sport.slug}`)),
    ]
  }
  if (pageType === 'picks-sport' && sport) {
    return [
      { to: '/picks', label: 'View today\'s picks' },
      ...sportOdds,
      ...sportPicks.filter(l => !l.to.endsWith(sport.slug)),
      ...core,
    ]
  }
  if (pageType === 'ai-picks') {
    return [...sportPicks, ...sportOdds, ...core]
  }
  return [...sportPicks, ...sportOdds, ...core]
}
