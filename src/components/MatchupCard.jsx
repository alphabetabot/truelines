import { useState, useRef, useEffect } from 'react'
import { formatOdds, SPORTSBOOKS, SPORTSBOOK_COLORS } from '../lib/oddsApi'
import { getSportsbookLink, getSportsbookLinkRel, trackSportsbookClick } from '../lib/affiliateLinks'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { getOddsGameTimeLabel } from '../lib/gameStatus'
import { getAffiliateDisclosureInline } from '../lib/affiliateDisclosure'
import PremiumFeatureSlot from './PremiumFeatureSlot'

const BET_TYPES = [
  { key: 'h2h', label: 'Moneyline' },
  { key: 'spreads', label: 'Spread' },
  { key: 'totals', label: 'Total' },
]

const SPORTSBOOK_SHORT = {
  draftkings: 'DK',
  fanduel: 'FD',
  betmgm: 'MGM',
  williamhill_us: 'CZR',
  pinnacle: 'PIN',
  bet365: 'B365',
}

function buildBookRows(game, betType) {
  return SPORTSBOOKS.map(book => {
    const markets = game.bookmakers?.[book]
    if (!markets || !markets[betType]) return null
    const market = markets[betType]

    if (betType === 'h2h') {
      const away = market.find(o => o.name === game.away)
      const home = market.find(o => o.name === game.home)
      if (!away && !home) return null
      return {
        book,
        awayVal: away ? formatOdds(away.price) : null,
        awayNum: away?.price ?? null,
        homeVal: home ? formatOdds(home.price) : null,
        homeNum: home?.price ?? null,
      }
    }
    if (betType === 'spreads') {
      const away = market.find(o => o.name === game.away)
      const home = market.find(o => o.name === game.home)
      if (!away && !home) return null
      return {
        book,
        awayVal: away ? `${away.point > 0 ? '+' : ''}${away.point}` : null,
        awayNum: away?.price ?? null,
        homeVal: home ? `${home.point > 0 ? '+' : ''}${home.point}` : null,
        homeNum: home?.price ?? null,
        awayOdds: away?.price,
        homeOdds: home?.price,
      }
    }
    if (betType === 'totals') {
      const over = market.find(o => o.name === 'Over')
      const under = market.find(o => o.name === 'Under')
      if (!over && !under) return null
      return {
        book,
        awayVal: over ? `o${over.point}` : null,
        awayNum: over?.price ?? null,
        homeVal: under ? `u${under.point}` : null,
        homeNum: under?.price ?? null,
        awayOdds: over?.price,
        homeOdds: under?.price,
      }
    }
    return null
  }).filter(Boolean)
}

function pitcherLine(teamName, pitchers, gameTeam) {
  const p = pitchers[gameTeam]
    || Object.entries(pitchers).find(([k]) => gameTeam.includes(k) || k.includes(gameTeam.split(' ').slice(-1)[0]))?.[1]
  return p ? `${p.name} (${p.wins}-${p.losses}, ${p.era} ERA)` : 'P: TBD'
}

