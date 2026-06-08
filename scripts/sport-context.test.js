/**
 * Run: npm run test:sport-context
 */
import {
  applySportContext,
  formatMlbWeatherReport,
  formatNbaStandingLine,
  teamNameMatches,
} from '../api/sport-context.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(teamNameMatches('Boston Celtics', 'Boston Celtics'), 'exact team match')
assert(teamNameMatches('LA Lakers', 'Los Angeles Lakers'), 'partial team match')
assert(!teamNameMatches('Yankees', 'Red Sox'), 'different teams')

const weather = formatMlbWeatherReport({ temp: '72', condition: 'Cloudy', wind: '8 mph out to CF' })
assert(weather.includes('72'), 'weather includes temp')
assert(weather.includes('Cloudy'), 'weather includes condition')

const nbaLine = formatNbaStandingLine('Celtics', {
  record: '60-22',
  ppg: '117.8',
  oppPpg: '109.6',
  home: '31-9',
  road: '28-13',
  lastTen: '8-2',
  streak: 'W3',
})
assert(nbaLine.includes('PPG 117.8'), 'nba standing includes ppg')
assert(nbaLine.includes('Home 31-9'), 'nba standing includes home')

const bundle = {
  injuries: {
    MLB: { 'Boston Red Sox': [{ player: 'Player A', status: 'Out', note: 'hamstring' }] },
    NBA: { 'Boston Celtics': [{ player: 'Star', status: 'Questionable', note: 'ankle' }] },
    NHL: {},
  },
  standings: {
    NBA: { 'Boston Celtics': { record: '60-22', ppg: '117.8', oppPpg: '109.6' } },
    NHL: {},
  },
  nhlProbables: {},
}

const enriched = applySportContext(
  { sport: 'NBA', away: 'Boston Celtics', home: 'New York Knicks', stats: {} },
  bundle
)
assert(enriched.awayStanding?.record === '60-22', 'nba away standing attached')
assert(enriched.awayInjuries?.length === 1, 'nba away injuries attached')

console.log('sport-context.test.js: all assertions passed')
