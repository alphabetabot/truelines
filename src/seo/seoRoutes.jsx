/**
 * SEO landing routes — import only in App.jsx.
 * More specific paths (/picks/mlb) are registered before /picks in App.jsx.
 */
import { Route } from 'react-router-dom'
import SeoOddsSportPage from './pages/SeoOddsSportPage'
import SeoPicksSportPage from './pages/SeoPicksSportPage'
import SeoSportsbookComparisonPage from './pages/SeoSportsbookComparisonPage'
import SeoAiSportsPicksPage from './pages/SeoAiSportsPicksPage'

export function SeoLandingRoutes() {
  return (
    <>
      <Route path="/ai-sports-picks" element={<SeoAiSportsPicksPage />} />
      <Route path="/sportsbook-comparison" element={<SeoSportsbookComparisonPage />} />
      <Route path="/odds/:sportSlug" element={<SeoOddsSportPage />} />
      <Route path="/picks/:sportSlug" element={<SeoPicksSportPage />} />
    </>
  )
}
