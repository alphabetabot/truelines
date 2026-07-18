/**
 * Run: npm run test:pick-metrics
 */
import {
  countBooksWithMarket,
  filterBettableGames,
  hasActionableOdds,
  resolvePicksForPublish,
  scoreGameDataQuality,
  selectPublishablePicks,
  validatePicksAgainstSlate,
  mlbRecommendationAllowed,
} from '../api/_pick-metrics.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const sampleBookmakers = [
  {
    key: 'draftkings',
    markets: [
      { key: 'h2h', outcomes: [{ name: 'Team A', price: -110 }, { name: 'Team B', price: 100 }] },
      { key: 'totals', outcomes: [{ name: 'Over', price: -105, point: 8.5 }, { name: 'Under', price: -115, point: 8.5 }] },
    ],
  },
  {
    key: 'fanduel',
    markets: [
      { key: 'h2h', outcomes: [{ name: 'Team A', price: -108 }, { name: 'Team B', price: 102 }] },
    ],
  },
]

const richMlbGame = {
  sport: 'MLB',
  away: 'Team A',
  home: 'Team B',
  bookmakers: sampleBookmakers,
  stats: {
    awayPitcher: { era: '3.20', whip: '1.10', k9: '9.1' },
    homePitcher: { era: '4.50', whip: '1.35', k9: '7.2' },
    awayTeam: { wins: 30, losses: 20, runDiff: 15 },
    homeTeam: { wins: 22, losses: 28, runDiff: -10 },
  },
  weather: { temp: '72' },
  venue: 'Coors Field',
  bestOdds: {
    awayML: { book: 'DraftKings', price: -108 },
    homeML: { book: 'FanDuel', price: 102 },
  },
}

const betPick = {
  game: 'Team A @ Team B',
  pickSelection: 'Team A ML',
  bet: 'ML at -108 via DraftKings',
  odds: -108,
  confidence: 5,
  recommendation: 'BET',
  pickMeta: {
    recommendation: 'BET',
    calculated_edge: 6.4,
    model_probability: 58.2,
    data_quality_score: 80,
    confidence_score: 74,
  },
  edge: 'Model 58.2% vs market 51.8% on Team A (+6.4 pt edge). Team A starter at 3.20 ERA vs 4.50 ERA opponent. Run differential +15 vs -10.',
}

assert(countBooksWithMarket(richMlbGame, 'h2h') === 2, 'should count h2h books')
assert(hasActionableOdds(richMlbGame), 'rich game has actionable odds')
assert(!hasActionableOdds({ sport: 'MLB', away: 'A', home: 'B' }), 'no books fails')

const filtered = filterBettableGames([
  richMlbGame,
  { sport: 'NBA', away: 'X', home: 'Y' },
])
assert(filtered.length === 1, 'filter keeps bettable only')
assert(scoreGameDataQuality(richMlbGame) > scoreGameDataQuality({ sport: 'NBA', away: 'X', home: 'B', bookmakers: sampleBookmakers }), 'MLB rich scores higher')

const slate = [{
  sport: 'MLB',
  away: 'Team A',
  home: 'Team B',
  bookmakers: richMlbGame.bookmakers,
  weather: richMlbGame.weather,
  venue: richMlbGame.venue,
  bestOdds: richMlbGame.bestOdds,
  stats: richMlbGame.stats,
}]

const validation = validatePicksAgainstSlate([
  betPick,
  {
    game: 'Fake @ Game',
    pickSelection: 'Fake ML',
    bet: 'ML at +200 via DraftKings',
    odds: 200,
  },
], slate)

assert(validation.picks.length === 1, 'drops unknown matchup')
assert(validation.warnings.some(w => w.includes('No slate match')), 'warns on orphan pick')

const publishable = selectPublishablePicks([
  betPick,
  {
    ...betPick,
    odds: -250,
    bet: 'ML at -250 via DraftKings',
    pickMeta: { ...betPick.pickMeta, calculated_edge: 3.1 },
    edge: 'Short edge.',
  },
  {
    ...betPick,
    recommendation: 'LEAN',
    pickMeta: { ...betPick.pickMeta, recommendation: 'LEAN' },
  },
], slate)

assert(publishable.picks.length === 1, 'keeps only strict BET pick')
assert(publishable.warnings.some(w => /Rejected/.test(w)), 'explains rejections')

const noFallback = resolvePicksForPublish([
  {
    ...betPick,
    confidence: 3,
    edge: 'Thin edge with 3.20 ERA vs 4.50 and run diff +15 vs -10 but below confidence gate.',
  },
], slate)

assert(noFallback.picks.length === 0, 'no validated fallback when strict gates block')
assert(noFallback.tier === 'none', 'returns none tier')

const engineResolved = resolvePicksForPublish([], slate, { enginePicks: [betPick] })
assert(engineResolved.picks.length === 1, 'uses engine BET picks when extracted empty')
assert(engineResolved.tier === 'partial', 'partial tier when one premium pick')

const leanPick = {
  ...betPick,
  game: 'Colorado Rockies @ Los Angeles Dodgers',
  pickSelection: 'Rockies ML',
  bet: 'ML at +120 via DraftKings',
  odds: 120,
  recommendation: 'LEAN',
  pickMeta: {
    recommendation: 'LEAN',
    calculated_edge: 4.2,
    data_quality_score: 70,
    confidence_score: 65,
  },
  edge: 'Model 52.1% vs market 48.3% on Rockies (+4.2 pt lean). Rockies starter at 3.10 ERA vs 4.20 ERA opponent. Run differential +8 vs -5.',
}

const slateTwo = [
  ...slate,
  {
    sport: 'MLB',
    away: 'Colorado Rockies',
    home: 'Los Angeles Dodgers',
    bookmakers: sampleBookmakers,
    weather: { temp: '68' },
    venue: 'Petco Park',
    bestOdds: {
      awayML: { book: 'DraftKings', price: 120 },
      homeML: { book: 'FanDuel', price: -140 },
    },
    stats: {
      awayPitcher: { era: '3.10', whip: '1.05', k9: '9.5' },
      homePitcher: { era: '4.20', whip: '1.30', k9: '7.8' },
      awayTeam: { wins: 28, losses: 22, runDiff: 8 },
      homeTeam: { wins: 20, losses: 30, runDiff: -5 },
    },
  },
]

const twoPickSlate = resolvePicksForPublish([betPick], slateTwo, { enginePicks: [leanPick] })
assert(twoPickSlate.picks.length === 1, 'LEAN slot disabled — only strict BET picks publish')
assert(twoPickSlate.tier === 'partial', 'partial tier when only one BET clears juice gates')

assert(mlbRecommendationAllowed('BET'), 'BET allowed')
assert(!mlbRecommendationAllowed('LEAN', 0), 'LEAN blocked for newsletter slot')
assert(!mlbRecommendationAllowed('LEAN', 1), 'LEAN slot disabled in BET-only mode')
assert(!mlbRecommendationAllowed('PASS'), 'PASS blocked')

console.log('pick-metrics.test.js: all assertions passed')
