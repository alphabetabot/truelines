import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { getRecentGames, formatRecentGameLabel } from '../lib/recentGames'
import { trackRecentGameClick } from '../lib/analytics'

/**
 * @param {'compare'|'analysis'|'odds'} page
 * @param {string} [sportKey] - filter to current sport when set
 */
export default function RecentlyViewedGames({ page, sportKey, onSelect }) {
  const navigate = useNavigate()
  const [recent, setRecent] = useState([])

  useEffect(() => {
    setRecent(getRecentGames())
  }, [sportKey])

  const filtered = sportKey
    ? recent.filter(g => g.sport === sportKey)
    : recent

  if (filtered.length === 0) return null

  function openGame(entry) {
    trackRecentGameClick(page, entry.sport, entry.id)
    const game = {
      id: entry.id,
      sport: entry.sport,
      away: entry.away,
      home: entry.home,
      commenceTime: entry.commenceTime,
    }
    if (onSelect) {
      onSelect(game)
      return
    }
    if (page === 'compare') {
      navigate('/compare', { state: { game } })
    } else if (page === 'analysis') {
      navigate('/analysis', { state: { game } })
    }
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Clock size={13} style={{ color: 'var(--text-muted)' }} />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Recently viewed
        </span>
      </div>
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {filtered.map(entry => (
          <button
            key={`${entry.sport}-${entry.id}`}
            type="button"
            onClick={() => openGame(entry)}
            className="shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            {formatRecentGameLabel(entry)}
          </button>
        ))}
      </div>
    </div>
  )
}
