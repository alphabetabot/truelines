import assert from 'node:assert/strict'
import { BRAND } from '../api/_brand-tokens.js'
import { buildNewsletterEmailHtml } from '../api/_newsletter-utils.js'

const sample = `TOP PICK OF THE DAY
Pirates @ Rockies
**MLB Pick: Pirates ML**
- Bet: ML at -118 via DraftKings
- Edge: Strong value on the road dog.`

const html = buildNewsletterEmailHtml(sample, 'Mon Jun 21, 2026')

assert.ok(html.includes(BRAND.green), 'uses site neon green')
assert.ok(html.includes(BRAND.gold), 'uses site gold')
assert.ok(html.includes(BRAND.bgCard), 'uses dark card background')
assert.ok(!html.includes('#f0f4f8'), 'removes light outer background')
assert.ok(!html.includes('#f59e0b'), 'removes legacy amber accent')
assert.ok(html.includes('TrueOdds<span style="color:#39ff66;">IQ</span>'), 'wordmark matches site logo colors')
assert.ok(html.includes('Pirates ML'), 'renders pick content')
assert.ok(html.includes('Instrument Sans'), 'loads site font')

console.log('newsletter-email.test.js: all passed')
