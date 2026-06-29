/**
 * Run: npm run test:mlb-engine
 */
import {
  americanToImpliedProbability,
  removeVig,
  getMarketMoneylineSnapshot,
  scorePitcher,
  analyzeMlbGame,
  selectMlbEnginePicks,
  engineAnalysisToPick,
} from '../api/_mlb-engine/index.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(Math.abs(americanToImpliedProbability(-110) - 0.5238) < 0.01, 'favorite implied prob')
assert(Math.abs(americanToImpliedProbability(150) - 0.4) < 0.01, 'dog implied prob')

const vig = removeVig(0.55, 0.55)
assert(vig.vigRemoved === true, 'removes vig')
assert(Math.abs(vig.away + vig.home - 1) < 0.0001, 'fair probs sum to 1')

const books = [
  {
    key: 'draftkings',
    markets: [{ key: 'h2h', outcomes: [{ name: 'Dodgers', price: -140 }, { name: 'Giants', price: 120 }] }],
  },
  {
    key: 'fanduel',
    markets: [{ key: 'h2h', outcomes: [{ name: 'Dodgers', price: -135 }, { name: 'Giants', price: 115 }] }],
  },
]

const snapshot = getMarketMoneylineSnapshot({ away: 'Giants', home: 'Dodgers', bookmakers: books })
assert(snapshot.homeOdds === -135, 'best home price')
assert(snapshot.awayOdds === 120, 'best away price')

const pitcherScore = scorePitcher({ era: '3.10', whip: '1.05', k9: '9.5', hr9: '0.9', bb9: '2.4', ip: 45 })
assert(pitcherScore >= 55, 'good pitcher scores high')

const richGame = {
  sport: 'MLB',
  away: 'Giants',
  home: 'Dodgers',
  venue: 'Dodger Stadium',
  awayPitcher: 'Logan Webb',
  homePitcher: 'Yoshinobu Yamamoto',
  weather: { temp: '68', wind: 'blowing in from left' },
  bookmakers: books,
  stats: {
    awayPitcher: { era: '4.20', whip: '1.28', k9: '8.1', hr9: '1.2', bb9: '3.0', ip: 42, gamesStarted: 8 },
    homePitcher: { era: '2.90', whip: '1.02', k9: '10.2', hr9: '0.8', bb9: '2.1', ip: 48, gamesStarted: 9 },
    awayTeam: { wins: 28, losses: 32, runDiff: -12 },
    homeTeam: { wins: 38, losses: 22, runDiff: 45 },
    weatherReport: '68°F, wind blowing in from left',
    awayInjuries: [{ player: 'Player A', status: 'Out' }],
    homeInjuries: [],
  },
  bestOdds: {
    awayML: { book: 'DraftKings', price: 120 },
    homeML: { book: 'FanDuel', price: -135 },
  },
}

const analysis = analyzeMlbGame(richGame)
assert(['BET', 'LEAN', 'PASS', 'AVOID'].includes(analysis.recommendation), 'valid recommendation')
assert(analysis.marketImpliedProbability != null, 'market implied set')
assert(analysis.modelWinProbability != null, 'model prob set')
assert(analysis.topReasons.length === 3, 'three reasons')

const picks = selectMlbEnginePicks([{ game: richGame, analysis }])
const stored = picks.length ? engineAnalysisToPick(picks[0]) : null
if (stored) {
  assert(stored.pickMeta.calculated_edge != null, 'stores edge meta')
  assert(stored.recommendation === picks[0].recommendation, 'stores recommendation')
}

const noOdds = analyzeMlbGame({ sport: 'MLB', away: 'A', home: 'B' })
assert(noOdds.recommendation === 'AVOID', 'no odds => AVOID')

console.log('mlb-engine.test.js: all assertions passed')
