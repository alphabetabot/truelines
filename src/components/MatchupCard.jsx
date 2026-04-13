import { useState } from 'react'
import { formatOdds, SPORTSBOOKS, SPORTSBOOK_LABELS } from '../lib/oddsApi'
import { format } from 'date-fns'
import { ChevronDown } from 'lucide-react'

const BET_TYPES = [
  { key: 'h2h', label: 'Moneyline' },
  { key: 'spreads', label: 'Spread' },
  { key: 'totals', label: 'Total' },
]

function BookOddsBox({ book, awayVal, awayOdds, homeVal, homeOdds, isBestAway, isBestHome }) {
  return (
    <div className="flex flex-col shrink-0" style={{ width: 88 }}>
      <div className="text-center mb-1">
        <span className="text-xs font-semibold" style={{ color: '#64748b', fontSize: 10 }}>
          {SPORTSBOOK_LABELS[book] || book}
        </span>
      </div>
      {/* Away */}
      <div
        className="flex flex-col items-center justify-center rounded-xl mb-1.5"
        style={{
          border: `2px solid ${isBestAway ? '#16a34a' : '#e2e8f0'}`,
          background: isBestAway ? '#f0fdf4' : '#f8fafc',
          height: 54,
          padding: '4px 6px',
        }}
      >
        {awayVal != null ? (
          <>
            <span className="font-bold text-sm" style={{ color: isBestAway ? '#16a34a' : '#0f172a', lineHeight: 1.1 }}>
              {awayVal}
            </span>
            {awayOdds != null && awayOdds !== awayVal && (
              <span className="text-xs" style={{ color: isBestAway ? '#16a34a' : '#64748b' }}>
                {formatOdds(awayOdds)}
              </span>
            )}
          </>
        ) : (
          <span style={{ color: '#cbd5e1' }}>—</span>
        )}
      </div>
      {/* Home */}
      <div
        className="flex flex-col items-center justify-center rounded-xl"
        style={{
          border: `2px solid ${isBestHome ? '#16a34a' : '#e2e8f0'}`,
          background: isBestHome ? '#f0fdf4' : '#f8fafc',
          height: 54,
          padding: '4px 6px',
        }}
      >
        {homeVal != null ? (
          <>
            <span className="font-bold text-sm" style={{ color: isBestHome ? '#16a34a' : '#0f172a', lineHeight: 1.1 }}>
              {homeVal}
            </span>
            {homeOdds != null && homeOdds !== homeVal && (
              <span className="text-xs" style={{ color: isBestHome ? '#16a34a' : '#64748b' }}>
                {formatOdds(homeOdds)}
              </span>
            )}
          </>
        ) : (
          <span style={{ color: '#cbd5e1' }}>—</span>
        )}
      </div>
    </div>
  )
}

