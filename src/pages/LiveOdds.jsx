import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getOdds, parseOddsForComparison, SPORTS } from '../lib/oddsApi'
import { getTodayProbablePitchers } from '../lib/mlbApi'
import SportSelector from '../components/SportSelector'
import MatchupCard from '../components/MatchupCard'
import Scores from './Scores'
import PerformanceTracker from '../components/PerformanceTracker'
import HeroBanner from '../components/HeroBanner'
import TodaysEdges from '../components/TodaysEdges'
import DailyPick from '../components/DailyPick'
import { RefreshCw, Search, AlertTriangle, Trophy } from 'lucide-react'
import { format } from 'date-fns'

const TABS = ['Odds', 'Scores']

export default function LiveOdds() {
  const [sport, setSport] = useState('basketball_nba')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('Odds')
  const navigate = useNavigate()

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>
            {sportLabel} {activeTab}
          </h1>
          {activeTab === 'Odds' && dataUpdatedAt > 0 && (
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
              Updated {format(new Date(dataUpdatedAt), 'h:mm a')}
            </p>
          )}
        </div>
        {activeTab === 'Odds' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', width: 130 }}
              />
            </div>
            <button onClick={() => refetch()} disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
              style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', opacity: isFetching ? 0.5 : 1 }}>
              <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        )}
      </div>

      <HeroBanner />
      <DailyPick />
      <TodaysEdges />
      <PerformanceTracker />

      {/* Fantasy Sports Preview Banner */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate('/fantasy')}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/fantasy') } }}
        className="rounded-2xl p-4 mb-4 cursor-pointer flex items-center gap-3"
        style={{
          background: 'linear-gradient(135deg, #334155, #0f172a)',
          border: '1px solid #475569',
        }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f59e0b' }}>
          <Trophy size={20} style={{ color: '#0f172a' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-black mb-0.5" style={{ color: '#f59e0b' }}>DFS OPTIMIZER PREVIEW</div>
          <div className="text-xs" style={{ color: '#e2e8f0' }}>Sample research tool while live DFS data integration is in progress</div>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>Beta</span>
        <div className="font-bold text-lg flex-shrink-0" style={{ color: '#f59e0b' }}>›</div>
      </div>

      <SportSelector selected={sport} onChange={s => { setSport(s); setSearch(''); setActiveTab('Odds') }} />

      {/* Odds / Scores tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-5 py-2 rounded-xl text-sm transition-all"
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

      {/* Scores view */}
      {activeTab === 'Scores' && <Scores sport={sport} />}

      {/* Odds view */}
      {activeTab === 'Odds' && (
        <>
          {isError && (
            <div className="flex items-start gap-3 p-4 rounded-xl mb-4"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <AlertTriangle size={16} style={{ color: '#dc2626' }} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm" style={{ color: '#dc2626' }}>Failed to load odds</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{error?.message}</p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shimmer rounded-2xl" style={{ height: 200, border: '1px solid #e2e8f0' }} />
              ))}
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {displayGames.length === 0 ? (
                <div className="text-center py-16">
                  <p style={{ color: '#94a3b8' }}>
                    {allGames.length === 0 ? `No upcoming ${sportLabel} games` : 'No games match your search'}
                  </p>
                </div>
              ) : (
                displayGames.map(game => (
                  <MatchupCard
                    key={game.id}
                    game={game}
                    isMLB={isMLB}
                    pitchers={pitchers}
                    onSelect={g => navigate('/compare', { state: { game: g } })}
                  />
                ))
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
