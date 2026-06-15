/**
 * Run: node src/lib/gameFilters.test.js
 */
import {
  formatOddsApiTimestamp,
  getAnalysisWindow,
} from './gameFilters.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const sample = new Date('2026-06-15T18:15:30.932Z')
assert(formatOddsApiTimestamp(sample) === '2026-06-15T18:15:30Z', 'strips milliseconds')
assert(!formatOddsApiTimestamp(sample).includes('.'), 'no decimal in timestamp')

const window = getAnalysisWindow(new Date('2026-06-15T12:00:00.000Z'))
assert(window.commenceTimeFrom === '2026-06-15T12:00:00Z', 'window from is valid')
assert(window.commenceTimeTo === '2026-06-22T12:00:00Z', 'window to is +7 days')
assert(!window.commenceTimeFrom.includes('.'), 'window from has no ms')

console.log('gameFilters.test.js: all assertions passed')
