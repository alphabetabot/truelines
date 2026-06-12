import assert from 'node:assert/strict'
import {
  buildTopPickFromDailyPickRow,
  resolveTopPickText,
} from '../api/_newsletter-deliver.js'

const sampleText = `TOP PICK OF THE DAY
Pirates @ Rockies
**MLB Pick: Pirates ML**
- Bet: ML at -118 via DraftKings
- Confidence: ★★★★☆
- Edge: Strong value on the road dog.`

assert.ok(resolveTopPickText(sampleText, null).includes('Pirates ML'), 'uses Claude text when available')

const rebuilt = buildTopPickFromDailyPickRow({
  sport: 'MLB',
  game: 'Pirates @ Rockies',
  pick: 'Pirates ML',
  bet: 'ML · -118 · DraftKings',
  confidence: '★★★★☆',
  edge: 'Road dog value.',
})
assert.ok(rebuilt.includes('TOP PICK OF THE DAY'), 'rebuilds from daily_picks row')
assert.ok(resolveTopPickText('', {
  sport: 'MLB',
  game: 'Pirates @ Rockies',
  pick: 'Pirates ML',
  bet: 'ML · -118 · DraftKings',
  confidence: '★★★★☆',
  edge: 'Road dog value.',
}).includes('Pirates ML'), 'falls back to daily_picks row')

console.log('newsletter-deliver.test.js: all passed')
