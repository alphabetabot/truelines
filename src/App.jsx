import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './lib/AuthContext'
import PageMeta from './components/PageMeta'
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
import Fantasy from './pages/Fantasy'
import Unsubscribe from './pages/Unsubscribe'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function page(element, meta) {
  return (
    <>
      <PageMeta {...meta} />
      {element}
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={page(<LiveOdds />, {
                title: 'TrueOddsIQ - Sports Betting Odds Comparison',
                description: 'Compare current sports betting odds from major sportsbooks and review AI-assisted betting research for informational use.',
                path: '/',
              })} />
              <Route path="/compare" element={page(<LineCompare />, {
                title: 'Line Compare - TrueOddsIQ',
                description: 'Compare available moneyline, spread, and total prices across supported sportsbooks before placing a wager.',
                path: '/compare',
              })} />
              <Route path="/analysis" element={page(<AIAnalysis />, {
                title: 'AI Game Analysis - TrueOddsIQ',
                description: 'Run AI-assisted sports betting analysis using current odds snapshots and available matchup context.',
                path: '/analysis',
              })} />
              <Route path="/picks" element={page(<AIPicks />, {
                title: 'Daily AI Picks - TrueOddsIQ',
                description: 'View the daily TrueOddsIQ picks list and AI-assisted research notes for informational use.',
                path: '/picks',
              })} />
              <Route path="/disclaimer" element={page(<Disclaimer />, {
                title: 'Site Disclaimer - TrueOddsIQ',
                description: 'Read the TrueOddsIQ disclaimer for informational odds, AI analysis, affiliate links, and responsible gambling.',
                path: '/disclaimer',
              })} />
              <Route path="/about" element={page(<About />, {
                title: 'About TrueOddsIQ',
                description: 'Learn how TrueOddsIQ compares sportsbook odds and provides AI-assisted betting research.',
                path: '/about',
              })} />
              <Route path="/blog" element={page(<Blog />, {
                title: 'Betting Research Blog - TrueOddsIQ',
                description: 'Read TrueOddsIQ guides on line shopping, MLB odds, and AI-assisted sports betting research.',
                path: '/blog',
              })} />
              <Route path="/blog/:slug" element={page(<Blog />, {
                title: 'TrueOddsIQ Betting Research Blog',
                description: 'Read TrueOddsIQ sports betting education and odds comparison research.',
              })} />
              <Route path="/login" element={page(<Auth />, {
                title: 'Sign In - TrueOddsIQ',
                description: 'Sign in or create a free TrueOddsIQ account to access daily picks and newsletter features.',
                path: '/login',
              })} />
              <Route path="/auth/callback" element={page(<AuthCallback />, {
                title: 'Signing In - TrueOddsIQ',
                description: 'Complete your TrueOddsIQ sign-in or account confirmation.',
                path: '/auth/callback',
              })} />
              <Route path="/fantasy" element={page(<Fantasy />, {
                title: 'DFS Demo Sandbox - TrueOddsIQ',
                description: 'Preview a fictional DFS ranking sandbox. Demo data is not live salary, projection, or ownership advice.',
                path: '/fantasy',
              })} />
              <Route path="/unsubscribe" element={page(<Unsubscribe />, {
                title: 'Email Preferences - TrueOddsIQ',
                description: 'Manage TrueOddsIQ email newsletter preferences.',
                path: '/unsubscribe',
              })} />
              <Route path="/privacy" element={page(<Privacy />, {
                title: 'Privacy Policy - TrueOddsIQ',
                description: 'Review how TrueOddsIQ handles account, newsletter, analytics, and service-provider data.',
                path: '/privacy',
              })} />
              <Route path="/terms" element={page(<Terms />, {
                title: 'Terms of Use - TrueOddsIQ',
                description: 'Read the TrueOddsIQ terms for informational odds comparison and AI-assisted betting research.',
                path: '/terms',
              })} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
