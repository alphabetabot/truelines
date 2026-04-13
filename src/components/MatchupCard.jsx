import { formatOdds, SPORTSBOOKS, SPORTSBOOK_LABELS } from '../lib/oddsApi'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

function OddsBox({ point, odds, isOver, isBest }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded"
      style={{
        border: `1.5px solid ${isBest ? '#16a34a' : 'var(--odds-border)'}`,
        background: isBest ? '#f0fdf4' : 'var(--odds-bg)',
        minWidth: 64,
        height: 52,
        padding: '2px 6px',
      }}
    >
      <span className="font-bold text-sm" style={{ color: isBest ? '#16a34a' : 'var(--text-primary)' }}>
        {point != null
          ? `${isOver === true ? 'o' : isOver === false ? 'u' : point > 0 ? '+' : ''}${point}`
          : '—'}
      </span>
      {odds != null && (
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {formatOdds(odds)}
        </span>
      )}
    </div>
  )
}

function MLBox({ ml, isBest }) {
  return (
    <div
      className="flex items-center justify-center rounded"
      style={{
        border: `1.5px solid ${isBest ? '#16a34a' : 'var(--odds-border)'}`,
        background: isBest ? '#f0fdf4' : 'var(--odds-bg)',
        minWidth: 72,
        height: 52,
        padding: '2px 8px',
      }}
    >
      <span className="font-bold text-sm" style={{ color: isBest ? '#16a34a' : 'var(--text-primary)' }}>
        {ml != null ? formatOdds(ml) : '—'}
      </span>
    </div>
  )
}

export default function MatchupCard({ game, onSelect }) {
  const navigate = useNavigate()
  const gameTime = new Date(game.commenceTime)
  const isLive = gameTime < new Date()
  const timeLabel = isLive ? 'LIVE' : format(gameTime, 'EEE M/d · h:mm a')

  // Pick best book data (first available book with full odds)
  const getBestBookOdds = () => {
    // Collect all books
    const books = Object.entries(game.bookmakers || {})
    if (books.length === 0) return null

    // Find best spread, total, ml for each team
    let bestAwaySpread = null, bestHomeSpread = null
    let bestOver = null, bestUnder = null
    let bestAwayMl = null, bestHomeMl = null

    books.forEach(([book, markets]) => {
      const spreads = markets.spreads || []
      const totals = markets.totals || []
      const h2h = markets.h2h || []

      const awaySpread = spreads.find(o => o.name === game.away)
      const homeSpread = spreads.find(o => o.name === game.home)
      const over = totals.find(o => o.name === 'Over')
      const under = totals.find(o => o.name === 'Under')
      const awayMl = h2h.find(o => o.name === game.away)
      const homeMl = h2h.find(o => o.name === game.home)

      if (awaySpread && (!bestAwaySpread || awaySpread.price > bestAwaySpread.price))
        bestAwaySpread = { point: awaySpread.point, price: awaySpread.price, book }
      if (homeSpread && (!bestHomeSpread || homeSpread.price > bestHomeSpread.price))
        bestHomeSpread = { point: homeSpread.point, price: homeSpread.price, book }
      if (over && (!bestOver || over.price > bestOver.price))
        bestOver = { point: over.point, price: over.price, book }
      if (under && (!bestUnder || under.price > bestUnder.price))
        bestUnder = { point: under.point, price: under.price, book }
      if (awayMl && (!bestAwayMl || awayMl.price > bestAwayMl.price))
        bestAwayMl = { price: awayMl.price, book }
      if (homeMl && (!bestHomeMl || homeMl.price > bestHomeMl.price))
        bestHomeMl = { price: homeMl.price, book }
    })

    return { bestAwaySpread, bestHomeSpread, bestOver, bestUnder, bestAwayMl, bestHomeMl }
  }

  const odds = getBestBookOdds()
  const bookCount = Object.keys(game.bookmakers || {}).length

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer mb-3"
      style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}
      onClick={() => onSelect ? onSelect(game) : navigate('/compare', { state: { game: g } })}
    >
      {/* Blue header bar */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: 'var(--bg-header)' }}
      >
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1.5">
              <span className="live-dot w-2 h-2 rounded-full inline-block" style={{ background: '#4ade80' }} />
              <span className="text-xs font-bold text-white">LIVE</span>
            </span>
          ) : (
            <span className="text-xs font-semibold text-white">{timeLabel}</span>
          )}
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
            · {bookCount} book{bookCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.8)', minWidth: 64, textAlign: 'center' }}>SPREAD</span>
          <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.8)', minWidth: 64, textAlign: 'center' }}>TOTAL</span>
          <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.8)', minWidth: 72, textAlign: 'center' }}>ML</span>
        </div>
      </div>

      {/* Away team row */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex-1">
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{game.away}</span>
        </div>
        <div className="flex items-center gap-2">
          <OddsBox
            point={odds?.bestAwaySpread?.point}
            odds={odds?.bestAwaySpread?.price}
            isBest={false}
          />
          <OddsBox
            point={odds?.bestOver?.point}
            odds={odds?.bestOver?.price}
            isOver={true}
            isBest={false}
          />
          <MLBox ml={odds?.bestAwayMl?.price} isBest={true} />
        </div>
      </div>

      {/* Home team row */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex-1">
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{game.home}</span>
        </div>
        <div className="flex items-center gap-2">
          <OddsBox
            point={odds?.bestHomeSpread?.point}
            odds={odds?.bestHomeSpread?.price}
            isBest={false}
          />
          <OddsBox
            point={odds?.bestUnder?.point}
            odds={odds?.bestUnder?.price}
            isOver={false}
            isBest={false}
          />
          <MLBox ml={odds?.bestHomeMl?.price} isBest={false} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-1.5"
        style={{ background: '#f8fafc', borderTop: '1px solid var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Best odds across {bookCount} sportsbooks · Tap to compare
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
          Details →
        </span>
      </div>
    </div>
  )
}
