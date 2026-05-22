/**
 * Quick self-check for pick-utils (run: node scripts/test-pick-utils.mjs)
 */
import {
  attachDraftKingsOdds,
  buildOddsByMatchup,
  preparePicksForStore,
  validatePickEdge,
} from '../api/pick-utils.js'

const games = [{
  sport: 'MLB',
  away: 'Pittsburgh Pirates',
  home: 'Colorado Rockies',
  bookmakers: [{
    key: 'draftkings',
    markets: [
      {
        key: 'h2h',
        outcomes: [
          { name: 'Pittsburgh Pirates', price: -145 },
          { name: 'Colorado Rockies', price: 125 },
        ],
      },
      {
        key: 'totals',
        outcomes: [
          { name: 'Over', price: -110, point: 8.5 },
          { name: 'Under', price: -110, point: 8.5 },
        ],
      },
    ],
  }],
}]

const oddsByMatchup = buildOddsByMatchup(games)
const pick = {
  game: 'Pittsburgh Pirates @ Colorado Rockies',
  pickSelection: 'Pirates ML',
  betType: 'Moneyline',
  odds: null,
  isFade: false,
  edge: 'Pirates are 12-4 in day games. Rockies bullpen ERA is 5.20 over the last two weeks per the stats provided.',
  confidence: 4,
}

const attached = attachDraftKingsOdds({ ...pick }, oddsByMatchup)
if (!attached || attached.odds !== -145) {
  console.error('FAIL: expected Pirates ML -145, got', attached)
  process.exit(1)
}

if (!validatePickEdge(attached)) {
  console.error('FAIL: edge validation')
  process.exit(1)
}

const prepared = preparePicksForStore([attached], oddsByMatchup)
if (prepared.length !== 1) {
  console.error('FAIL: preparePicksForStore')
  process.exit(1)
}

console.log('OK: pick-utils DK attach + edge validation')
