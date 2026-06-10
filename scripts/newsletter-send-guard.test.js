import assert from 'node:assert/strict'
import { isStaleNewsletterClaim, STALE_NEWSLETTER_CLAIM_MS } from '../api/newsletter-send-guard.js'

const now = Date.parse('2026-06-10T14:30:00.000Z')

assert.equal(
  isStaleNewsletterClaim({ started_at: '2026-06-10T14:00:00.000Z', sent_at: null }, now),
  true,
  'claim older than 15 minutes without sent_at is stale'
)

assert.equal(
  isStaleNewsletterClaim({ started_at: '2026-06-10T14:20:00.000Z', sent_at: null }, now),
  false,
  'recent in-progress claim is not stale'
)

assert.equal(
  isStaleNewsletterClaim({ started_at: '2026-06-10T14:00:00.000Z', sent_at: '2026-06-10T14:05:00.000Z' }, now),
  false,
  'completed send is never stale'
)

assert.equal(STALE_NEWSLETTER_CLAIM_MS, 15 * 60 * 1000)

console.log('newsletter-send-guard.test.js: all passed')