export default function MatchupCard({ game, onSelect }) {
  const [betType, setBetType] = useState('h2h')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const gameTime = new Date(game.commenceTime)
  const isLive = gameTime < new Date()
  const timeLabel = isLive ? 'LIVE' : format(gameTime, 'EEE M/d · h:mm a')
  const bookCount = Object.keys(game.bookmakers || {}).length

  // Build per-book display values
  const bookRows = SPORTSBOOKS.map(book => {
    const markets = game.bookmakers?.[book]
    if (!markets || !markets[betType]) return { book, awayVal: null, awayOdds: null, homeVal: null, homeOdds: null }

    const market = markets[betType]

    if (betType === 'h2h') {
      const away = market.find(o => o.name === game.away)
      const home = market.find(o => o.name === game.home)
      return {
        book,
        awayVal: away ? formatOdds(away.price) : null,
        awayOdds: null,
        homeVal: home ? formatOdds(home.price) : null,
        homeOdds: null,
      }
    }

    if (betType === 'spreads') {
      const away = market.find(o => o.name === game.away)
      const home = market.find(o => o.name === game.home)
      return {
        book,
        awayVal: away ? `${away.point > 0 ? '+' : ''}${away.point}` : null,
        awayOdds: away?.price ?? null,
        homeVal: home ? `${home.point > 0 ? '+' : ''}${home.point}` : null,
        homeOdds: home?.price ?? null,
      }
    }

    if (betType === 'totals') {
      const over = market.find(o => o.name === 'Over')
      const under = market.find(o => o.name === 'Under')
      return {
        book,
        awayVal: over ? `o${over.point}` : null,
        awayOdds: over?.price ?? null,
        homeVal: under ? `u${under.point}` : null,
        homeOdds: under?.price ?? null,
      }
    }

    return { book, awayVal: null, awayOdds: null, homeVal: null, homeOdds: null }
  }).filter(r => r.awayVal != null || r.homeVal != null)

  // Find best odds for each team
  const bestAway = betType === 'h2h'
    ? Math.max(...bookRows.map(r => {
        const n = parseFloat(r.awayVal)
        return isNaN(n) ? -Infinity : n
      }))
    : Math.max(...bookRows.map(r => r.awayOdds ?? -Infinity))

  const bestHome = betType === 'h2h'
    ? Math.max(...bookRows.map(r => {
        const n = parseFloat(r.homeVal)
        return isNaN(n) ? -Infinity : n
      }))
    : Math.max(...bookRows.map(r => r.homeOdds ?? -Infinity))

  // Implied betting %
  const awayMl = Object.values(game.bookmakers || {}).map(m => m.h2h?.find(o => o.name === game.away)?.price).find(p => p != null)
  const awayImpl = awayMl != null ? (awayMl > 0 ? 100 / (awayMl + 100) : Math.abs(awayMl) / (Math.abs(awayMl) + 100)) : 0.5
  const awayBetPct = Math.round((1 - awayImpl) * 100)
  const homeBetPct = 100 - awayBetPct

  const selectedLabel = BET_TYPES.find(b => b.key === betType)?.label

  return (
    <div
      className="rounded-2xl overflow-hidden mb-3"
      style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
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
        <button
          className="text-xs font-medium"
          style={{ color: '#f59e0b' }}
          onClick={e => { e.stopPropagation(); onSelect && onSelect(game) }}
        >
          Full Compare →
        </button>
      </div>

      <div className="px-4 pt-3 pb-4">
        {/* Team names */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-sm mb-1" style={{ color: '#0f172a' }}>{game.away}</div>
            <div className="font-bold text-sm" style={{ color: '#0f172a' }}>{game.home}</div>
          </div>

          {/* Bet type dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"
              style={{
                border: '2px solid #2563eb',
                background: '#eff6ff',
                color: '#2563eb',
                minWidth: 130,
              }}
            >
              {selectedLabel}
              <ChevronDown size={14} style={{ marginLeft: 'auto' }} />
            </button>
            {dropdownOpen && (
              <div
                className="absolute right-0 mt-1 rounded-lg overflow-hidden z-10"
                style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 130 }}
              >
                {BET_TYPES.map(bt => (
                  <button
                    key={bt.key}
                    onClick={() => { setBetType(bt.key); setDropdownOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-blue-50"
                    style={{
                      color: betType === bt.key ? '#2563eb' : '#0f172a',
                      background: betType === bt.key ? '#eff6ff' : 'transparent',
                      fontWeight: betType === bt.key ? 700 : 500,
                    }}
                  >
                    {bt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable sportsbook columns */}
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-2" style={{ width: 'max-content' }}>
            {bookRows.length > 0 ? bookRows.map(row => {
              const awayNum = betType === 'h2h' ? parseFloat(row.awayVal) : row.awayOdds
              const homeNum = betType === 'h2h' ? parseFloat(row.homeVal) : row.homeOdds
              return (
                <BookOddsBox
                  key={row.book}
                  book={row.book}
                  awayVal={row.awayVal}
                  awayOdds={row.awayOdds}
                  homeVal={row.homeVal}
                  homeOdds={row.homeOdds}
                  isBestAway={awayNum === bestAway && awayNum != null && isFinite(awayNum)}
                  isBestHome={homeNum === bestHome && homeNum != null && isFinite(homeNum)}
                />
              )
            }) : (
              <p className="text-sm py-4" style={{ color: '#94a3b8' }}>No {selectedLabel} odds available</p>
            )}
          </div>
        </div>

        {/* Betting % bar */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, marginTop: 10 }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold" style={{ color: '#94a3b8', fontSize: 10 }}>% OF BETS (implied)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold w-8 text-right" style={{ color: '#f59e0b' }}>{awayBetPct}%</span>
            <div className="flex-1 flex rounded-full overflow-hidden" style={{ height: 7, background: '#e2e8f0' }}>
              <div style={{ width: `${awayBetPct}%`, background: '#f59e0b', transition: 'width 0.3s' }} />
              <div style={{ width: `${homeBetPct}%`, background: '#3b82f6', transition: 'width 0.3s' }} />
            </div>
            <span className="text-xs font-bold w-8" style={{ color: '#3b82f6' }}>{homeBetPct}%</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs truncate" style={{ color: '#94a3b8', maxWidth: 120 }}>{game.away}</span>
            <span className="text-xs truncate text-right" style={{ color: '#94a3b8', maxWidth: 120 }}>{game.home}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
