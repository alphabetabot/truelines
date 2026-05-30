import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { useSportSelection } from '../hooks/useSportSelection'
import { trackCompareInteraction } from '../lib/analytics'
import { getOdds, parseOddsForComparison, SPORTS } from '../lib/oddsApi'
import SportSelector from '../components/SportSelector'
import LineCompareTable from '../components/LineCompareTable'
import OddsLoadError from '../components/OddsLoadError'
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
    // Apply navigation state once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['odds', sport],
    queryFn: () => getOdds(sport),
    staleTime: 30_000,
  })

  const games = data ? parseOddsForComparison(data) : []

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

      {isError && (
        <OddsLoadError message={error?.message} onRetry={() => refetch()} />
      )}

      {/* Game selector */}
      <div className="mb-6">
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          SELECT GAME
        </label>
        <div className="relative">
          <select
            value={selectedGame?.id || ''}
            onChange={e => {
              const g = games.find(x => x.id === e.target.value)
              setSelectedGame(g || null)
              if (g) {
                trackCompareInteraction('game_select', { sport_key: sport, game_id: g.id })
              }
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

      {/* Comparison table */}
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
