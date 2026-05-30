import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { useSportSelection } from '../hooks/useSportSelection'
import { trackCompareInteraction } from '../lib/analytics'
import { getOdds, parseOddsForComparison } from '../lib/oddsApi'
import SportSelector from '../components/SportSelector'
import LineCompareTable from '../components/LineCompareTable'
import OddsLoadError from '../components/OddsLoadError'
import RecentlyViewedGames from '../components/RecentlyViewedGames'
import GamePrevNextNav from '../components/GamePrevNextNav'
import { addRecentGame } from '../lib/recentGames'
import { sortGamesByTime } from '../lib/gameNavigation'
import { ChevronDown, BarChart2 } from 'lucide-react'

export default function LineCompare() {
  const location = useLocation()
  const preSelected = location.state?.game || null

  const [sport, setSport] = useSportSelection('compare')
  const [selectedGame, setSelectedGame] = useState(preSelected)

  useEffect(() => {
    if (!preSelected?.sport) return
    setSport(preSelected.sport, 'deep_link')
    setSelectedGame(preSelected)
    addRecentGame(preSelected, preSelected.sport)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['odds', sport],
    queryFn: () => getOdds(sport),
    staleTime: 30_000,
  })

  const games = sortGamesByTime(data ? parseOddsForComparison(data) : [])

  useEffect(() => {
    if (!preSelected?.id || games.length === 0) return
    const match = games.find(g => g.id === preSelected.id)
    if (match) setSelectedGame(match)
  }, [games, preSelected?.id])

  function selectGame(g, source = 'dropdown') {
    setSelectedGame(g)
    if (g) {
      addRecentGame(g, sport)
      trackCompareInteraction(source, { sport_key: sport, game_id: g.id })
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Line Comparison
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Fast line shopping — compare all books side by side. Green = best available price.
        </p>
      </div>

      <SportSelector selected={sport} onChange={s => { setSport(s); setSelectedGame(null) }} />

      <RecentlyViewedGames
        page="compare"
        sportKey={sport}
        onSelect={g => selectGame(g, 'recent')}
      />

      {isError && (
        <OddsLoadError message={error?.message} onRetry={() => refetch()} />
      )}

      <GamePrevNextNav
        games={games}
        selectedGame={selectedGame}
        sportKey={sport}
        page="compare"
        onSelect={g => selectGame(g, 'prev_next')}
      />

      <div className="mb-6">
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          SELECT GAME
        </label>
        <div className="relative">
          <select
            value={selectedGame?.id || ''}
            onChange={e => {
              const g = games.find(x => x.id === e.target.value)
              selectGame(g || null, 'game_select')
            }}
            className="w-full appearance-none px-4 py-3 rounded-xl text-sm outline-none pr-10"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: selectedGame ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            <option value="">
              {isLoading ? 'Loading games...' : games.length === 0 ? 'No games available' : '— Choose a game —'}
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

      {selectedGame ? (
        <LineCompareTable game={selectedGame} />
      ) : (
        <div className="text-center py-20">
          <BarChart2 size={40} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--text-secondary)' }} />
          <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
            Select a game to compare lines
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--border)' }}>
            Or click any game card on the Live Odds tab
          </p>
        </div>
      )}
    </div>
  )
}
