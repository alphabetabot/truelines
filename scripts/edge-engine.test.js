/**
 * Run: npm run test:edge-engine
 */
import { scoreGameEdge } from '../api/_edge-engine/index.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const game = {
  sport: 'MLB',
  away: 'Giants',
  home: 'Dodgers',
  venue: 'Dodger Stadium',
  bookmakers: [{ key: 'draftkings' }, { key: 'fanduel' }],
  stats: {
    awayPitcher: { era: '4.10', whip: '1.25', k9: '8.0' },
    homePitcher: { era: '2.95', whip: '1.05', k9: '10.1' },
    awayTeam: { wins: 30, losses: 30, runDiff: 0 },
    homeTeam: { wins: 40, losses: 20, runDiff: 40 },
  },
}

const scored = scoreGameEdge(game, {
  mlbAnalysis: {
    calculatedEdge: 6.2,
    modelWinProbability: 58,
    marketImpliedProbability: 52,
    confidenceScore: 74,
    dataQualityScore: 80,
  },
  tier: 'free',
})

assert(scored.edgeScore >= 0 && scored.edgeScore <= 100, 'edge score in range')
assert(scored.categories.market != null, 'market category scored')
assert(scored.keyReasons.length > 0, 'has key reasons')

console.log('edge-engine.test.js: all assertions passed')
