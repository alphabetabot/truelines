/**
 * Run: node scripts/game-filters.test.js
 */
import {
  filterUpcomingGames,
  formatGameOptionLabel,
  isUpcomingGame,
} from '../src/lib/gameFilters.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const future = new Date(Date.now() + 3600000).toISOString()
const past = new Date(Date.now() - 3600000).toISOString()

assert(isUpcomingGame({ commenceTime: future }), 'future game is upcoming')
assert(!isUpcomingGame({ commenceTime: past }), 'past game is not upcoming')

const filtered = filterUpcomingGames([
  { id: '1', commenceTime: future, away: 'A', home: 'B' },
  { id: '2', commenceTime: past, away: 'C', home: 'D' },
])
assert(filtered.length === 1 && filtered[0].id === '1', 'filter keeps upcoming only')

const label = formatGameOptionLabel({ away: 'Yankees', home: 'Red Sox', commenceTime: future })
assert(label.includes('Yankees @ Red Sox'), 'label includes matchup')

console.log('game-filters.test.js: all assertions passed')
