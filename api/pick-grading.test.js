/**
 * Run: node api/pick-grading.test.js
 */
import {
  findGameForPick,
  findGameForPickWithDateFallback,
  gradePickResult,
  resolvePickGrade,
  stripAmericanOddsFromText,
} from './pick-utils.js'
import { addDays } from './grading-scores.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const marlinsMetsSeries = [
  {
    game_date: '2026-05-22',
    away_team: 'New York Mets',
    home_team: 'Miami Marlins',
    away_score: 1,
    home_score: 2,
    sport: 'MLB',
  },
  {
    game_date: '2026-05-29',
    away_team: 'Miami Marlins',
    home_team: 'New York Mets',
    away_score: 7,
    home_score: 9,
    sport: 'MLB',
  },
]

const pickGame = 'Miami Marlins @ New York Mets'
const pickText = 'Miami Marlins ML ML · +103 · DraftKings'

const wrongGame = findGameForPick(pickGame, marlinsMetsSeries, null)
assert(wrongGame === null, 'ambiguous series without date should not match')

const datedGame = findGameForPick(pickGame, marlinsMetsSeries, '2026-05-29')
assert(datedGame?.game_date === '2026-05-29', 'should match game on pick date')

const wrongDayGrade = gradePickResult({
  pickText,
  betType: 'ML',
  pickGame,
  game: marlinsMetsSeries[0],
})
assert(wrongDayGrade === 'W', 'May 22 game: Marlins won at home')

const correctGrade = gradePickResult({
  pickText,
  betType: 'ML',
  pickGame,
  game: datedGame,
})
assert(correctGrade === 'L', 'May 29 game: Marlins lost on the road')

const oddsSpreadTrap = gradePickResult({
  pickText: 'Miami Marlins +103',
  betType: 'Pick',
  pickGame,
  game: datedGame,
})
assert(oddsSpreadTrap === 'L', 'team + american odds should grade as ML loss, not spread win')

assert(
  stripAmericanOddsFromText('Marlins ML +103').includes('Marlins'),
  'strip odds keeps team text'
)

const tzGames = [
  {
    game_date: '2026-05-30',
    away_team: 'Miami Marlins',
    home_team: 'New York Mets',
    away_score: 7,
    home_score: 9,
    sport: 'MLB',
  },
]
const fallback = findGameForPickWithDateFallback(pickGame, tzGames, '2026-05-29', addDays)
assert(fallback?.game_date === '2026-05-30', '±1 day fallback when slate date differs')

const resolved = resolvePickGrade(
  {
    pick: 'Miami Marlins ML',
    bet: 'ML · +103',
    bet_type: 'ML',
    game: pickGame,
    date: '2026-05-29',
    sport: 'MLB',
    result: 'W',
    odds: 103,
  },
  marlinsMetsSeries,
  { addDaysFn: addDays, resolveOdds: p => p.odds }
)
assert(resolved.result === 'L', 'resolvePickGrade should correct stored W to L')

console.log('pick-grading.test.js: all assertions passed')
