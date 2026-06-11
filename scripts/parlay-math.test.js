import assert from 'node:assert/strict'
import {
  americanToDecimal,
  combineParlayAmericanOdds,
  parlayPayout,
} from '../src/lib/parlayMath.js'

assert.equal(americanToDecimal(-110).toFixed(3), '1.909')
assert.equal(americanToDecimal(150).toFixed(2), '2.50')

const twoLeg = combineParlayAmericanOdds([-110, -110])
assert.ok(twoLeg > 200, `expected positive parlay odds, got ${twoLeg}`)

const payout = parlayPayout(10, [-110, -110])
assert.ok(payout > 10, 'payout should exceed stake')

console.log('parlay-math.test.js: all passed')
