import assert from 'node:assert/strict'
import { getDraftKingsPickOptions } from '../src/lib/draftKingsOdds.js'
import { parlayHasSameGameLegs } from '../src/lib/parlayMath.js'

const sampleGame = {
  id: 'game-1',
  away_team: 'Yankees',
  home_team: 'Red Sox',
  bookmakers: [{
    key: 'draftkings',
    markets: [
      {
        key: 'h2h',
        outcomes: [
          { name: 'Yankees', price: 130 },
          { name: 'Red Sox', price: -150 },
        ],
      },
      {
        key: 'spreads',
        outcomes: [
          { name: 'Yankees', price: -110, point: 1.5 },
          { name: 'Red Sox', price: -110, point: -1.5 },
        ],
      },
      {
        key: 'totals',
        outcomes: [
          { name: 'Over', price: -105, point: 8.5 },
          { name: 'Under', price: -115, point: 8.5 },
        ],
      },
    ],
  }],
}

const options = getDraftKingsPickOptions(sampleGame)
assert.equal(options.length, 6, 'lists all DK ML, spread, and total options')
assert.ok(options.some(o => o.market === 'h2h' && o.american === 130))
assert.ok(options.some(o => o.market === 'totals' && o.pick === 'Over 8.5'))

assert.equal(parlayHasSameGameLegs([]), false)
assert.equal(parlayHasSameGameLegs([{ gameId: 'a' }, { gameId: 'b' }]), false)
assert.equal(parlayHasSameGameLegs([{ gameId: 'a' }, { gameId: 'a' }]), true)

console.log('draftkings-parlay.test.js: all passed')