export default function MatchupCard({ game, onSelect, isMLB = false, pitchers = {}, compact = true }) {
  const [betType, setBetType] = useState('h2h')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const timeLabel = getOddsGameTimeLabel(game.commenceTime)
  const selectedLabel = BET_TYPES.find(b => b.key === betType)?.label
  const bookRows = buildBookRows(game, betType)

  const bestAwayNum = bookRows.length ? Math.max(...bookRows.map(r => r.awayNum ?? -Infinity)) : null
  const bestHomeNum = bookRows.length ? Math.max(...bookRows.map(r => r.homeNum ?? -Infinity)) : null

  const bestAwayRow = bookRows.find(r => r.awayNum === bestAwayNum && r.awayNum != null && isFinite(r.awayNum))
  const bestHomeRow = bookRows.find(r => r.homeNum === bestHomeNum && r.homeNum != null && isFinite(r.homeNum))

  const awayMl = Object.values(game.bookmakers || {})
    .map(m => m.h2h?.find(o => o.name === game.away)?.price)
    .find(p => p != null)
  const awayImpl = awayMl != null
    ? (awayMl > 0 ? 100 / (awayMl + 100) : Math.abs(awayMl) / (Math.abs(awayMl) + 100))
    : 0.5
  const awayImpliedPct = Math.round(awayImpl * 100)
  const homeImpliedPct = 100 - awayImpliedPct

  useEffect(() => {
    if (!dropdownOpen) return
    function onDocClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [dropdownOpen])

  return (
    <article
      className="mb-2.5 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(165deg, rgba(18,18,18,0.98) 0%, rgba(8,8,8,1) 100%)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* ── Matchup header ── */}
      <div className="px-3.5 pt-3 pb-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              {timeLabel}
            </p>
            <h3 className="font-bold leading-tight truncate" style={{ color: 'var(--text-primary)', fontSize: compact ? 15 : 17 }}>
              {game.away}
              <span className="font-normal mx-1.5" style={{ color: 'var(--text-muted)' }}>vs</span>
              {game.home}
            </h3>
            {isMLB && (
              <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>
                {pitcherLine(game.away, pitchers, game.away)} · {pitcherLine(game.home, pitchers, game.home)}
              </p>
            )}
          </div>

          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--text-primary)',
                fontSize: 16,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {selectedLabel}
              <ChevronDown size={14} style={{ opacity: 0.7 }} />
            </button>
            {dropdownOpen && (
              <div
                className="absolute right-0 mt-1 rounded-xl overflow-hidden z-30 min-w-[130px]"
                style={{
                  background: 'var(--bg-elevated)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {BET_TYPES.map(bt => (
                  <button
                    key={bt.key}
                    type="button"
                    onClick={() => { setBetType(bt.key); setDropdownOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors"
                    style={{
                      color: betType === bt.key ? 'var(--green)' : 'var(--text-secondary)',
                      background: betType === bt.key ? 'var(--green-dim)' : 'transparent',
                    }}
                  >
                    {bt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {bookRows.length === 0 ? (
        <div className="px-4 pb-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No {selectedLabel} odds available</p>
        </div>
      ) : (
        <>
          {/* ── Best available odds ── */}
          <div className="px-3.5 pb-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Best available odds
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div
                className="rounded-xl px-2.5 py-2"
                style={{ background: 'rgba(57,255,100,0.06)' }}
              >
                <p className="text-[10px] truncate mb-0.5" style={{ color: 'var(--text-muted)' }}>{game.away}</p>
                <p className="text-base font-black leading-none" style={{ color: 'var(--green)' }}>
                  {bestAwayRow?.awayVal ?? '—'}
                </p>
                {bestAwayRow && (
                  <p className="text-[10px] mt-1 font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {SPORTSBOOK_SHORT[bestAwayRow.book] || bestAwayRow.book}
                  </p>
                )}
              </div>
              <div
                className="rounded-xl px-2.5 py-2"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <p className="text-[10px] truncate mb-0.5 text-right" style={{ color: 'var(--text-muted)' }}>{game.home}</p>
                <p className="text-base font-black leading-none text-right" style={{ color: bestHomeRow ? 'var(--green)' : 'var(--text-primary)' }}>
                  {bestHomeRow?.homeVal ?? '—'}
                </p>
                {bestHomeRow && (
                  <p className="text-[10px] mt-1 font-semibold text-right" style={{ color: 'var(--text-muted)' }}>
                    {SPORTSBOOK_SHORT[bestHomeRow.book] || bestHomeRow.book}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Sportsbook cards (horizontal scroll, no grid lines) ── */}
          <div className="relative px-3.5 pb-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Sportsbooks
            </p>
            <div
              className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {bookRows.map(row => {
                const isBestAway = row.awayNum === bestAwayNum && row.awayNum != null && isFinite(row.awayNum)
                const isBestHome = row.homeNum === bestHomeNum && row.homeNum != null && isFinite(row.homeNum)
                const bookColor = SPORTSBOOK_COLORS[row.book] || 'var(--text-muted)'

                return (
                  <div
                    key={row.book}
                    className="shrink-0 rounded-xl px-2 py-1.5 flex flex-col items-center"
                    style={{
                      width: 68,
                      background: isBestAway || isBestHome ? 'rgba(57,255,100,0.05)' : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <span className="text-[10px] font-black mb-1" style={{ color: bookColor }}>
                      {SPORTSBOOK_SHORT[row.book] || row.book.slice(0, 3).toUpperCase()}
                    </span>
                    <span
                      className="text-xs font-bold leading-none mb-1"
                      style={{ color: isBestAway ? 'var(--green)' : 'var(--text-primary)' }}
                    >
                      {row.awayVal ?? '—'}
                    </span>
                    <span
                      className="text-xs font-bold leading-none mb-1"
                      style={{ color: isBestHome ? 'var(--green)' : 'var(--text-secondary)' }}
                    >
                      {row.homeVal ?? '—'}
                    </span>
                    {(row.awayOdds != null || row.homeOdds != null) && betType !== 'h2h' && (
                      <span className="text-[9px] mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        {row.awayOdds != null ? formatOdds(row.awayOdds) : ''}
                        {row.awayOdds != null && row.homeOdds != null ? ' / ' : ''}
                        {row.homeOdds != null ? formatOdds(row.homeOdds) : ''}
                      </span>
                    )}
                    <a
                      href={getSportsbookLink(row.book)}
                      target="_blank"
                      rel={getSportsbookLinkRel()}
                      title={getAffiliateDisclosureInline()}
                      onClick={e => {
                        e.stopPropagation()
                        trackSportsbookClick(row.book, 'matchup_card')
                      }}
                      className="text-[9px] font-bold uppercase tracking-wide mt-auto py-1 px-2 rounded-md"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                      }}
                    >
                      Visit
                    </a>
                  </div>
                )
              })}
            </div>
            <div
              className="pointer-events-none absolute right-4 top-8 bottom-0 w-8"
              style={{ background: 'linear-gradient(to right, transparent, rgba(8,8,8,0.95))' }}
              aria-hidden
            />
          </div>
        </>
      )}

      {/* ── Implied probability ── */}
      <PremiumFeatureSlot feature="bettingSplits" />
      <div className="px-3.5 py-2.5" style={{ background: 'rgba(0,0,0,0.25)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Implied probability
        </p>
        <div className="flex items-center gap-3 mb-1.5">
          <span className="text-xs font-bold w-9 text-right tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {awayImpliedPct}%
          </span>
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full flex">
              <div style={{ width: `${awayImpliedPct}%`, background: 'var(--green)', opacity: 0.85 }} />
              <div style={{ width: `${homeImpliedPct}%`, background: 'rgba(255,255,255,0.2)' }} />
            </div>
          </div>
          <span className="text-xs font-bold w-9 tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {homeImpliedPct}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] truncate max-w-[42%]" style={{ color: 'var(--text-muted)' }}>{game.away}</span>
          <span className="text-[10px] truncate max-w-[42%] text-right" style={{ color: 'var(--text-muted)' }}>{game.home}</span>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-3.5 py-2.5 flex justify-end">
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onSelect && onSelect(game) }}
          className="flex items-center gap-1 text-xs font-semibold shrink-0 transition-opacity hover:opacity-80"
          style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          View Details
          <ArrowRight size={13} />
        </button>
      </div>
    </article>
  )
}
