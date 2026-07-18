/**
 * Run: node scripts/pick-economics.test.js
 */
import {
  breakevenWinProbability,
  expectedUnits,
  oddsBucket,
  passesUnitEconomicsGate,
} from '../api/_pick-economics.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(Math.abs(breakevenWinProbability(-150) - 0.6) < 0.001, '-150 breakeven is 60%')
assert(Math.abs(breakevenWinProbability(+150) - 0.4) < 0.001, '+150 breakeven is 40%')

const chalkEv = expectedUnits(-150, 0.58)
assert(chalkEv < 0, '58% model at -150 is negative EV')

const dogEv = expectedUnits(+130, 0.48)
assert(dogEv > 0, '48% model at +130 can be positive EV')

assert(passesUnitEconomicsGate(-150, { model_probability: 63, calculated_edge: 6 }), 'strong chalk model passes')
assert(!passesUnitEconomicsGate(-150, { model_probability: 58, calculated_edge: 5 }), 'weak chalk model fails')

assert(oddsBucket(120) === 'dog', 'plus money bucket')
assert(oddsBucket(-140) === 'chalk', 'chalk bucket')

console.log('pick-economics.test.js: all assertions passed')
