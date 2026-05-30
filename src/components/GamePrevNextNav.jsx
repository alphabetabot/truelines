import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getAdjacentGames } from '../lib/gameNavigation'
import { trackGameNavPrevNext } from '../lib/analytics'

export default function GamePrevNextNav({
  games,
  selectedGame,
  sportKey,
  page,
  onSelect,
}) {
  if (!selectedGame || !games?.length) return null

  const { prev, next } = getAdjacentGames(games, selectedGame.id)
  if (!prev && !next) return null

  function go(game, direction) {
    if (!game) return
    trackGameNavPrevNext(page, direction, sportKey, game.id)
    onSelect(game)
  }

  const short = g => {
    const a = g.away?.split(' ').slice(-1)[0] || g.away
    const h = g.home?.split(' ').slice(-1)[0] || g.home
    return `${a} @ ${h}`
  }

  return (
    <div
      className="flex items-center justify-between gap-2 mb-4 px-3 py-2 rounded-xl"
      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
    >
      <button
        type="button"
        disabled={!prev}
        onClick={() => go(prev, 'prev')}
        className="flex items-center gap-1 text-xs font-bold min-h-[44px] px-2 disabled:opacity-40"
        style={{ color: prev ? '#0f172a' : '#94a3b8' }}
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">Previous</span>
      </button>
      <span className="text-xs font-semibold text-center truncate px-1" style={{ color: '#64748b' }}>
        {short(selectedGame)}
      </span>
      <button
        type="button"
        disabled={!next}
        onClick={() => go(next, 'next')}
        className="flex items-center gap-1 text-xs font-bold min-h-[44px] px-2 disabled:opacity-40"
        style={{ color: next ? '#0f172a' : '#94a3b8' }}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
