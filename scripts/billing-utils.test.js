/**
 * Run: npm run test:billing
 */
import {
  isPremiumRow,
  isPremiumStatus,
  subscriptionPayload,
} from '../api/billing-utils.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(isPremiumStatus('active'), 'active is premium')
assert(isPremiumStatus('trialing'), 'trialing is premium')
assert(!isPremiumStatus('canceled'), 'canceled is not premium')

const future = new Date(Date.now() + 86400000).toISOString()
assert(isPremiumRow({ status: 'active', current_period_end: future }), 'active future period is premium')
assert(!isPremiumRow({ status: 'active', current_period_end: '2020-01-01T00:00:00Z' }), 'expired period is not premium')
assert(!isPremiumRow(null), 'null row is not premium')

const payload = subscriptionPayload({ status: 'active', current_period_end: future, cancel_at_period_end: false })
assert(payload.isPremium, 'payload marks premium')
assert(payload.priceDisplay.includes('19.95'), 'payload includes price label')

console.log('billing-utils.test.js: all assertions passed')
