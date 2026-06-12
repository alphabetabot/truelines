import assert from 'node:assert/strict'
import test from 'node:test'
import { briefEdgeSummary, publicPickPreview } from '../api/_pick-text.js'

test('briefEdgeSummary keeps at most two sentences', () => {
  const edge = 'First sentence. Second sentence. Third sentence should be hidden.'
  const brief = briefEdgeSummary(edge)
  assert.ok(brief.includes('First sentence.'))
  assert.ok(brief.includes('Second sentence.'))
  assert.ok(!brief.includes('Third sentence'))
})

test('publicPickPreview redacts full edge', () => {
  const row = {
    pick: 'Rays ML',
    edge: 'Alpha. Beta. Gamma.',
  }
  const preview = publicPickPreview(row)
  assert.equal(preview.edgePreview, true)
  assert.ok(!preview.edge.includes('Gamma'))
})
