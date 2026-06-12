/**
 * Run: node scripts/admin-utils.test.js
 */
import { isAdminEmail, isAdminUser } from '../api/_admin-utils.js'
import { subscriptionPayload } from '../api/_billing-utils.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const prevOwner = process.env.OWNER_EMAIL
const prevAdmins = process.env.ADMIN_EMAILS
process.env.OWNER_EMAIL = 'Owner@Example.com'
delete process.env.ADMIN_EMAILS

assert(isAdminEmail('owner@example.com'), 'owner email matches case-insensitively')
assert(!isAdminEmail('other@example.com'), 'other email is not admin')
assert(isAdminUser({ email: 'owner@example.com' }), 'admin user detected')

const payload = subscriptionPayload(null, { user: { email: 'owner@example.com' } })
assert(payload.isPremium, 'admin gets premium')
assert(payload.isAdmin, 'admin flag set')
assert(payload.status === 'admin', 'admin status')

process.env.ADMIN_EMAILS = 'a@b.com,c@d.com'
delete process.env.OWNER_EMAIL
assert(isAdminEmail('c@d.com'), 'ADMIN_EMAILS list works')

if (prevOwner !== undefined) process.env.OWNER_EMAIL = prevOwner
else delete process.env.OWNER_EMAIL
if (prevAdmins !== undefined) process.env.ADMIN_EMAILS = prevAdmins
else delete process.env.ADMIN_EMAILS

console.log('admin-utils.test.js: all assertions passed')
