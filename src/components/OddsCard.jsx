import { formatOdds, SPORTSBOOK_LABELS } from '../lib/oddsApi'
import { Clock, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getOddsGameTimeLabel } from '../lib/gameStatus'

function OddsBadge({ price, best = false }) {
  if (!price && price !== 0) return <span style={{ color: 'var(--text-secondary)' }}>—</span>
  return (
    <span
      className="font-mono font-semibold text-sm"
      style={{
        color: best ? 'var(--green)' : 'var(--text-primary)',
        textShadow: best ? '0 0 8px rgba(34,197,94,0.5)' : 'none',
      }}
    >
      {formatOdds(price)}
    </span>
  )
}

function TeamRow({ name, ml, spread, bestMl, bestSpread }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="font-medium text-sm truncate flex-1 mr-4" style={{ color: 'var(--text-primary)' }}>
        {name}
      </span>
      <div className="flex items-center gap-6">
        <div className="text-center w-16">
          <OddsBadge price={ml} best={bestMl} />
        </div>
        <div className="text-center w-20">
          {spread ? (
            <div>
              <span className="text-xs mr-1" style={{ color: 'var(--text-secondary)' }}>
                {spread.point > 0 ? '+' : ''}{spread.point}
              </span>
              <OddsBadge price={spread.price} best={bestSpread} />
            </div>
          ) : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
        </div>
      </div>
    </div>
  )
}

export default function OddsCard({ game, onSelect }) {
  const gameTime = new Date(game.commenceTime)
  const scheduledLabel = getOddsGameTimeLabel(game.commenceTime)
  const timeLabel = formatDistanceToNow(gameTime, { addSuffix: true })

  // Get best available ML odds
  const allMlOdds = { home: [], away: [] }
  Object.entries(game.bookmakers || {}).forEach(([book, markets]) => {
    const h2h = markets.h2h
    if (h2h) {
      const home = h2h.find(o => o.name === game.home)
      const away = h2h.find(o => o.name === game.away)
      if (home) allMlOdds.home.push({ price: home.price, book })
      if (away) allMlOdds.away.push({ price: away.price, book })
    }
  })

  const bestHomeMl = allMlOdds.home.reduce((best, cur) => (!best || cur.price > best.price ? cur : best), null)
  const bestAwayMl = allMlOdds.away.reduce((best, cur) => (!best || cur.price > best.price ? cur : best), null)

  // Get best spread
  const allSpreads = { home: [], away: [] }
  Object.entries(game.bookmakers || {}).forEach(([book, markets]) => {
    const spreads = markets.spreads
    if (spreads) {
      const home = spreads.find(o => o.name === game.home)
      const away = spreads.find(o => o.name === game.away)
      if (home) allSpreads.home.push({ price: home.price, point: home.point, book })
      if (away) allSpreads.away.push({ price: away.price, point: away.point, book })
    }
  })

  const bestHomeSpread = allSpreads.home.reduce((best, cur) => (!best || cur.price > best.price ? cur : best), null)
  const bestAwaySpread = allSpreads.away.reduce((best, cur) => (!best || cur.price > best.price ? cur : best), null)

  // Totals
  const allTotals = { over: [], under: [] }
  Object.entries(game.bookmakers || {}).forEach(([book, markets]) => {
    const totals = markets.totals
    if (totals) {
      const over = totals.find(o => o.name === 'Over')
      const under = totals.find(o => o.name === 'Under')
      if (over) allTotals.over.push({ price: over.price, point: over.point, book })
      if (under) allTotals.under.push({ price: under.price, point: under.point, book })
    }
  })

  const bestOver = allTotals.over.reduce((best, cur) => (!best || cur.price > best.price ? cur : best), null)
  const bestUnder = allTotals.under.reduce((best, cur) => (!best || cur.price > best.price ? cur : best), null)

  const bookCount = Object.keys(game.bookmakers || {}).length

  return (
    <div
      className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01]"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
      onClick={() => onSelect && onSelect(game)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <Clock size={12} />
            {scheduledLabel}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {bookCount} book{bookCount !== 1 ? 's' : ''}
          </span>
          <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex-1" />
        <div className="flex items-center gap-6">
          <span className="text-xs w-16 text-center" style={{ color: 'var(--text-secondary)' }}>ML</span>
          <span className="text-xs w-20 text-center" style={{ color: 'var(--text-secondary)' }}>Spread</span>
        </div>
      </div>

      {/* Away team */}
      <TeamRow
        name={game.away}
        ml={bestAwayMl?.price}
        spread={bestAwaySpread}
        bestMl={true}
        bestSpread={true}
      />

      <div style={{ borderTop: '1px solid var(--border)' }} />

      {/* Home team */}
      <TeamRow
        name={game.home}
        ml={bestHomeMl?.price}
        spread={bestHomeSpread}
        bestMl={true}
        bestSpread={true}
      />

      {/* Total */}
      {(bestOver || bestUnder) && (
        <div className="mt-2 pt-2 flex items-center gap-4" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total</span>
          {bestOver && (
            <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>
              O{bestOver.point} <span style={{ color: 'var(--green)' }}>{formatOdds(bestOver.price)}</span>
            </span>
          )}
          {bestUnder && (
            <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>
              U{bestUnder.point} <span style={{ color: 'var(--green)' }}>{formatOdds(bestUnder.price)}</span>
            </span>
          )}
          {bestOver && (
            <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>
              via {SPORTSBOOK_LABELS[bestOver.book] || bestOver.book}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
