import assert from 'node:assert/strict'
import {
  buildTopPickFromDailyPickRow,
  isUsableTopPickText,
  resolveTopPickText,
} from '../api/_newsletter-deliver.js'
import { extractTopPickSection } from '../api/_store-picks.js'

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

const preambleOnly = `# VEGA'S PICKS | Saturday, June 13, 2026`
assert.equal(isUsableTopPickText(preambleOnly), false, 'rejects preamble-only text')

const withPreamble = `${preambleOnly}

TOP PICK OF THE DAY
Tampa Bay Rays @ Los Angeles Angels
**MLB Pick: Tampa Bay Rays ML**
- Bet: ML at -160 via Pinnacle
- Confidence: ★★★★★
- Edge: McClanahan dominates this matchup.`

const extracted = extractTopPickSection(withPreamble)
assert.ok(extracted.includes('Tampa Bay Rays ML'), 'extracts top pick after markdown preamble')
assert.ok(extracted.includes('- Bet:'), 'extracted section includes bet line')
assert.ok(resolveTopPickText(withPreamble, null).includes('Tampa Bay Rays ML'), 'resolve uses real top pick not preamble')

console.log('newsletter-deliver.test.js: all passed')
