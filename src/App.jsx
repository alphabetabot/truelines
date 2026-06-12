import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './lib/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import LiveOdds from './pages/LiveOdds'
import LineCompare from './pages/LineCompare'
import AIAnalysis from './pages/AIAnalysis'
import AIPicks from './pages/AIPicks'
import Disclaimer from './pages/Disclaimer'
import About from './pages/About'
import Blog from './pages/Blog'
import Auth from './pages/Auth'
import AuthCallback from './pages/AuthCallback'
import AuthReset from './pages/AuthReset'
import Fantasy from './pages/Fantasy'
import Unsubscribe from './pages/Unsubscribe'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import NotFound from './pages/NotFound'
import Welcome from './pages/Welcome'
import Premium from './pages/Premium'
import Plans from './pages/Plans'
import PremiumGate from './components/PremiumGate'
import AuthGate from './components/AuthGate'
import Parlay from './pages/Parlay'
import { SeoLandingRoutes } from './seo/seoRoutes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              {SeoLandingRoutes()}
              <Route path="/odds" element={<LiveOdds />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/compare" element={<LineCompare />} />
              <Route
                path="/parlay"
                element={(
                  <AuthGate
                    title="Parlay Builder"
                    description="Create a free account and Vega will build parlay tickets from today's odds. Includes the newsletter, live odds, and public tracker."
                    from="/parlay"
                  >
                    <Parlay />
                  </AuthGate>
                )}
              />
              <Route
                path="/analysis"
                element={(
                  <PremiumGate
                    title="AI Analysis"
                    description="Run Vega and ChatGPT on any game — injuries, stats, weather, and line value. Premium unlocks unlimited analysis."
                  >
                    <AIAnalysis />
                  </PremiumGate>
                )}
              />
              <Route path="/picks" element={<AIPicks />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<Blog />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/reset" element={<AuthReset />} />
              <Route path="/fantasy" element={<Fantasy />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
