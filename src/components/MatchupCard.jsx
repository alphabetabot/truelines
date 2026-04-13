import { formatOdds } from '../lib/oddsApi'
import { format } from 'date-fns'

function BigOddsBox({ label, value, subValue, isBest }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl"
      style={{
        border: `2px solid ${isBest ? '#16a34a' : '#e2e8f0'}`,
        background: isBest ? '#f0fdf4' : '#f8fafc',
        flex: 1,
        minWidth: 72,
        height: 70,
        padding: '6px 8px',
      }}
    >
      <span className="text-xs font-semibold mb-1" style={{ color: '#94a3b8' }}>{label}</span>
      <span className="font-bold text-base" style={{ color: isBest ? '#16a34a' : '#0f172a', lineHeight: 1.1 }}>
        {value ?? '—'}
      </span>
      {subValue != null && (
        <span className="text-xs mt-0.5" style={{ color: isBest ? '#16a34a' : '#64748b' }}>
          {formatOdds(subValue)}
        </span>
      )}
    </div>
  )
}

function BettingBar({ awayTeam, homeTeam, awayPct, homePct, label }) {
  return (
    <div className="mb-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium" style={{ color: '#64748b' }}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold w-8 text-right" style={{ color: '#f59e0b' }}>{awayPct}%</span>
        <div className="flex-1 flex rounded-full overflow-hidden" style={{ height: 8, background: '#e2e8f0' }}>
          <div style={{ width: `${awayPct}%`, background: '#f59e0b' }} />
          <div style={{ width: `${homePct}%`, background: '#3b82f6' }} />
        </div>
        <span className="text-xs font-bold w-8" style={{ color: '#3b82f6' }}>{homePct}%</span>
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-xs" style={{ color: '#94a3b8', maxWidth: 100 }} className="truncate">{awayTeam}</span>
        <span className="text-xs" style={{ color: '#94a3b8', maxWidth: 100, textAlign: 'right' }} className="truncate">{homeTeam}</span>
      </div>
    </div>
  )
}

export default function MatchupCard({ game, onSelect }) {
  const gameTime = new Date(game.commenceTime)
  const isLive = gameTime < new Date()
  const timeLabel = isLive ? 'LIVE' : format(gameTime, 'EEE M/d · h:mm a')

  // Find best odds across all books
  const books = Object.entries(game.bookmakers || {})

  let bestAwayMl = null, bestHomeMl = null
  let bestAwaySpread = null, bestAwaySpreadOdds = null
  let bestHomeSpread = null, bestHomeSpreadOdds = null
  let bestOver = null, bestOverOdds = null
  let bestUnder = null, bestUnderOdds = null

  books.forEach(([book, markets]) => {
    const h2h = markets.h2h || []
    const spreads = markets.spreads || []
    const totals = markets.totals || []

    const awayMl = h2h.find(o => o.name === game.away)?.price
    const homeMl = h2h.find(o => o.name === game.home)?.price
    const awaySpread = spreads.find(o => o.name === game.away)
    const homeSpread = spreads.find(o => o.name === game.home)
    const over = totals.find(o => o.name === 'Over')
    const under = totals.find(o => o.name === 'Under')

    if (awayMl != null && (bestAwayMl == null || awayMl > bestAwayMl)) bestAwayMl = awayMl
    if (homeMl != null && (bestHomeMl == null || homeMl > bestHomeMl)) bestHomeMl = homeMl
    if (awaySpread && (bestAwaySpreadOdds == null || awaySpread.price > bestAwaySpreadOdds)) {
      bestAwaySpread = awaySpread.point; bestAwaySpreadOdds = awaySpread.price
    }
    if (homeSpread && (bestHomeSpreadOdds == null || homeSpread.price > bestHomeSpreadOdds)) {
      bestHomeSpread = homeSpread.point; bestHomeSpreadOdds = homeSpread.price
    }
    if (over && (bestOverOdds == null || over.price > bestOverOdds)) {
      bestOver = over.point; bestOverOdds = over.price
    }
    if (under && (bestUnderOdds == null || under.price > bestUnderOdds)) {
      bestUnder = under.point; bestUnderOdds = under.price
    }
  })

  const bookCount = books.length

  // Simulated public betting % (real data requires paid API)
  // Using implied probability as a proxy
  const awayImpl = bestAwayMl != null
    ? bestAwayMl > 0 ? 100 / (bestAwayMl + 100) : Math.abs(bestAwayMl) / (Math.abs(bestAwayMl) + 100)
    : 0.5
  const awayBetPct = Math.round((1 - awayImpl) * 100)
  const homeBetPct = 100 - awayBetPct

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer mb-3 transition-all hover:shadow-md"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onClick={() => onSelect && onSelect(game)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2"
        style={{ background: '#1e293b' }}>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1.5">
              <span className="live-dot w-2 h-2 rounded-full inline-block" style={{ background: '#4ade80' }} />
              <span className="text-xs font-bold" style={{ color: '#4ade80' }}>LIVE</span>
            </span>
          ) : (
            <span className="text-xs font-semibold" style={{ color: '#ffffff' }}>{timeLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#94a3b8' }}>{bookCount} books</span>
          <span className="text-xs font-medium" style={{ color: '#f59e0b' }}>Compare →</span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-3">
        {/* Teams */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-base mb-1" style={{ color: '#0f172a' }}>{game.away}</div>
            <div className="font-bold text-base" style={{ color: '#0f172a' }}>{game.home}</div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#f1f5f9', color: '#64748b' }}>
            @ {game.home.split(' ').slice(-1)[0]}
          </span>
        </div>

        {/* Odds boxes — Away row */}
        <div className="flex gap-2 mb-2">
          <BigOddsBox
            label="ML"
            value={bestAwayMl != null ? formatOdds(bestAwayMl) : null}
            isBest={bestAwayMl != null && bestAwayMl > 0}
          />
          <BigOddsBox
            label="SPREAD"
            value={bestAwaySpread != null ? `${bestAwaySpread > 0 ? '+' : ''}${bestAwaySpread}` : null}
            subValue={bestAwaySpreadOdds}
          />
          <BigOddsBox
            label="TOTAL"
            value={bestOver != null ? `o${bestOver}` : null}
            subValue={bestOverOdds}
          />
        </div>

        {/* Odds boxes — Home row */}
        <div className="flex gap-2 mb-4">
          <BigOddsBox
            label="ML"
            value={bestHomeMl != null ? formatOdds(bestHomeMl) : null}
            isBest={bestHomeMl != null && bestHomeMl > 0}
          />
          <BigOddsBox
            label="SPREAD"
            value={bestHomeSpread != null ? `${bestHomeSpread > 0 ? '+' : ''}${bestHomeSpread}` : null}
            subValue={bestHomeSpreadOdds}
          />
          <BigOddsBox
            label="TOTAL"
            value={bestUnder != null ? `u${bestUnder}` : null}
            subValue={bestUnderOdds}
          />
        </div>

        {/* Public betting bars */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
          <BettingBar
            awayTeam={game.away}
            homeTeam={game.home}
            awayPct={awayBetPct}
            homePct={homeBetPct}
            label="% OF BETS (implied)"
          />
        </div>
      </div>
    </div>
  )
}
