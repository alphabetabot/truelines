import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  aggregatePickPerformance,
  filterPicksByPeriod,
  isPushResult,
} from './pickPerformance.js'

describe('pickPerformance', () => {
  const sample = [
    { date: '2026-05-28', result: 'W', units: 1 },
    { date: '2026-05-20', result: 'L', units: -1 },
    { date: '2026-05-01', result: 'P', units: 0 },
    { date: '2026-05-29', result: '', units: 0 },
  ]

  it('aggregates wins losses pushes', () => {
    const agg = aggregatePickPerformance(sample)
    assert.equal(agg.wins, 1)
    assert.equal(agg.losses, 1)
    assert.equal(agg.pushes, 1)
    assert.equal(agg.decided, 2)
    assert.equal(agg.winRate, 50)
  })

  it('filters 7d window', () => {
    const now = new Date('2026-05-30T12:00:00')
    const filtered = filterPicksByPeriod(sample, '7d', now)
    assert.equal(filtered.length, 1)
  })

  it('detects push results', () => {
    assert.equal(isPushResult('P'), true)
    assert.equal(isPushResult('Push'), true)
    assert.equal(isPushResult('W'), false)
  })
})
