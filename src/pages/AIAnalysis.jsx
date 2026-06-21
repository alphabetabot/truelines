import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { getOdds, parseOddsForComparison } from '../lib/oddsApi'
import { analyzeGame } from '../lib/claudeApi'
import { analyzeGameGPT } from '../lib/openaiApi'
import { getTodayProbablePitchers } from '../lib/mlbApi'
import SportSelector from '../components/SportSelector'
import AIResponse from '../components/AIResponse'
import { Brain, ChevronDown, Zap } from 'lucide-react'
import AIDisclaimer from '../components/AIDisclaimer'
import OddsLoadError from '../components/OddsLoadError'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useSportSelection } from '../hooks/useSportSelection'
import { trackAnalysisOpen } from '../lib/analytics'
import RecentlyViewedGames from '../components/RecentlyViewedGames'
import GamePrevNextNav from '../components/GamePrevNextNav'
import { addRecentGame } from '../lib/recentGames'
import { sortGamesByTime } from '../lib/gameNavigation'
import {
  filterUpcomingGames,
  formatGameOptionLabel,
  getAnalysisWindow,
  groupGamesByDay,
} from '../lib/gameFilters'

const ANALYZE_BTN_FONT = 15
const ANALYZE_BTN_ICON = 15
const NEON_GREEN = '#39ff66'

function analyzeButtonStyle(enabled) {
  return {
    fontSize: ANALYZE_BTN_FONT,
    background: enabled ? NEON_GREEN : 'rgba(57, 255, 100, 0.14)',
    color: enabled ? '#0a0a0a' : NEON_GREEN,
    cursor: enabled ? 'pointer' : 'not-allowed',
    boxShadow: enabled ? '0 4px 20px rgba(57, 255, 100, 0.45)' : 'none',
    border: `1px solid ${enabled ? 'rgba(57, 255, 100, 0.55)' : 'rgba(57, 255, 100, 0.35)'}`,
    opacity: enabled ? 1 : 0.85,
  }
}

