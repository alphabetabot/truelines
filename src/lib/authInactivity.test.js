import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  ACTIVITY_EVENTS,
  INACTIVITY_SIGN_OUT_MS,
  isIdleExpired,
  mergeAuthUser,
} from './authInactivity.js'

describe('authInactivity', () => {
  it('detects idle expiry', () => {
    const now = 1_000_000
    assert.equal(isIdleExpired(now - INACTIVITY_SIGN_OUT_MS, now), true)
    assert.equal(isIdleExpired(now - INACTIVITY_SIGN_OUT_MS + 1, now), false)
  })

  it('does not treat scroll as an activity event', () => {
    assert.equal(ACTIVITY_EVENTS.includes('scroll'), false)
  })

  it('keeps user reference on token refresh', () => {
    const prev = { id: 'abc', email: 'a@b.com' }
    const next = { id: 'abc', email: 'a@b.com', role: 'authenticated' }
    assert.equal(mergeAuthUser(prev, { user: next }), prev)
  })

  it('updates user when id changes', () => {
    const prev = { id: 'abc' }
    const next = { id: 'xyz' }
    assert.equal(mergeAuthUser(prev, { user: next }), next)
  })
})
