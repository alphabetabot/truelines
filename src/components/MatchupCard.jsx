import { formatOdds, SPORTSBOOKS, SPORTSBOOK_LABELS } from '../lib/oddsApi'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

function OddsBox({ label, point, odds, isBest }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg"
      style={{
        border: `1px solid ${isBest ? 'var(--accent)' : 'var(--border)'}`,
        background: isBest ? 'var(--odds-bg-best)' : 'var(--bg-primary)',
        minWidth: 68,
        height: 54,
        padding: '4px 8px',
      }}
    >
      {point != null && (
        <span className="font-bold text-sm" style={{ color: isBest ? 'var(--accent)' : 'var(--text-primary)' }}>
          {point}
        </span>
      )}
      {odds != null && (
        <span className="text-xs" style={{ color: isBest ? 'var(--accent)' : 'var(--text-secondary)' }}>
          {formatOdds(odds)}
        </span>
      )}
      {point == null && odds == null && (
        <span style={{ color: 'var(--text-muted)' }}>—</span>
      )}
    </div>
  )
}

function MLBox({ ml, isBest }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg"
      style={{
        border: `1px solid ${isBest ? 'var(--accent)' : 'var(--border)'}`,
        background: isBest ? 'var(--odds-bg-best)' : 'var(--bg-primary)',
        minWidth: 72,
        height: 54,
        padding: '4px 8px',
      }}
    >
      <span className="font-bold text-sm" style={{ color: isBest ? 'var(--accent)' : 'var(--text-primary)' }}>
        {ml != null ? formatOdds(ml) : '—'}
      </span>
    </div>
  )
}

export default function MatchupCard({ game, onSelect }) {
  const gameTime = new Date(game.commenceTime)
  const isLive = gameTime < new Date()
  const timeLabel = isLive ? 'LIVE' : format(gameTime, 'EEE M/d · h:mm a')

  const getBestOdds = () => {
    const books = Object.entries(game.bookmakers || {})
    if (!books.length) return null

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
        bestAwaySpread = { point: awaySpread.point, price: awaySpread.price }
      if (homeSpread && (!bestHomeSpread || homeSpread.price > bestHomeSpread.price))
        bestHomeSpread = { point: homeSpread.point, price: homeSpread.price }
      if (over && (!bestOver || over.price > bestOver.price))
        bestOver = { point: over.point, price: over.price }
      if (under && (!bestUnder || under.price > bestUnder.price))
        bestUnder = { point: under.point, price: under.price }
      if (awayMl && (!bestAwayMl || awayMl.price > bestAwayMl.price))
        bestAwayMl = { price: awayMl.price }
      if (homeMl && (!bestHomeMl || homeMl.price > bestHomeMl.price))
        bestHomeMl = { price: homeMl.price }
    })

    return { bestAwaySpread, bestHomeSpread, bestOver, bestUnder, bestAwayMl, bestHomeMl }
  }

  const odds = getBestOdds()
  const bookCount = Object.keys(game.bookmakers || {}).length

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer mb-3 transition-all hover:brightness-110"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
      onClick={() => onSelect && onSelect(game)}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2"
        style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1.5">
              <span className="live-dot w-2 h-2 rounded-full" style={{ background: 'var(--accent)', display: 'inline-block' }} />
              <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>LIVE</span>
            </span>
          ) : (
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{timeLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-3 pr-1">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)', minWidth: 68, textAlign: 'center' }}>SPREAD</span>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)', minWidth: 68, textAlign: 'center' }}>TOTAL</span>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)', minWidth: 72, textAlign: 'center' }}>ML</span>
        </div>
      </div>

      {/* Away row */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-light)' }}>
        <span className="font-semibold text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{game.away}</span>
        <div className="flex items-center gap-2">
          <OddsBox
            point={odds?.bestAwaySpread?.point != null ? `${odds.bestAwaySpread.point > 0 ? '+' : ''}${odds.bestAwaySpread.point}` : null}
            odds={odds?.bestAwaySpread?.price}
          />
          <OddsBox
            point={odds?.bestOver?.point != null ? `o${odds.bestOver.point}` : null}
            odds={odds?.bestOver?.price}
          />
          <MLBox ml={odds?.bestAwayMl?.price} isBest={true} />
        </div>
      </div>

      {/* Home row */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-semibold text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{game.home}</span>
        <div className="flex items-center gap-2">
          <OddsBox
            point={odds?.bestHomeSpread?.point != null ? `${odds.bestHomeSpread.point > 0 ? '+' : ''}${odds.bestHomeSpread.point}` : null}
            odds={odds?.bestHomeSpread?.price}
          />
          <OddsBox
            point={odds?.bestUnder?.point != null ? `u${odds.bestUnder.point}` : null}
            odds={odds?.bestUnder?.price}
          />
          <MLBox ml={odds?.bestHomeMl?.price} isBest={false} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2"
        style={{ background: 'var(--bg-primary)', borderTop: '1px solid var(--border-light)' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Best across {bookCount} book{bookCount !== 1 ? 's' : ''} · Tap to compare all
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Compare →</span>
      </div>
    </div>
  )
}
