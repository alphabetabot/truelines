/**
 * Run: npm run test:grading
 */
import {
  findGameForPick,
  findGameForPickWithDateFallback,
  gradePickResult,
  resolvePickGrade,
  resolvePickSport,
  stripAmericanOddsFromText,
} from '../api/pick-utils.js'

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

const seriesBraves = [
  {
    game_date: '2026-05-30',
    pacific_date: '2026-05-30',
    away_team: 'Atlanta Braves',
    home_team: 'Cincinnati Reds',
    away_score: 5,
    home_score: 3,
    sport: 'MLB',
  },
  {
    game_date: '2026-05-31',
    pacific_date: '2026-05-31',
    away_team: 'Atlanta Braves',
    home_team: 'Cincinnati Reds',
    away_score: 2,
    home_score: 4,
    sport: 'MLB',
  },
]
const may31Braves = findGameForPickWithDateFallback(
  'Atlanta Braves @ Cincinnati Reds',
  seriesBraves,
  '2026-05-31'
)
assert(may31Braves?.pacific_date === '2026-05-31', 'May 31 pick uses May 31 final, not series game from May 30')
assert(
  gradePickResult({
    pickText: 'Atlanta Braves ML',
    betType: 'ML',
    pickGame: 'Atlanta Braves @ Cincinnati Reds',
    game: may31Braves,
  }) === 'L',
  'Braves lost May 31'
)

const tzGames = [
  {
    game_date: '2026-05-30',
    pacific_date: '2026-05-30',
    away_team: 'Miami Marlins',
    home_team: 'New York Mets',
    away_score: 7,
    home_score: 9,
    sport: 'MLB',
  },
]
const noWrongDayFallback = findGameForPickWithDateFallback(pickGame, tzGames, '2026-05-29')
assert(noWrongDayFallback === null, 'do not grade against previous day in a series')

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
  { resolveOdds: p => p.odds }
)
assert(resolved.result === 'L', 'resolvePickGrade should correct stored W to L')

assert(
  resolvePickSport({
    sport: 'Mixed',
    pick: 'Seattle Mariners @ Kansas City Royals',
    game: '**Seattle Mariners @ Kansas City Royals**',
  }) === 'MLB',
  'Mixed sport label should resolve to MLB'
)

console.log('pick-grading.test.js: all assertions passed')
