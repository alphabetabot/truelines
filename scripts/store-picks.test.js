import assert from 'node:assert/strict'
import { extractPicksFromResponse, repairPickOrderFromText } from '../api/store-picks.js'

const SAMPLE = `TOP PICK OF THE DAY
Pirates @ Rockies
**MLB Pick: Pirates ML**
- Bet: ML at +145 via DraftKings
- Confidence: 4/5
- Edge: Road dog with starter edge.

---

PICK #2
Lakers @ Celtics
**NBA Pick: Lakers +4.5**
- Bet: Spread at -110 via FanDuel
- Confidence: 3/5
- Edge: Line value on the road.

---

PICK #3
Rangers @ Bruins
**NHL Pick: Under 6.5**
- Bet: Total at -105 via BetMGM
- Confidence: 3/5
- Edge: Goalie matchup favors under.`

const picks = extractPicksFromResponse(SAMPLE)

assert.equal(picks.length, 3, 'extracts three picks in document order')
assert.match(picks[0].pickSelection, /Pirates/i, 'first pick is top pick')
assert.match(picks[1].pickSelection, /Lakers/i, 'second pick is pick #2')
assert.match(picks[2].pickSelection, /Under 6\.5/i, 'third pick is pick #3')

// Row builder contract: storePicks maps index -> sort_order (regression for _sort_order typo)
const rows = picks.map((pick, index) => ({ pick: pick.pickSelection, sort_order: index }))
assert.deepEqual(rows.map(r => r.sort_order), [0, 1, 2], 'sort_order follows newsletter order')

assert.equal(typeof repairPickOrderFromText, 'function', 'exports repairPickOrderFromText')

console.log('store-picks.test.js: all passed')
