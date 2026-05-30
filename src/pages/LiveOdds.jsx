import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { getOdds, parseOddsForComparison, SPORTS } from '../lib/oddsApi'
import { getTodayProbablePitchers } from '../lib/mlbApi'
import SportSelector from '../components/SportSelector'
import MatchupCard from '../components/MatchupCard'
import Scores from './Scores'
import PerformanceTracker from '../components/PerformanceTracker'
import TodaysEdges from '../components/TodaysEdges'
import DailyPickTeaser from '../components/DailyPickTeaser'
import OddsGuestStrip from '../components/OddsGuestStrip'
import StickyOddsToolbar from '../components/StickyOddsToolbar'
import RecentlyViewedGames from '../components/RecentlyViewedGames'
import { addRecentGame } from '../lib/recentGames'
import { useSportSelection } from '../hooks/useSportSelection'
import { trackMatchupCardClick, trackMoreToolsEngagement, trackScoresTabOpen } from '../lib/analytics'
import { RefreshCw, Search, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

const TABS = ['Odds', 'Scores']
const COMPACT_SHIMMER_HEIGHT = 176

export default function LiveOdds() {
  const [sport, setSport] = useSportSelection('odds')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('Odds')
  const [stickyVisible, setStickyVisible] = useState(false)
  const stickAnchorRef = useRef(null)
  const tabsRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const showTracker =
    new URLSearchParams(location.search).get('tracker') === '1' ||
    location.hash === '#pick-tracker'

  useEffect(() => {
    if (!showTracker) return
    const timer = window.setTimeout(() => {
      document.getElementById('pick-tracker')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [showTracker])

  useEffect(() => {
    const onScroll = () => {
      const el = stickAnchorRef.current
      if (!el) return
      setStickyVisible(el.getBoundingClientRect().top < 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['odds', sport],
    queryFn: () => getOdds(sport),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  const allGames = data ? parseOddsForComparison(data) : []
  const displayGames = allGames.filter(g =>
    search === '' ||
    g.home.toLowerCase().includes(search.toLowerCase()) ||
    g.away.toLowerCase().includes(search.toLowerCase())
  )

  const sportLabel = SPORTS.find(s => s.key === sport)?.label || 'Games'
  const isMLB = sport === 'baseball_mlb'

  const { data: pitchers = {} } = useQuery({
    queryKey: ['mlb-pitchers'],
    queryFn: getTodayProbablePitchers,
    enabled: isMLB,
    staleTime: 300_000,
  })

  function handleTabChange(tab) {
    setActiveTab(tab)
    if (tab === 'Scores') trackScoresTabOpen(sport, 'odds')
  }

  function handleSportChange(nextSport, source = 'manual') {
    setSport(nextSport, source)
    setSearch('')
    setActiveTab('Odds')
  }

  function openCompare(game) {
    trackMatchupCardClick({ sportKey: sport, gameId: game.id, action: 'compare' })
    addRecentGame(game, sport)
    navigate('/compare', { state: { game } })
  }

  function handleStickyTab(tab) {
    setActiveTab(tab)
    if (tab === 'Scores') trackScoresTabOpen(sport, 'odds_sticky')
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{ paddingTop: stickyVisible ? 40 : 0 }}>
      <StickyOddsToolbar
        visible={stickyVisible}
        sport={sport}
        activeTab={activeTab}
        onSportChange={handleSportChange}
        onTabChange={handleStickyTab}
      />

      <OddsGuestStrip />

      <SportSelector selected={sport} onChange={s => handleSportChange(s, 'selector')} />

      <div ref={stickAnchorRef} aria-hidden className="h-0" />

      <RecentlyViewedGames page="odds" sportKey={sport} />

      <div ref={tabsRef} className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex gap-2">
          {TABS.map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className="px-4 py-1.5 rounded-xl text-sm transition-all"
              style={{
                background: activeTab === tab ? '#0f172a' : '#ffffff',
                color: activeTab === tab ? '#ffffff' : '#475569',
                border: `1.5px solid ${activeTab === tab ? '#0f172a' : '#e2e8f0'}`,
                fontWeight: activeTab === tab ? 700 : 500,
                boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Odds' && (
          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            {dataUpdatedAt > 0 && (
              <span className="text-xs hidden sm:inline shrink-0" style={{ color: '#94a3b8' }}>
                {sportLabel} · {format(new Date(dataUpdatedAt), 'h:mm a')}
              </span>
            )}
            <div className="relative shrink-0">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2"
                style={{ color: '#94a3b8' }}
              />
              <input
                type="search"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none"
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                  width: 120,
                  maxWidth: '36vw',
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs shrink-0"
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                opacity: isFetching ? 0.5 : 1,
              }}
            >
              <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === 'Scores' && <Scores sport={sport} />}

      {activeTab === 'Odds' && (
        <>
          {isError && (
            <div
              className="flex items-start gap-3 p-3 rounded-xl mb-3"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
            >
              <AlertTriangle size={16} style={{ color: '#dc2626' }} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm" style={{ color: '#dc2626' }}>
                  Failed to load odds
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                  {error?.message}
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="shimmer rounded-2xl"
                  style={{ height: COMPACT_SHIMMER_HEIGHT, border: '1px solid #e2e8f0' }}
                />
              ))}
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {displayGames.length === 0 ? (
                <div className="text-center py-12">
                  <p style={{ color: '#94a3b8' }}>
                    {allGames.length === 0
                      ? `No upcoming ${sportLabel} games`
                      : 'No games match your search'}
                  </p>
                </div>
              ) : (
                displayGames.map(game => (
                  <MatchupCard
                    key={game.id}
                    game={game}
                    isMLB={isMLB}
                    pitchers={pitchers}
                    compact
                    onSelect={openCompare}
                  />
                ))
              )}

              <DailyPickTeaser />
            </>
          )}
        </>
      )}

      {activeTab === 'Odds' && (
        <section className="mt-6 pt-5" style={{ borderTop: '1px solid #e2e8f0' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>
            More tools
          </p>
          <TodaysEdges />
          <PerformanceTracker
            defaultExpanded={showTracker}
            trackerAnchor={showTracker}
            onEngage={() => trackMoreToolsEngagement('pick_tracker')}
          />
        </section>
      )}
    </div>
  )
}
