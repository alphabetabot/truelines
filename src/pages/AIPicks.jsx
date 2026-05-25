import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOdds, parseOddsForComparison } from '../lib/oddsApi'
import { getAIPick } from '../lib/claudeApi'
import { getTodayProbablePitchers } from '../lib/mlbApi'
import SportSelector from '../components/SportSelector'
import AIResponse from '../components/AIResponse'
import { Zap, Trophy, Star, RefreshCw, Loader2 } from 'lucide-react'
import AIDisclaimer from '../components/AIDisclaimer'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'

const sportColor = { MLB: '#22c55e', NBA: '#2563eb', NHL: '#6366f1', Mixed: '#64748b' }

function StoredPickCard({ pick, index }) {
  const isFade = (pick.pick || '').toLowerCase().includes('fade') || (pick.bet || '').toLowerCase().includes('fade')
  const labels = ['Top Pick', 'Pick #2', 'Pick #3', 'Fade']
  const label = labels[index] || `Pick ${index + 1}`

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${isFade ? '#fecaca' : 'var(--border)'}` }}>
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: isFade ? '#fef2f2' : 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded font-bold"
            style={{ background: (sportColor[pick.sport] || '#64748b') + '20', color: sportColor[pick.sport] || '#64748b' }}>
            {pick.sport}
          </span>
          <span className="text-xs font-bold" style={{ color: isFade ? '#dc2626' : 'var(--gold)' }}>{label}</span>
        </div>
        <span className="text-xs tracking-widest" style={{ color: 'var(--gold)' }}>{pick.confidence}</span>
      </div>
      <div className="p-4" style={{ background: 'var(--bg-card)' }}>
        <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{pick.game}</p>
        <p className="font-bold text-base mb-2" style={{ color: 'var(--text-primary)' }}>{pick.pick}</p>
        {pick.bet && (
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--gold)' }}>{pick.bet}</p>
        )}
        {pick.edge && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{pick.edge}</p>
        )}
        {pick.result && (
          <span className="inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: pick.result === 'W' ? '#dcfce7' : '#fef2f2',
              color: pick.result === 'W' ? '#16a34a' : '#dc2626',
            }}>
            {pick.result}
          </span>
        )}
      </div>
    </div>
  )
}

function PickCard({ game, pitchers = {} }) {
  const [pick, setPick] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function fetchPick() {
    setLoading(true)
    setError(null)
    try {
      const result = await getAIPick(game, pitchers)
      setPick(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
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
      {(pick || loading || error) && (
        <div className="p-4" style={{ background: 'var(--bg-card)' }}>
          <AIResponse loading={loading} error={error} data={pick} label="AI Pick" />
        </div>
      )}
    </div>
  )
}

export default function AIPicks() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [sport, setSport] = useState('basketball_nba')
  const [view, setView] = useState('newsletter')
  const [storedPicks, setStoredPicks] = useState([])
  const [storedLoading, setStoredLoading] = useState(true)
  const [storedError, setStoredError] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['odds', sport],
    queryFn: () => getOdds(sport),
    staleTime: 30_000,
    enabled: view === 'individual',
  })

  const games = data ? parseOddsForComparison(data) : []
  const isMLB = sport === 'baseball_mlb'

  const { data: pitchers = {} } = useQuery({
    queryKey: ['mlb-pitchers'],
    queryFn: getTodayProbablePitchers,
    enabled: isMLB && view === 'individual',
    staleTime: 300_000,
    refetchOnMount: true,
  })

  useEffect(() => {
    if (authLoading || !user) return
    let active = true

    async function loadStoredPicks() {
      if (active) {
        setStoredLoading(true)
        setStoredError(null)
      }
      try {
        const res = await fetch('/api/todays-pick?all=1')
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Picks not available yet')
        }
        const data = await res.json()
        if (active) setStoredPicks(data.picks || [])
      } catch (e) {
        if (active) {
          setStoredError(e.message)
          setStoredPicks([])
        }
      } finally {
        if (active) setStoredLoading(false)
      }
    }

    loadStoredPicks()
    return () => {
      active = false
    }
  }, [authLoading, user])

  if (authLoading) {
    return (
      <div className="text-center py-20 px-4">
        <Loader2 size={32} className="mx-auto mb-3 animate-spin" style={{ color: '#d97706' }} />
        <p className="text-sm" style={{ color: '#64748b' }}>Checking your account...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-20 px-4">
        <Trophy size={48} className="mx-auto mb-4" style={{ color: '#d97706', opacity: 0.5 }} />
        <h2 className="text-2xl font-black mb-2" style={{ color: '#0f172a' }}>Free Account Required</h2>
        <p className="text-sm mb-6" style={{ color: '#64748b' }}>
          Sign up free to access daily AI picks, best bets, and the newsletter.
        </p>
        <button onClick={() => navigate('/login')}
          className="px-8 py-3 rounded-xl font-bold text-white text-sm"
          style={{ background: '#0f172a' }}>
          Create Free Account
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
              Same picks from the daily newsletter · Updated each morning
            </p>
          </div>
        </div>
      </div>

      <AIDisclaimer />

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setView('newsletter')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: view === 'newsletter' ? 'var(--gold)' : 'var(--bg-card)',
            color: view === 'newsletter' ? '#000' : 'var(--text-secondary)',
            border: `1px solid ${view === 'newsletter' ? 'var(--gold)' : 'var(--border)'}`,
          }}
        >
          <Star size={13} />
          Today's Picks
        </button>
        <button
          onClick={() => setView('individual')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: view === 'individual' ? 'var(--accent)' : 'var(--bg-card)',
            color: view === 'individual' ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${view === 'individual' ? 'var(--accent)' : 'var(--border)'}`,
          }}
        >
          On-Demand Picks
        </button>
      </div>

      {view === 'newsletter' && (
        <div>
          {storedLoading && (
            <div className="text-center py-12">
              <RefreshCw size={24} className="mx-auto mb-3 animate-spin" style={{ color: 'var(--gold)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading today's picks…</p>
            </div>
          )}

          {!storedLoading && storedError && (
            <div className="text-center py-12 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Picks not ready yet</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Newsletter picks publish daily around 8 AM PT. Check back soon.
              </p>
            </div>
          )}

          {!storedLoading && !storedError && storedPicks.length === 0 && (
            <div className="text-center py-12 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No picks for today</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Picks are generated automatically when games are on the slate.
              </p>
            </div>
          )}

          {!storedLoading && storedPicks.length > 0 && (
            <div className="grid gap-3">
              {storedPicks.map((pick, i) => (
                <StoredPickCard key={pick.id || i} pick={pick} index={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'individual' && (
        <div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            Generate a one-off pick for any game (separate from the daily newsletter picks).
          </p>
          <SportSelector selected={sport} onChange={setSport} />

          {isLoading && (
            <div className="grid gap-3 mt-4">
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
            <div className="grid gap-3 mt-4">
              {games.map(game => (
                <PickCard key={game.id} game={game} pitchers={pitchers} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
