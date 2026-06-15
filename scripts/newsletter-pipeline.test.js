import assert from 'node:assert/strict'
import {
  PIPELINE,
  getPipelinePhase,
  isPipelineStatus,
} from '../api/_newsletter-send-guard.js'
import { resolveNewsletterStep } from '../api/_newsletter-pipeline.js'

assert.equal(getPipelinePhase(null), 'not_started')

assert.equal(
  getPipelinePhase({ sent_at: '2026-06-10T14:05:00Z', subscriber_count: 7, cron_schedule: PIPELINE.SOCIAL_DONE }),
  'sent',
)

assert.equal(
  getPipelinePhase({ cron_schedule: PIPELINE.PICKS_READY, picks_text: 'TOP PICK...' }),
  'picks_ready',
)

assert.equal(
  getPipelinePhase({ subscriber_count: -1, cron_schedule: PIPELINE.GENERATE_FAILED }),
  'generate_failed',
)

assert.equal(
  getPipelinePhase({ subscriber_count: -1, cron_schedule: PIPELINE.SEND_FAILED }),
  'send_failed',
)

assert.equal(isPipelineStatus(PIPELINE.GENERATING), true)
assert.equal(isPipelineStatus('0 14 * * *'), false)

assert.equal(resolveNewsletterStep({ query: { step: 'generate' } }), 'generate')
assert.equal(resolveNewsletterStep({ query: { catchup: 'true' } }), 'send')
assert.equal(resolveNewsletterStep({ query: {} }), 'all')

console.log('newsletter-pipeline.test.js: all passed')
