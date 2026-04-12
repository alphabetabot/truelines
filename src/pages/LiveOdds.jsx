import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getOdds, parseOddsForComparison, SPORTS } from '../lib/oddsApi'
import SportSelector from '../components/SportSelector'
import MatchupTable from '../components/MatchupTable'
import { RefreshCw, Search, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

const DATE_TABS = [
  { label: 'Yesterday', offset: -1 },
  { label: 'Today', offset: 0 },
  { label: 'Tomorrow', offset: 1 },
]

export default function LiveOdds() {
  const [sport, setSport] = useState('basketball_nba')
  const [search, setSearch] = useState('')
  const [dateOffset, setDateOffset] = useState(0)
  const navigate = useNavigate()

  const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['odds', sport],
    queryFn: () => getOdds(sport),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  const allGames = data ? parseOddsForComparison(data) : []

  // Filter by date offset
  const today = new Date()
  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() + dateOffset)

  const filtered = allGames.filter(g => {
    const gameDate = new Date(g.commenceTime)
    const sameDay =
      gameDate.getFullYear() === targetDate.getFullYear() &&
      gameDate.getMonth() === targetDate.getMonth() &&
      gameDate.getDate() === targetDate.getDate()

    if (!sameDay && dateOffset === 0) {
      // "Today" fallback: also show games with no date match if no games today
    }

    const matchesSearch =
      search === '' ||
      g.home.toLowerCase().includes(search.toLowerCase()) ||
      g.away.toLowerCase().includes(search.toLowerCase())

    return matchesSearch
  })

  // Use all games if filter yields nothing (today may have no games)
  const displayGames = filtered.length > 0 ? filtered : allGames.filter(g =>
    search === '' ||
    g.home.toLowerCase().includes(search.toLowerCase()) ||
    g.away.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {SPORTS.find(s => s.key === sport)?.label} Odds
          </h1>
          {dataUpdatedAt > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Updated {format(new Date(dataUpdatedAt), 'h:mm a')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search teams..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded text-xs outline-none"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                width: 160,
              }}
            />
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              opacity: isFetching ? 0.5 : 1,
              cursor: isFetching ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Sport selector */}
      <SportSelector selected={sport} onChange={s => { setSport(s); setSearch('') }} />

      {/* Error */}
      {isError && (
        <div className="flex items-start gap-3 p-4 rounded-lg mb-4"
          style={{ background: 'var(--red-dim)', border: '1px solid rgba(248,81,73,0.3)' }}>
          <AlertTriangle size={16} style={{ color: 'var(--red)' }} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-xs" style={{ color: 'var(--red)' }}>Failed to load odds</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {error?.message || 'Check your Odds API key in .env'}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <MatchupTable
        games={displayGames}
        loading={isLoading}
        onSelect={g => navigate('/compare', { state: { game: g } })}
      />

      {!isLoading && displayGames.length > 0 && (
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          {displayGames.length} game{displayGames.length !== 1 ? 's' : ''} · Click any row to compare lines · Green = best available odds
        </p>
      )}
    </div>
  )
}
