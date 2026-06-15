/**
 * Run: node src/lib/appRoutes.test.js
 */
import {
  isAppWorkspaceRoute,
  isMarketingHomepage,
} from './appRoutes.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(isMarketingHomepage('/'), 'root is marketing homepage')
assert(!isMarketingHomepage('/odds'), 'odds is not marketing homepage')
assert(!isMarketingHomepage('/welcome'), 'welcome keeps full chrome')
assert(isAppWorkspaceRoute('/odds'), 'odds is app workspace')
assert(!isAppWorkspaceRoute('/about'), 'about is not app workspace')

console.log('appRoutes.test.js: all assertions passed')
