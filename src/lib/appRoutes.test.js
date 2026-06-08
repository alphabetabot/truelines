/**
 * Run: node src/lib/appRoutes.test.js
 */
import {
  hideGlobalScoreTicker,
  isMarketingHomepage,
} from './appRoutes.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(isMarketingHomepage('/'), 'root is marketing homepage')
assert(!isMarketingHomepage('/odds'), 'odds is not marketing homepage')
assert(!isMarketingHomepage('/welcome'), 'welcome keeps full chrome')
assert(hideGlobalScoreTicker('/'), 'homepage hides score ticker')
assert(!hideGlobalScoreTicker('/about'), 'about shows score ticker')

console.log('appRoutes.test.js: all assertions passed')