export default function AIAnalysis() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const preSelected = location.state?.game || null
  const [sport, setSport] = useSportSelection('analysis')
  const [selectedGame, setSelectedGame] = useState(preSelected)
  const [claudeData, setClaudeData] = useState(null)
  const [claudeLoading, setClaudeLoading] = useState(false)
  const [claudeError, setClaudeError] = useState(null)
  const [gptData, setGptData] = useState(null)
  const [gptLoading, setGptLoading] = useState(false)
  const [gptError, setGptError] = useState(null)

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['odds', sport, 'analysis'],
    queryFn: () => {
      const window = getAnalysisWindow()
      return getOdds(sport, 'h2h,spreads,totals', 'draftkings,fanduel,betmgm,williamhill_us,pinnacle,bet365', window)
    },
    staleTime: 300_000,
  })

  const { data: pitchers = {} } = useQuery({
    queryKey: ['mlb-pitchers'],
    queryFn: getTodayProbablePitchers,
    staleTime: 300_000,
    refetchOnMount: true,
  })

  const allGames = sortGamesByTime(data ? parseOddsForComparison(data) : [])
  const games = filterUpcomingGames(allGames)
  const gameGroups = groupGamesByDay(games)
  const sportLabel = sport.split('_').pop()?.toUpperCase() || 'this sport'

  useEffect(() => {
    if (!preSelected?.sport) return
    setSport(preSelected.sport, 'deep_link')
    addRecentGame(preSelected, preSelected.sport)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!preSelected?.id || games.length === 0) return
    const match = games.find(g => g.id === preSelected.id)
    if (match) setSelectedGame(match)
  }, [games, preSelected?.id])

  function selectGame(g, source = 'dropdown') {
    setSelectedGame(g || null)
    setClaudeData(null); setClaudeError(null)
    setGptData(null); setGptError(null)
    if (g) {
      addRecentGame(g, sport)
      trackAnalysisOpen({ sportKey: sport, gameId: g.id, provider: source })
    }
  }

  function handleGameSelect(gameId) {
    const g = games.find(x => x.id === gameId)
    selectGame(g || null, 'game_select')
  }

  async function runClaude() {
    if (!selectedGame) return
    if (!user) {
      navigate('/login')
      return
    }
    setClaudeLoading(true); setClaudeError(null); setClaudeData(null)
    try {
      trackAnalysisOpen({ sportKey: sport, gameId: selectedGame.id, provider: 'claude' })
      setClaudeData(await analyzeGame(selectedGame, pitchers))
    } catch (e) {
      setClaudeError(e.message)
    } finally {
      setClaudeLoading(false)
    }
  }

  async function runGPT() {
    if (!selectedGame) return
    if (!user) {
      navigate('/login')
      return
    }
    setGptLoading(true); setGptError(null); setGptData(null)
    try {
      trackAnalysisOpen({ sportKey: sport, gameId: selectedGame.id, provider: 'gpt' })
      setGptData(await analyzeGameGPT(selectedGame, pitchers))
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
          <Brain size={22} style={{ color: 'var(--accent)' }} />
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Vega AI Analysis</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Upcoming games for the next 7 days with live lines. Books drop started games — switch sport if the slate looks empty.
            </p>
          </div>
        </div>
      </div>

      <AIDisclaimer />

      {isError && (
        <OddsLoadError message={error?.message} onRetry={() => refetch()} />
      )}

      <SportSelector selected={sport} onChange={s => { setSport(s); selectGame(null) }} bright />

      <RecentlyViewedGames
        page="analysis"
        sportKey={sport}
        onSelect={g => selectGame(g, 'recent')}
      />

      <GamePrevNextNav
        games={games}
        selectedGame={selectedGame}
        sportKey={sport}
        page="analysis"
        onSelect={g => selectGame(g, 'prev_next')}
      />

      {!isLoading && games.length === 0 && (
        <div className="mb-4 p-4 rounded-xl text-sm leading-relaxed" style={{ background: 'var(--odds-bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          {allGames.length > 0 ? (
            <>
              <strong style={{ color: 'var(--text-primary)' }}>Today&apos;s {sportLabel} slate has already started.</strong>
              {' '}We only show games that haven&apos;t tipped yet. Tomorrow&apos;s lines usually post overnight — check back then, or try NBA/NHL if they still have upcoming games.
            </>
          ) : (
            <>
              <strong style={{ color: 'var(--text-primary)' }}>No upcoming {sportLabel} games with lines in the next 7 days.</strong>
              {' '}Try another sport tab above, or check back when books post the next slate.
            </>
          )}
        </div>
      )}

      <div className="mb-5">
        <label className="block font-semibold mb-2" style={{ color: 'var(--text-primary)', fontSize: 13 }}>
          SELECT UPCOMING GAME {games.length > 0 ? `(${games.length} this week)` : ''}
        </label>
        <div className="relative">
          <select
            value={selectedGame?.id || ''}
            onChange={e => handleGameSelect(e.target.value)}
            className="w-full appearance-none px-4 py-3 rounded-xl outline-none pr-10"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: 15,
            }}
          >
            <option value="">
              {isLoading || isFetching
                ? 'Loading games...'
                : games.length === 0
                  ? 'No upcoming games'
                  : '— Choose a game —'}
            </option>
            {gameGroups.map(group => (
              <optgroup key={group.key} label={group.label}>
                {group.games.map(g => (
                  <option key={g.id} value={g.id}>
                    {formatGameOptionLabel(g)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-primary)' }} />
        </div>
      </div>

      {!authLoading && !user && (
        <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold)', color: 'var(--text-primary)' }}>
          Sign in to run AI analysis. Live odds remain free to browse.
        </div>
      )}

      {/* Two analyze buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={runClaude}
          disabled={!selectedGame || claudeLoading || authLoading}
          className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          style={analyzeButtonStyle(Boolean(selectedGame && !claudeLoading && !authLoading))}
        >
          <Zap size={ANALYZE_BTN_ICON} />
          {claudeLoading ? 'Vega Analyzing...' : user ? 'Analyze with Vega' : 'Sign in for Vega'}
        </button>

        <button
          onClick={runGPT}
          disabled={!selectedGame || gptLoading || authLoading}
          className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          style={analyzeButtonStyle(Boolean(selectedGame && !gptLoading && !authLoading))}
        >
          <Brain size={ANALYZE_BTN_ICON} />
          {gptLoading ? 'ChatGPT Analyzing...' : user ? 'Analyze with ChatGPT' : 'Sign in for ChatGPT'}
        </button>
      </div>

      {/* Claude response */}
      {(claudeData || claudeLoading || claudeError) && (
        <div className="mb-4">
          <AIResponse loading={claudeLoading} error={claudeError} data={claudeData}
            label={gameLabel ? `Vega · ${gameLabel}` : 'Vega Analysis'} provider="Vega" />
        </div>
      )}

      {/* GPT response */}
      {(gptData || gptLoading || gptError) && (
        <AIResponse loading={gptLoading} error={gptError} data={gptData}
          label={gameLabel ? `ChatGPT · ${gameLabel}` : 'ChatGPT Analysis'} provider="ChatGPT" />
      )}

      {!claudeData && !gptData && !claudeLoading && !gptLoading && !claudeError && !gptError && (
        <div className="text-center py-12">
          <Brain size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-primary)', fontSize: 13 }}>Select a game then choose your AI</p>
        </div>
      )}
    </div>
  )
}
