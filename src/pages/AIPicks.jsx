import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOdds, parseOddsForComparison } from '../lib/oddsApi'
import { getAIPick } from '../lib/claudeApi'
import { getTodayProbablePitchers } from '../lib/mlbApi'
import SportSelector from '../components/SportSelector'
import AIResponse from '../components/AIResponse'
import { Zap, Trophy, Star, RefreshCw, Lock } from 'lucide-react'
import AIDisclaimer from '../components/AIDisclaimer'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getAuthHeaders } from '../lib/authHeaders'
import { FREE_PUBLIC_PICK_COUNT, DAILY_NEWSLETTER_PICK_COUNT } from '../lib/pickAccess'
import { briefEdgeSummary } from '../lib/pickText'
import PerformanceTracker from '../components/PerformanceTracker'
import DailyPick from '../components/DailyPick'
import PickPerformanceHero from '../components/PickPerformanceHero'
import { useSportSelection } from '../hooks/useSportSelection'
import { usePickPerformanceData } from '../hooks/usePickPerformanceData'
import PremiumFeatureSlot from '../components/PremiumFeatureSlot'

const sportColor = { MLB: '#22c55e', NBA: '#2563eb', NHL: '#6366f1', Mixed: '#64748b' }
const PICK_LABELS = ['Top Pick', 'Pick #2', 'Pick #3']

function isFadePick(pick) {
  const betType = String(pick?.bet_type || pick?.betType || '').trim()
  if (/^fade$/i.test(betType)) return true
  const text = `${pick.pick || ''} ${pick.bet || ''} ${betType}`
  return /\bfade\b/i.test(text) || /^FADE:/i.test(pick.pick || '')
}

function actionablePicks(picks) {
  return (picks || []).filter(p => !isFadePick(p)).slice(0, DAILY_NEWSLETTER_PICK_COUNT)
}

