import assert from 'node:assert/strict'
import {
  isUsableTopPickText,
  resolveTopPickText,
} from '../api/_newsletter-deliver.js'
import { shouldRecoverEmailDelivery } from '../api/_newsletter-recovery.js'
import { isStaleNewsletterClaim } from '../api/_newsletter-send-guard.js'

const now = Date.now()
const staleRow = {
  started_at: new Date(now - 20 * 60 * 1000).toISOString(),
  sent_at: null,
}
assert.equal(isStaleNewsletterClaim(staleRow, now), true)

assert.equal(
  shouldRecoverEmailDelivery(staleRow, { emailsOnly: false, catchupSend: false, forceSend: false }),
  true,
  'stale in-progress row should auto-recover emails',
)

assert.equal(
  shouldRecoverEmailDelivery(staleRow, { emailsOnly: true, catchupSend: true, forceSend: false }),
  true,
  'catchup should recover stale sends',
)

const inProgress = {
  started_at: new Date(now - 5 * 60 * 1000).toISOString(),
  sent_at: null,
}
assert.equal(
  shouldRecoverEmailDelivery(inProgress, { emailsOnly: true, catchupSend: true, forceSend: false }),
  false,
  'catchup should wait while main send is still in progress',
)

const sentRow = {
  started_at: '2026-06-14T14:00:00.000Z',
  sent_at: '2026-06-14T14:05:00.000Z',
  subscriber_count: 12,
}
assert.equal(
  shouldRecoverEmailDelivery(sentRow, { emailsOnly: true, catchupSend: false, forceSend: false }),
  false,
  'completed send should not resend without force',
)
assert.equal(
  shouldRecoverEmailDelivery(sentRow, { emailsOnly: true, catchupSend: false, forceSend: true }),
  true,
  'force emailsOnly can resend after completion',
)

const preamble = `# VEGA'S PICKS | Saturday, June 13, 2026`
const full = `${preamble}

TOP PICK OF THE DAY
Pirates @ Marlins
**MLB Pick: Pirates ML**
- Bet: ML at -151 via Pinnacle
- Confidence: ★★★★☆
- Edge: Road starter mismatch.`

assert.equal(isUsableTopPickText(preamble), false)
assert.ok(resolveTopPickText(full, null).includes('Pirates ML'))

console.log('newsletter-recovery.test.js: all passed')
