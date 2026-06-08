/**
 * Run: npm run test:billing
 */
import {
  getStripeMode,
  getStripePriceId,
  isPremiumRow,
  isPremiumStatus,
  STRIPE_PRICE_IDS,
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

const prevKey = process.env.STRIPE_SECRET_KEY
const prevPrice = process.env.STRIPE_PRICE_ID
delete process.env.STRIPE_PRICE_ID
process.env.STRIPE_SECRET_KEY = 'sk_live_example'
assert(getStripeMode() === 'live', 'detects live mode')
assert(getStripePriceId() === STRIPE_PRICE_IDS.live, 'live key uses live price fallback')
process.env.STRIPE_SECRET_KEY = 'sk_test_example'
assert(getStripeMode() === 'test', 'detects test mode')
assert(getStripePriceId() === STRIPE_PRICE_IDS.test, 'test key uses test price fallback')
process.env.STRIPE_PRICE_ID = 'price_custom'
assert(getStripePriceId() === 'price_custom', 'explicit STRIPE_PRICE_ID wins')
if (prevKey !== undefined) process.env.STRIPE_SECRET_KEY = prevKey
else delete process.env.STRIPE_SECRET_KEY
if (prevPrice !== undefined) process.env.STRIPE_PRICE_ID = prevPrice
else delete process.env.STRIPE_PRICE_ID

console.log('billing-utils.test.js: all assertions passed')
