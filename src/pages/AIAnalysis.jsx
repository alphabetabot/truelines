import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOdds, parseOddsForComparison } from '../lib/oddsApi'
import { analyzeGame } from '../lib/claudeApi'
import { analyzeGameGPT } from '../lib/openaiApi'
import SportSelector from '../components/SportSelector'
import AIResponse from '../components/AIResponse'
import { Brain, ChevronDown, Zap } from 'lucide-react'
import AIDisclaimer from '../components/AIDisclaimer'

export default function AIAnalysis() {
  const [sport, setSport] = useState('basketball_nba')
  const [selectedGame, setSelectedGame] = useState(null)
  const [claudeData, setClaudeData] = useState(null)
  const [claudeLoading, setClaudeLoading] = useState(false)
  const [claudeError, setClaudeError] = useState(null)
  const [gptData, setGptData] = useState(null)
  const [gptLoading, setGptLoading] = useState(false)
  const [gptError, setGptError] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['odds', sport],
    queryFn: () => getOdds(sport),
    staleTime: 30_000,
  })

  const games = data ? parseOddsForComparison(data) : []

  function handleGameSelect(gameId) {
    const g = games.find(x => x.id === gameId)
    setSelectedGame(g || null)
    setClaudeData(null); setClaudeError(null)
    setGptData(null); setGptError(null)
  }

  async function runClaude() {
    if (!selectedGame) return
    setClaudeLoading(true); setClaudeError(null); setClaudeData(null)
    try {
      setClaudeData(await analyzeGame(selectedGame))
    } catch (e) {
      setClaudeError(e.message)
    } finally {
      setClaudeLoading(false)
    }
  }

  async function runGPT() {
    if (!selectedGame) return
    setGptLoading(true); setGptError(null); setGptData(null)
    try {
      setGptData(await analyzeGameGPT(selectedGame))
    } catch (e) {
      setGptError(e.message)
    } finally {
      setGptLoading(false)
    }
  }

  const gameLabel = selectedGame ? `${selectedGame.away} @ ${selectedGame.home}` : null

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Brain size={22} style={{ color: '#2563eb' }} />
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>AI Analysis</h1>
            <p className="text-sm" style={{ color: '#64748b' }}>
              Game analysis powered by Claude & ChatGPT
            </p>
          </div>
        </div>
      </div>

      <AIDisclaimer />
      <SportSelector selected={sport} onChange={s => { setSport(s); setSelectedGame(null); setClaudeData(null); setGptData(null) }} />

      {/* Game selector */}
      <div className="mb-5">
        <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>SELECT GAME</label>
        <div className="relative">
          <select
            value={selectedGame?.id || ''}
            onChange={e => handleGameSelect(e.target.value)}
            className="w-full appearance-none px-4 py-3 rounded-xl text-sm outline-none pr-10"
            style={{ background: '#fff', border: '1px solid #e2e8f0', color: selectedGame ? '#0f172a' : '#94a3b8' }}
          >
            <option value="">{isLoading ? 'Loading...' : games.length === 0 ? 'No games available' : '— Choose a game —'}</option>
            {games.map(g => (
              <option key={g.id} value={g.id}>
                {g.away} @ {g.home} · {new Date(g.commenceTime).toLocaleDateString()}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }} />
        </div>
      </div>

      {/* Two analyze buttons */}
      <div className="flex gap-3 mb-6">
        {/* Claude */}
        <button
          onClick={runClaude}
          disabled={!selectedGame || claudeLoading}
          className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          style={{
            background: selectedGame && !claudeLoading ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : '#f1f5f9',
            color: selectedGame && !claudeLoading ? '#fff' : '#94a3b8',
            cursor: selectedGame && !claudeLoading ? 'pointer' : 'not-allowed',
            boxShadow: selectedGame && !claudeLoading ? '0 4px 14px rgba(124,58,237,0.3)' : 'none',
          }}
        >
          <Zap size={15} />
          {claudeLoading ? 'Claude Analyzing...' : 'Analyze with Claude'}
        </button>

        {/* GPT-4o */}
        <button
          onClick={runGPT}
          disabled={!selectedGame || gptLoading}
          className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          style={{
            background: selectedGame && !gptLoading ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#f1f5f9',
            color: selectedGame && !gptLoading ? '#fff' : '#94a3b8',
            cursor: selectedGame && !gptLoading ? 'pointer' : 'not-allowed',
            boxShadow: selectedGame && !gptLoading ? '0 4px 14px rgba(22,163,74,0.3)' : 'none',
          }}
        >
          <Brain size={15} />
          {gptLoading ? 'ChatGPT Analyzing...' : 'Analyze with ChatGPT'}
        </button>
      </div>

      {/* Claude response */}
      {(claudeData || claudeLoading || claudeError) && (
        <div className="mb-4">
          <AIResponse loading={claudeLoading} error={claudeError} data={claudeData}
            label={gameLabel ? `Claude · ${gameLabel}` : 'Claude Analysis'} provider="Claude" />
        </div>
      )}

      {/* GPT response */}
      {(gptData || gptLoading || gptError) && (
        <AIResponse loading={gptLoading} error={gptError} data={gptData}
          label={gameLabel ? `ChatGPT · ${gameLabel}` : 'ChatGPT Analysis'} provider="ChatGPT" />
      )}

      {!claudeData && !gptData && !claudeLoading && !gptLoading && !claudeError && !gptError && (
        <div className="text-center py-12">
          <Brain size={36} className="mx-auto mb-3 opacity-20" style={{ color: '#64748b' }} />
          <p className="text-sm" style={{ color: '#94a3b8' }}>Select a game then choose your AI</p>
        </div>
      )}
    </div>
  )
}
