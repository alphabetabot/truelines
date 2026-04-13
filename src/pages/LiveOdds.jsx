import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getOdds, parseOddsForComparison, SPORTS } from '../lib/oddsApi'
import SportSelector from '../components/SportSelector'
import MatchupCard from '../components/MatchupCard'
import { RefreshCw, Search, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

export default function LiveOdds() {
  const [sport, setSport] = useState('basketball_nba')
  const [search, setSearch] = useState('')
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {sportLabel} Odds
          </h1>
          {dataUpdatedAt > 0 && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Updated {format(new Date(dataUpdatedAt), 'h:mm a')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search teams..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-lg text-xs outline-none"
              style={{
                background: '#fff',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                width: 150,
              }}
            />
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all"
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              opacity: isFetching ? 0.5 : 1,
            }}
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <SportSelector selected={sport} onChange={s => { setSport(s); setSearch('') }} />

      {/* Error */}
      {isError && (
        <div className="flex items-start gap-3 p-4 rounded-xl mb-4"
          style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <AlertTriangle size={16} style={{ color: '#dc2626' }} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm" style={{ color: '#dc2626' }}>Failed to load odds</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {error?.message || 'Check your Odds API key'}
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shimmer rounded-xl" style={{ height: 130, border: '1px solid var(--border)' }} />
          ))}
        </div>
      )}

      {/* Cards */}
      {!isLoading && !isError && (
        <>
          {displayGames.length === 0 ? (
            <div className="text-center py-16">
              <p style={{ color: 'var(--text-secondary)' }}>
                {allGames.length === 0 ? `No upcoming ${sportLabel} games with odds` : 'No games match your search'}
              </p>
            </div>
          ) : (
            <div>
              {displayGames.map(game => (
                <MatchupCard
                  key={game.id}
                  game={game}
                  onSelect={g => navigate('/compare', { state: { game: g } })}
                />
              ))}
            </div>
          )}
          {displayGames.length > 0 && (
            <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
              {displayGames.length} game{displayGames.length !== 1 ? 's' : ''} · Best odds shown · Tap any card to compare all books
            </p>
          )}
        </>
      )}
    </div>
  )
}
