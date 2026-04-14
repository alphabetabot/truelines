import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/Layout'
import LiveOdds from './pages/LiveOdds'
import LineCompare from './pages/LineCompare'
import AIAnalysis from './pages/AIAnalysis'
import AIPicks from './pages/AIPicks'
import Disclaimer from './pages/Disclaimer'

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
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<LiveOdds />} />
            <Route path="/compare" element={<LineCompare />} />
            <Route path="/analysis" element={<AIAnalysis />} />
            <Route path="/picks" element={<AIPicks />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
