/**
 * Run: npm run test:notification-templates
 */
import {
  buildFreePickNotificationEmail,
  buildPremiumPickNotificationEmail,
  buildNoFreePickEmail,
} from '../api/_notifications/templates.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const free = buildFreePickNotificationEmail({})
assert(free.subject.includes('Free Pick'), 'free subject')
assert(!free.html.includes('ML at'), 'free email hides pick')
assert(free.html.includes('View Today'), 'free CTA')

const premium = buildPremiumPickNotificationEmail({ pickNumber: 2 })
assert(premium.subject.includes('Premium'), 'premium subject')
assert(!premium.text.match(/Team [A-Z]/), 'premium email hides team pick')

const noPick = buildNoFreePickEmail({})
assert(noPick.subject.includes('AI Update'), 'no pick subject')
assert(noPick.text.includes('discipline'), 'no pick body')

console.log('notification-templates.test.js: all assertions passed')
