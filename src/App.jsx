import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './lib/AuthContext'
import Layout from './components/Layout'
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
              <Route path="/" element={<LiveOdds />} />
              <Route path="/compare" element={<LineCompare />} />
              <Route path="/analysis" element={<AIAnalysis />} />
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
