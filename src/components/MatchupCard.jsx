import { useState, useEffect } from 'react'
import { formatOdds, SPORTSBOOKS, SPORTSBOOK_LABELS, SPORTSBOOK_COLORS } from '../lib/oddsApi'
import { format } from 'date-fns'
import { ChevronDown } from 'lucide-react'
import { getTodayProbablePitchers } from '../lib/mlbApi'

const BET_TYPES = [
  { key: 'h2h', label: 'Moneyline' },
  { key: 'spreads', label: 'Spread' },
  { key: 'totals', label: 'Total' },
]

// MLB pitcher data - pulled from a public stats source when available
// We'll show TBD if not available since The Odds API doesn't include pitcher data
function PitcherLine({ team }) {
  return (
    <span className="text-xs" style={{ color: '#94a3b8' }}>
      P: TBD
    </span>
  )
}

export default function MatchupCard({ game, onSelect, isMLB = false, pitchers = {} }) {
  const [betType, setBetType] = useState('h2h')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const gameTime = new Date(game.commenceTime)
  const isLive = gameTime < new Date()
  const timeLabel = isLive ? 'LIVE' : format(gameTime, 'EEE M/d · h:mm a')
  const selectedLabel = BET_TYPES.find(b => b.key === betType)?.label

  // Build per-book data
  const bookRows = SPORTSBOOKS.map(book => {
    const markets = game.bookmakers?.[book]
    if (!markets || !markets[betType]) return null
    const market = markets[betType]

    if (betType === 'h2h') {
      const away = market.find(o => o.name === game.away)
      const home = market.find(o => o.name === game.home)
      if (!away && !home) return null
      return { book, awayVal: away ? formatOdds(away.price) : null, awayNum: away?.price ?? null, homeVal: home ? formatOdds(home.price) : null, homeNum: home?.price ?? null }
    }
    if (betType === 'spreads') {
      const away = market.find(o => o.name === game.away)
      const home = market.find(o => o.name === game.home)
      if (!away && !home) return null
      return {
        book,
        awayVal: away ? `${away.point > 0 ? '+' : ''}${away.point}` : null, awayNum: away?.price ?? null,
        homeVal: home ? `${home.point > 0 ? '+' : ''}${home.point}` : null, homeNum: home?.price ?? null,
        awayOdds: away?.price, homeOdds: home?.price,
      }
    }
    if (betType === 'totals') {
      const over = market.find(o => o.name === 'Over')
      const under = market.find(o => o.name === 'Under')
      if (!over && !under) return null
      return {
        book,
        awayVal: over ? `o${over.point}` : null, awayNum: over?.price ?? null,
        homeVal: under ? `u${under.point}` : null, homeNum: under?.price ?? null,
        awayOdds: over?.price, homeOdds: under?.price,
      }
    }
    return null
  }).filter(Boolean)

  // Best odds
  const bestAwayNum = bookRows.length ? Math.max(...bookRows.map(r => r.awayNum ?? -Infinity)) : null
  const bestHomeNum = bookRows.length ? Math.max(...bookRows.map(r => r.homeNum ?? -Infinity)) : null

  // Implied betting %
  const awayMl = Object.values(game.bookmakers || {}).map(m => m.h2h?.find(o => o.name === game.away)?.price).find(p => p != null)
  const awayImpl = awayMl != null ? (awayMl > 0 ? 100 / (awayMl + 100) : Math.abs(awayMl) / (Math.abs(awayMl) + 100)) : 0.5
  const awayBetPct = Math.round((1 - awayImpl) * 100)
  const homeBetPct = 100 - awayBetPct

  return (
    <div className="mb-3"
      style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderRadius: 8 }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2" style={{ background: '#1e293b' }}>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1.5">
              <span className="live-dot w-2 h-2 rounded-full inline-block" style={{ background: '#4ade80' }} />
              <span className="text-xs font-bold" style={{ color: '#4ade80' }}>LIVE</span>
            </span>
          ) : (
            <span className="text-xs font-semibold text-white">{timeLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Bet type dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold"
              style={{ background: '#f59e0b', color: '#1e293b' }}
            >
              {selectedLabel} <ChevronDown size={12} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-1 rounded-lg overflow-hidden z-20"
                style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 130 }}>
                {BET_TYPES.map(bt => (
                  <button key={bt.key}
                    onClick={() => { setBetType(bt.key); setDropdownOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium"
                    style={{ color: betType === bt.key ? '#2563eb' : '#0f172a', background: betType === bt.key ? '#eff6ff' : 'transparent' }}>
                    {bt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="text-xs font-medium" style={{ color: '#94a3b8' }}
            onClick={e => { e.stopPropagation(); onSelect && onSelect(game) }}>
            Details →
          </button>
        </div>
      </div>

      {/* Main odds area: sticky team names + scrollable book columns */}
      <div className="flex" style={{ overflowX: 'auto', overflowY: 'visible' }}>

        {/* Sticky left: team names */}
        <div className="shrink-0 sticky left-0 z-10" style={{ background: '#fff', borderRight: '2px solid #e2e8f0', minWidth: 140, overflow: 'visible' }}>
          {/* spacer for book name header */}
          <div style={{ height: 28, borderBottom: '1px solid #f1f5f9' }} />
          {/* Away */}
          <div className="flex flex-col justify-center px-3" style={{ height: 54, borderBottom: '1px solid #f1f5f9' }}>
            <span className="font-bold text-sm leading-tight" style={{ color: '#0f172a' }}>{game.away}</span>
            {isMLB && (
              <span className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                {(() => { const p = pitchers[game.away] || Object.entries(pitchers).find(([k]) => game.away.includes(k) || k.includes(game.away.split(' ').slice(-1)[0]))?.[1]; return p ? `${p.name} (${p.wins}-${p.losses}, ${p.era} ERA)` : 'P: TBD' })()}
              </span>
            )}
          </div>
          {/* Home */}
          <div className="flex flex-col justify-center px-3" style={{ height: 54 }}>
            <span className="font-bold text-sm leading-tight" style={{ color: '#0f172a' }}>{game.home}</span>
            {isMLB && (
              <span className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                {(() => { const p = pitchers[game.home] || Object.entries(pitchers).find(([k]) => game.home.includes(k) || k.includes(game.home.split(' ').slice(-1)[0]))?.[1]; return p ? `${p.name} (${p.wins}-${p.losses}, ${p.era} ERA)` : 'P: TBD' })()}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable book columns */}
        <div className="flex" style={{ minWidth: 0 }}>
          {bookRows.length === 0 ? (
            <div className="flex items-center px-6 py-4">
              <span className="text-sm" style={{ color: '#94a3b8' }}>No {selectedLabel} odds available</span>
            </div>
          ) : bookRows.map(row => {
            const isBestAway = row.awayNum === bestAwayNum && row.awayNum != null && isFinite(row.awayNum)
            const isBestHome = row.homeNum === bestHomeNum && row.homeNum != null && isFinite(row.homeNum)

            return (
              <div key={row.book} className="flex flex-col shrink-0" style={{ width: 96, borderRight: '1px solid #f1f5f9' }}>
                {/* Book name */}
                <div className="flex items-center justify-center" style={{ height: 28, borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                  <span className="font-black text-xs" style={{ color: SPORTSBOOK_COLORS[row.book] || '#64748b', fontSize: 10, letterSpacing: '-0.2px' }}>
                    {SPORTSBOOK_LABELS[row.book] || row.book}
                  </span>
                </div>

                {/* Away odds */}
                <div className="flex flex-col items-center justify-center"
                  style={{ height: 54, borderBottom: '1px solid #f1f5f9', background: isBestAway ? '#f0fdf4' : '#fff' }}>
                  <span className="font-bold text-sm" style={{ color: isBestAway ? '#16a34a' : '#0f172a' }}>
                    {row.awayVal ?? '—'}
                  </span>
                  {row.awayOdds != null && (
                    <span className="text-xs" style={{ color: isBestAway ? '#16a34a' : '#94a3b8' }}>
                      {formatOdds(row.awayOdds)}
                    </span>
                  )}
                </div>

                {/* Home odds */}
                <div className="flex flex-col items-center justify-center"
                  style={{ height: 54, background: isBestHome ? '#f0fdf4' : '#fff' }}>
                  <span className="font-bold text-sm" style={{ color: isBestHome ? '#16a34a' : '#0f172a' }}>
                    {row.homeVal ?? '—'}
                  </span>
                  {row.homeOdds != null && (
                    <span className="text-xs" style={{ color: isBestHome ? '#16a34a' : '#94a3b8' }}>
                      {formatOdds(row.homeOdds)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Betting % bar */}
      <div className="px-4 py-2.5" style={{ borderTop: '1px solid #f1f5f9' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold" style={{ color: '#94a3b8', fontSize: 10 }}>% OF BETS (implied)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold w-8 text-right" style={{ color: '#f59e0b' }}>{awayBetPct}%</span>
          <div className="flex-1 flex rounded-full overflow-hidden" style={{ height: 7, background: '#e2e8f0' }}>
            <div style={{ width: `${awayBetPct}%`, background: '#f59e0b' }} />
            <div style={{ width: `${homeBetPct}%`, background: '#3b82f6' }} />
          </div>
          <span className="text-xs font-bold w-8" style={{ color: '#3b82f6' }}>{homeBetPct}%</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs truncate" style={{ color: '#94a3b8', maxWidth: 140 }}>{game.away}</span>
          <span className="text-xs truncate text-right" style={{ color: '#94a3b8', maxWidth: 140 }}>{game.home}</span>
        </div>
      </div>
    </div>
  )
}
