import { formatOdds, SPORTSBOOKS, SPORTSBOOK_LABELS } from '../lib/oddsApi'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

function OddsCell({ spread, spreadOdds, total, totalOdds, ml, isBestSpread, isBestTotal, isBestMl }) {
  const best = isBestSpread || isBestTotal || isBestMl

  return (
    <div
      className="flex flex-col rounded-lg overflow-hidden"
      style={{
        border: `1px solid ${best ? 'var(--green)' : 'var(--border)'}`,
        background: best ? 'var(--odds-bg-best)' : 'var(--odds-bg)',
        minWidth: 76,
        flex: '1 1 0',
      }}
    >
      {/* Away: spread */}
      <div className="flex items-center justify-between px-2 py-1.5"
        style={{ borderBottom: '1px solid var(--border-light)' }}>
        <span className="font-mono text-xs font-semibold"
          style={{ color: isBestSpread ? 'var(--green)' : 'var(--text-primary)' }}>
          {spread != null ? `${spread > 0 ? '+' : ''}${spread}` : '—'}
        </span>
        <span className="font-mono text-xs ml-1"
          style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
          {spreadOdds != null ? formatOdds(spreadOdds) : ''}
        </span>
      </div>
      {/* Home: total */}
      <div className="flex items-center justify-between px-2 py-1.5"
        style={{ borderBottom: '1px solid var(--border-light)' }}>
        <span className="font-mono text-xs"
          style={{ color: 'var(--text-secondary)' }}>
          {total != null ? `o${total}` : '—'}
        </span>
        <span className="font-mono text-xs ml-1"
          style={{ color: isBestTotal ? 'var(--green)' : 'var(--text-secondary)', fontSize: 11 }}>
          {totalOdds != null ? formatOdds(totalOdds) : ''}
        </span>
      </div>
      {/* ML row - away/home stacked */}
      <div className="flex flex-col px-2 py-1">
        <span className="font-mono text-xs font-semibold text-center"
          style={{ color: isBestMl ? 'var(--green)' : 'var(--text-primary)' }}>
          {ml?.away != null ? formatOdds(ml.away) : '—'}
        </span>
        <span className="font-mono text-xs font-semibold text-center"
          style={{ color: isBestMl ? 'var(--green)' : 'var(--text-primary)' }}>
          {ml?.home != null ? formatOdds(ml.home) : '—'}
        </span>
      </div>
    </div>
  )
}

export default function MatchupCard({ game, onSelect }) {
  const gameTime = new Date(game.commenceTime)
  const isLive = gameTime < new Date()
  const timeLabel = isLive ? 'LIVE' : format(gameTime, 'EEE M/d · h:mm a')

  // Collect data per book
  const bookData = {}
  SPORTSBOOKS.forEach(book => {
    const markets = game.bookmakers?.[book]
    if (!markets) return
    const h2h = markets.h2h || []
    const spreads = markets.spreads || []
    const totals = markets.totals || []

    bookData[book] = {
      awaySpread: spreads.find(o => o.name === game.away)?.point ?? null,
      awaySpreadOdds: spreads.find(o => o.name === game.away)?.price ?? null,
      homeSpread: spreads.find(o => o.name === game.home)?.point ?? null,
      homeSpreadOdds: spreads.find(o => o.name === game.home)?.price ?? null,
      overPoint: totals.find(o => o.name === 'Over')?.point ?? null,
      overOdds: totals.find(o => o.name === 'Over')?.price ?? null,
      underPoint: totals.find(o => o.name === 'Under')?.point ?? null,
      underOdds: totals.find(o => o.name === 'Under')?.price ?? null,
      awayMl: h2h.find(o => o.name === game.away)?.price ?? null,
      homeMl: h2h.find(o => o.name === game.home)?.price ?? null,
    }
  })

  const availableBooks = SPORTSBOOKS.filter(b => bookData[b])

  // Find best values
  const bestAwaySpreadOdds = Math.max(...availableBooks.map(b => bookData[b].awaySpreadOdds ?? -Infinity))
  const bestOverOdds = Math.max(...availableBooks.map(b => bookData[b].overOdds ?? -Infinity))
  const bestAwayMl = Math.max(...availableBooks.map(b => bookData[b].awayMl ?? -Infinity))
  const bestHomeMl = Math.max(...availableBooks.map(b => bookData[b].homeMl ?? -Infinity))

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer mb-3"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onClick={() => onSelect && onSelect(game)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ background: 'var(--bg-header)' }}>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1.5">
              <span className="live-dot w-2 h-2 rounded-full inline-block" style={{ background: '#4ade80' }} />
              <span className="text-xs font-bold text-white">LIVE</span>
            </span>
          ) : (
            <span className="text-xs font-semibold text-white opacity-90">{timeLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>
            {availableBooks.length} books
          </span>
          <span className="text-xs text-white opacity-60 ml-1">· Tap to compare</span>
        </div>
      </div>

      {/* Teams */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center mb-1">
          <span className="font-semibold text-sm w-32 shrink-0" style={{ color: 'var(--text-primary)' }}>
            {game.away}
          </span>
          <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>↑ Away</span>
        </div>
        <div className="flex items-center">
          <span className="font-semibold text-sm w-32 shrink-0" style={{ color: 'var(--text-primary)' }}>
            {game.home}
          </span>
          <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>⌂ Home</span>
        </div>
      </div>

      {/* Book column headers */}
      {availableBooks.length > 0 && (
        <div className="flex items-center gap-2 px-4 pt-2 pb-1">
          <div style={{ width: 0, flex: '0 0 0' }} />
          {availableBooks.map(book => (
            <div key={book} className="text-center flex-1" style={{ minWidth: 76 }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                {SPORTSBOOK_LABELS[book] || book}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Sub-headers: Spread / Total / ML */}
      <div className="flex items-center gap-2 px-4 pb-1">
        {availableBooks.map(book => (
          <div key={book} className="flex-1 text-center" style={{ minWidth: 76 }}>
            <div className="flex justify-between px-1" style={{ fontSize: 9, color: 'var(--text-muted)' }}>
              <span>SPR</span>
              <span>TOT</span>
            </div>
          </div>
        ))}
      </div>

      {/* Odds grid */}
      <div className="flex gap-2 px-4 pb-3">
        {availableBooks.map(book => {
          const b = bookData[book]
          const isBestSpread = b.awaySpreadOdds === bestAwaySpreadOdds && b.awaySpreadOdds != null
          const isBestTotal = b.overOdds === bestOverOdds && b.overOdds != null
          const isBestMl = b.awayMl === bestAwayMl && b.awayMl != null

          return (
            <OddsCell
              key={book}
              spread={b.awaySpread}
              spreadOdds={b.awaySpreadOdds}
              total={b.overPoint}
              totalOdds={b.overOdds}
              ml={{ away: b.awayMl, home: b.homeMl }}
              isBestSpread={isBestSpread}
              isBestTotal={isBestTotal}
              isBestMl={isBestMl}
            />
          )
        })}
      </div>
    </div>
  )
}
