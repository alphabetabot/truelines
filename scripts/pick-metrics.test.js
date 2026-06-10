/**
 * Run: npm run test:pick-metrics
 */
import {
  countBooksWithMarket,
  filterBettableGames,
  hasActionableOdds,
  scoreGameDataQuality,
  validatePicksAgainstSlate,
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
  bestOdds: richMlbGame.bestOdds,
  stats: richMlbGame.stats,
}]

const validation = validatePicksAgainstSlate([
  {
    game: 'Team A @ Team B',
    pickSelection: 'Team A ML',
    bet: 'ML at -108 via DraftKings',
    odds: -108,
  },
  {
    game: 'Fake @ Game',
    pickSelection: 'Fake ML',
    bet: 'ML at +200 via DraftKings',
    odds: 200,
  },
], slate)

assert(validation.picks.length === 1, 'drops unknown matchup')
assert(validation.warnings.some(w => w.includes('No slate match')), 'warns on orphan pick')

console.log('pick-metrics.test.js: all assertions passed')
