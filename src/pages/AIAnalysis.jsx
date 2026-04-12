import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOdds, parseOddsForComparison } from '../lib/oddsApi'
import { analyzeGame } from '../lib/claudeApi'
import SportSelector from '../components/SportSelector'
import AIResponse from '../components/AIResponse'
import { Brain, ChevronDown, Zap } from 'lucide-react'

export default function AIAnalysis() {
  const [sport, setSport] = useState('basketball_nba')
  const [selectedGame, setSelectedGame] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['odds', sport],
    queryFn: () => getOdds(sport),
    staleTime: 30_000,
  })

  const games = data ? parseOddsForComparison(data) : []

  async function runAnalysis() {
    if (!selectedGame) return
    setLoading(true)
    setError(null)
    setAnalysis(null)
    try {
      const result = await analyzeGame(selectedGame)
      setAnalysis(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleGameSelect(gameId) {
    const g = games.find(x => x.id === gameId)
    setSelectedGame(g || null)
    setAnalysis(null)
    setError(null)
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Brain size={24} style={{ color: 'var(--accent)' }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              AI Analysis
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Deep game analysis powered by Claude · Line movement · Sharp money · Value
            </p>
          </div>
        </div>
      </div>

      <SportSelector selected={sport} onChange={s => { setSport(s); setSelectedGame(null); setAnalysis(null) }} />

      {/* Game picker */}
      <div className="mb-4">
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          SELECT GAME TO ANALYZE
        </label>
        <div className="relative">
          <select
            value={selectedGame?.id || ''}
            onChange={e => handleGameSelect(e.target.value)}
            className="w-full appearance-none px-4 py-3 rounded-xl text-sm outline-none pr-10"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: selectedGame ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            <option value="">
              {isLoading ? 'Loading...' : games.length === 0 ? 'No games available' : '— Choose a game —'}
            </option>
            {games.map(g => (
              <option key={g.id} value={g.id}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                {g.away} @ {g.home} · {new Date(g.commenceTime).toLocaleDateString()}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-secondary)' }} />
        </div>
      </div>

      {/* Analyze button */}
      <button
        onClick={runAnalysis}
        disabled={!selectedGame || loading}
        className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mb-6 transition-all"
        style={{
          background: selectedGame && !loading
            ? 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)'
            : 'var(--bg-card)',
          color: selectedGame && !loading ? '#fff' : 'var(--text-secondary)',
          border: `1px solid ${selectedGame && !loading ? 'transparent' : 'var(--border)'}`,
          cursor: selectedGame && !loading ? 'pointer' : 'not-allowed',
          boxShadow: selectedGame && !loading ? '0 4px 20px rgba(59,130,246,0.3)' : 'none',
        }}
      >
        <Zap size={15} />
        {loading ? 'Analyzing...' : 'Analyze with Claude'}
      </button>

      {/* Selected game summary */}
      {selectedGame && !analysis && !loading && !error && (
        <div className="mb-4 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {selectedGame.away} @ {selectedGame.home}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {new Date(selectedGame.commenceTime).toLocaleString()} ·{' '}
            {Object.keys(selectedGame.bookmakers || {}).length} books available
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            Click "Analyze with Claude" to get line movement analysis, sharp money signals, and value spots.
          </p>
        </div>
      )}

      <AIResponse
        loading={loading}
        error={error}
        data={analysis}
        label={selectedGame ? `${selectedGame.away} @ ${selectedGame.home}` : 'AI Analysis'}
      />
    </div>
  )
}