function StoredPickCard({ pick, index, isPublicPreview = false }) {
  const label = PICK_LABELS[index] || `Pick ${index + 1}`
  const edgeText = isPublicPreview ? briefEdgeSummary(pick.edge) : pick.edge

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded font-bold"
            style={{ background: (sportColor[pick.sport] || '#64748b') + '20', color: sportColor[pick.sport] || '#64748b' }}>
            {pick.sport}
          </span>
          <span className="text-xs font-bold" style={{ color: 'var(--gold)' }}>{label}</span>
        </div>
        <span className="text-xs tracking-widest" style={{ color: 'var(--gold)' }}>{pick.confidence}</span>
      </div>
      <div className="p-4" style={{ background: 'var(--bg-card)' }}>
        <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{pick.game}</p>
        <p className="font-bold text-base mb-2" style={{ color: 'var(--text-primary)' }}>{pick.pick}</p>
        {pick.bet && (
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--gold)' }}>{pick.bet}</p>
        )}
        {edgeText && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{edgeText}</p>
        )}
        {isPublicPreview && pick.edge && edgeText !== pick.edge && (
          <p className="text-xs mt-2" style={{ color: 'var(--gold)' }}>
            Sign in for the full edge on all picks. Premium adds unlimited AI analysis and deeper injury/weather breakdowns.
          </p>
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

function LockedPickCard({ index, onUnlock }) {
  const label = PICK_LABELS[index] || `Pick ${index + 1}`
  return (
    <div className="rounded-xl overflow-hidden relative" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs font-bold" style={{ color: 'var(--gold)' }}>{label}</span>
        <Lock size={14} style={{ color: 'var(--text-secondary)' }} />
      </div>
      <div className="p-6 text-center">
        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Premium subscribers only</p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
          Picks #{index + 1}–{DAILY_NEWSLETTER_PICK_COUNT} are on the full AI Picks tab with a Premium subscription.
        </p>
        <button type="button" onClick={onUnlock}
          className="px-5 py-2.5 rounded-xl font-bold text-sm"
          style={{ background: '#f59e0b', color: '#0f172a' }}>
          View Premium
        </button>
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
        <button type="button" onClick={fetchPick} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: loading ? 'var(--bg-card)' : 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)',
            color: loading ? 'var(--text-secondary)' : '#fff',
            border: loading ? '1px solid var(--border)' : 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
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
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sport, setSport] = useSportSelection('picks')
  const [view, setView] = useState('newsletter')
  const [storedPicks, setStoredPicks] = useState([])
  const [storedLoading, setStoredLoading] = useState(true)
  const [storedError, setStoredError] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['odds', sport],
    queryFn: () => getOdds(sport),
    staleTime: 30_000,
    enabled: view === 'individual' && Boolean(user),
  })

  const games = data ? parseOddsForComparison(data) : []
  const isMLB = sport === 'baseball_mlb'

  const { data: pitchers = {} } = useQuery({
    queryKey: ['mlb-pitchers'],
    queryFn: getTodayProbablePitchers,
    enabled: isMLB && view === 'individual' && Boolean(user),
    staleTime: 300_000,
    refetchOnMount: true,
  })

  useEffect(() => {
    let cancelled = false

    async function loadStoredPicks() {
      setStoredLoading(true)
      setStoredError(null)
      try {
        if (user) {
          const headers = await getAuthHeaders()
          const res = await fetch('/api/todays-pick?all=1', { headers })
          if (res.status === 401) {
            throw new Error("Please sign in again to load today's picks.")
          }
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || 'Picks not available yet')
          }
          const data = await res.json()
          if (!cancelled) setStoredPicks(actionablePicks(data.picks))
        } else {
          const res = await fetch('/api/todays-pick')
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || 'Picks not available yet')
          }
          const topPick = await res.json()
          if (!cancelled) {
            const picks = topPick?.pick ? [topPick] : []
            setStoredPicks(actionablePicks(picks))
          }
        }
      } catch (e) {
        if (!cancelled) {
          setStoredError(e.message)
          setStoredPicks([])
        }
      } finally {
        if (!cancelled) setStoredLoading(false)
      }
    }

    loadStoredPicks()
    return () => { cancelled = true }
  }, [user])

  const subtitle = user
    ? 'Your full daily newsletter slate · Updated each morning (Pacific)'
    : `Today's top pick preview · Premium unlocks all ${DAILY_NEWSLETTER_PICK_COUNT} picks + full write-ups`

  const lockedCount = Math.max(0, DAILY_NEWSLETTER_PICK_COUNT - (user ? storedPicks.length : FREE_PUBLIC_PICK_COUNT))
  const performance = usePickPerformanceData()

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Trophy size={24} style={{ color: 'var(--gold)' }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Picks</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {subtitle}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Primary home for daily recommendations, confidence, and rationale.
            </p>
          </div>
        </div>
      </div>

      {!user && (
        <div className="rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <p className="text-sm" style={{ color: '#92400e' }}>
            Today&apos;s top pick with a short summary below. Premium unlocks all {DAILY_NEWSLETTER_PICK_COUNT} picks,
            full write-ups, and deep injury, weather, and stat analysis.
          </p>
          <button type="button" onClick={() => navigate('/premium')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm shrink-0"
            style={{ background: '#f59e0b', color: '#0f172a' }}>
            Upgrade to Premium
          </button>
        </div>
      )}

      <AIDisclaimer />

      <PickPerformanceHero
        picks={performance.picks}
        loading={performance.loading}
        error={performance.error}
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <button type="button" onClick={() => setView('newsletter')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: view === 'newsletter' ? 'var(--gold)' : 'var(--bg-card)',
            color: view === 'newsletter' ? '#000' : 'var(--text-secondary)',
            border: `1px solid ${view === 'newsletter' ? 'var(--gold)' : 'var(--border)'}`,
          }}>
          <Star size={13} />
          Today&apos;s Picks
        </button>
        <button type="button" onClick={() => (user ? setView('individual') : navigate('/login'))}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: view === 'individual' ? 'var(--accent)' : 'var(--bg-card)',
            color: view === 'individual' ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${view === 'individual' ? 'var(--accent)' : 'var(--border)'}`,
            opacity: user ? 1 : 0.85,
          }}>
          On-Demand Picks{!user ? ' (account)' : ''}
        </button>
      </div>

      {view === 'newsletter' && (
        <div>
          <DailyPick />
          <PremiumFeatureSlot feature="premiumAIPicks" />
          <PremiumFeatureSlot feature="historicalPickPerformance" />

          {storedLoading && (
            <div className="text-center py-12">
              <RefreshCw size={24} className="mx-auto mb-3 animate-spin" style={{ color: 'var(--gold)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading today&apos;s picks…</p>
            </div>
          )}

          {!storedLoading && storedError && (
            <div className="text-center py-12 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Picks not ready yet</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                New picks every morning · Pacific time. Check back soon.
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
                <StoredPickCard
                  key={pick.id || i}
                  pick={pick}
                  index={i}
                  isPublicPreview={!user && i === 0}
                />
              ))}
              {!user && Array.from({ length: lockedCount }).map((_, i) => (
                <LockedPickCard
                  key={`locked-${i + FREE_PUBLIC_PICK_COUNT}`}
                  index={i + FREE_PUBLIC_PICK_COUNT}
                  onUnlock={() => navigate('/premium')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'newsletter' && (
        <>
          <div className="mt-8">
            <PerformanceTracker
              picks={performance.picks}
              loading={performance.loading}
              error={performance.error}
            />
          </div>
        </>
      )}

      {view === 'individual' && (
        <div>
          {!user ? (
            <div className="text-center py-12 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Sign in for on-demand picks</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Generate a custom AI pick for any game on the slate (separate from the daily newsletter picks).
              </p>
              <button type="button" onClick={() => navigate('/login')}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{ background: '#0f172a' }}>
                Sign in
              </button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  )
}
