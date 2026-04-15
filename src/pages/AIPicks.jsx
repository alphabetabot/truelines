import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOdds, parseOddsForComparison, SPORTS } from '../lib/oddsApi'
import { getAIPick, getDailyPicks } from '../lib/claudeApi'
import SportSelector from '../components/SportSelector'
import AIResponse from '../components/AIResponse'
import { Zap, Trophy, ChevronDown, Star } from 'lucide-react'
import AIDisclaimer from '../components/AIDisclaimer'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'

function PickCard({ game, onGetPick }) {
  const [pick, setPick] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function fetchPick() {
    setLoading(true)
    setError(null)
    try {
      const result = await getAIPick(game)
      setPick(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* Game header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {game.away} <span style={{ color: 'var(--text-secondary)' }}>@</span> {game.home}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {new Date(game.commenceTime).toLocaleDateString()} · {Object.keys(game.bookmakers || {}).length} books
          </p>
        </div>
        <button
          onClick={fetchPick}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: loading ? 'var(--bg-card)' : 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)',
            color: loading ? 'var(--text-secondary)' : '#fff',
            border: loading ? '1px solid var(--border)' : 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <Zap size={11} />
          {loading ? 'Picking...' : pick ? 'Re-pick' : 'Get Pick'}
        </button>
      </div>

      {/* Pick content */}
      {(pick || loading || error) && (
        <div className="p-4" style={{ background: 'var(--bg-card)' }}>
          <AIResponse loading={loading} error={error} data={pick} label="AI Pick" />
        </div>
      )}
    </div>
  )
}

export default function AIPicks() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sport, setSport] = useState('basketball_nba')
  const [dailyPicks, setDailyPicks] = useState(null)
  const [dailyLoading, setDailyLoading] = useState(false)
  const [dailyError, setDailyError] = useState(null)
  const [view, setView] = useState('individual') // 'individual' | 'daily'

  const { data, isLoading } = useQuery({
    queryKey: ['odds', sport],
    queryFn: () => getOdds(sport),
    staleTime: 30_000,
  })

  const games = data ? parseOddsForComparison(data) : []

  async function fetchDailyPicks() {
    if (games.length === 0) return
    setDailyLoading(true)
    setDailyError(null)
    setDailyPicks(null)
    try {
      const result = await getDailyPicks(games)
      setDailyPicks(result)
    } catch (e) {
      setDailyError(e.message)
    } finally {
      setDailyLoading(false)
    }
  }

  // Gate behind login
  if (!user) {
    return (
      <div className="text-center py-20 px-4">
        <Trophy size={48} className="mx-auto mb-4" style={{ color: '#d97706', opacity: 0.5 }} />
        <h2 className="text-2xl font-black mb-2" style={{ color: '#0f172a' }}>AI Picks — Members Only</h2>
        <p className="text-sm mb-6" style={{ color: '#64748b' }}>
          Create a free account to access daily AI picks, best bets, and newsletter.
        </p>
        <button onClick={() => navigate('/login')}
          className="px-8 py-3 rounded-xl font-bold text-white text-sm"
          style={{ background: '#0f172a' }}>
          Sign Up Free
        </button>
        <p className="text-xs mt-4" style={{ color: '#94a3b8' }}>Already have an account? <button onClick={() => navigate('/login')} style={{ color: '#2563eb', fontWeight: 600 }}>Sign in</button></p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Trophy size={24} style={{ color: 'var(--gold)' }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              AI Picks
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Claude-powered picks · Line value · Sharp angles · Best books
            </p>
          </div>
        </div>
      </div>

      <AIDisclaimer />
      <SportSelector selected={sport} onChange={s => { setSport(s); setDailyPicks(null) }} />

      {/* View toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('individual')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: view === 'individual' ? 'var(--accent)' : 'var(--bg-card)',
            color: view === 'individual' ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${view === 'individual' ? 'var(--accent)' : 'var(--border)'}`,
          }}
        >
          Individual Games
        </button>
        <button
          onClick={() => setView('daily')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: view === 'daily' ? 'var(--gold)' : 'var(--bg-card)',
            color: view === 'daily' ? '#000' : 'var(--text-secondary)',
            border: `1px solid ${view === 'daily' ? 'var(--gold)' : 'var(--border)'}`,
          }}
        >
          <Star size={13} />
          Best Bets of the Day
        </button>
      </div>

      {/* Daily picks view */}
      {view === 'daily' && (
        <div>
          <button
            onClick={fetchDailyPicks}
            disabled={dailyLoading || games.length === 0}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mb-6 transition-all"
            style={{
              background: !dailyLoading && games.length > 0
                ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'
                : 'var(--bg-card)',
              color: !dailyLoading && games.length > 0 ? '#000' : 'var(--text-secondary)',
              border: `1px solid ${!dailyLoading && games.length > 0 ? 'transparent' : 'var(--border)'}`,
              cursor: !dailyLoading && games.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: !dailyLoading && games.length > 0 ? '0 4px 20px rgba(245,158,11,0.3)' : 'none',
            }}
          >
            <Star size={15} />
            {dailyLoading
              ? 'Scanning the slate...'
              : games.length === 0
              ? 'No games available'
              : `Generate Best Bets (${Math.min(games.length, 15)} games)`}
          </button>

          <AIResponse
            loading={dailyLoading}
            error={dailyError}
            data={dailyPicks}
            label="Best Bets of the Day"
          />
        </div>
      )}

      {/* Individual picks view */}
      {view === 'individual' && (
        <div>
          {isLoading && (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl h-16 shimmer" style={{ border: '1px solid var(--border)' }} />
              ))}
            </div>
          )}

          {!isLoading && games.length === 0 && (
            <div className="text-center py-16">
              <p style={{ color: 'var(--text-secondary)' }}>No upcoming games available for this sport</p>
            </div>
          )}

          {!isLoading && games.length > 0 && (
            <div className="grid gap-3">
              {games.map(game => (
                <PickCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
