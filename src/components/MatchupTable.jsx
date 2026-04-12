import { formatOdds, SPORTSBOOKS, SPORTSBOOK_LABELS } from '../lib/oddsApi'
import { formatDistanceToNow, format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

// ─── Odds cell ────────────────────────────────────────────────────────────────
function OddsCell({ spread, spreadOdds, total, totalOdds, ml, isBestMl, isBestSpread, isBestTotal }) {
  return (
    <td className="px-2 py-0" style={{ borderLeft: '1px solid var(--border-light)', minWidth: 90 }}>
      <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', height: 64 }}>
        {/* Away row */}
        <div className="flex items-center justify-between px-2"
          style={{ borderBottom: '1px solid var(--border-light)' }}>
          <span className="font-mono text-xs" style={{ color: isBestSpread ? 'var(--green)' : 'var(--text-primary)' }}>
            {spread != null ? `${spread > 0 ? '+' : ''}${spread}` : '—'}
          </span>
          <span className="font-mono text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>
            {spreadOdds != null ? formatOdds(spreadOdds) : ''}
          </span>
        </div>
        {/* Home row */}
        <div className="flex items-center justify-between px-2">
          <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
            {total != null ? `${totalOdds > 0 || total > 0 ? 'o' : 'u'}${total}` : '—'}
          </span>
          <span className="font-mono text-xs ml-1" style={{ color: isBestTotal ? 'var(--green)' : 'var(--text-secondary)' }}>
            {totalOdds != null ? formatOdds(totalOdds) : ''}
          </span>
        </div>
      </div>
    </td>
  )
}

function MLCell({ awayMl, homeMl, bestAwayMl, bestHomeMl }) {
  return (
    <td className="px-2 py-0" style={{ borderLeft: '1px solid var(--border-light)', minWidth: 70 }}>
      <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', height: 64 }}>
        <div className="flex items-center justify-end px-2"
          style={{ borderBottom: '1px solid var(--border-light)' }}>
          <span className="font-mono text-xs font-semibold"
            style={{ color: awayMl === bestAwayMl && awayMl != null ? 'var(--green)' : 'var(--text-primary)' }}>
            {awayMl != null ? formatOdds(awayMl) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-end px-2">
          <span className="font-mono text-xs font-semibold"
            style={{ color: homeMl === bestHomeMl && homeMl != null ? 'var(--green)' : 'var(--text-primary)' }}>
            {homeMl != null ? formatOdds(homeMl) : '—'}
          </span>
        </div>
      </div>
    </td>
  )
}

// ─── Single matchup row ───────────────────────────────────────────────────────
function MatchupRow({ game, index, onSelect }) {
  const gameTime = new Date(game.commenceTime)
  const isLive = gameTime < new Date()
  const timeLabel = isLive ? 'LIVE' : format(gameTime, 'h:mm a')
  const dateLabel = isLive ? '' : format(gameTime, 'EEE M/d')

  // Collect odds per book
  const bookOdds = {}
  SPORTSBOOKS.forEach(book => {
    const markets = game.bookmakers?.[book]
    if (!markets) return
    const h2h = markets.h2h || []
    const spreads = markets.spreads || []
    const totals = markets.totals || []

    const awayH2H = h2h.find(o => o.name === game.away)
    const homeH2H = h2h.find(o => o.name === game.home)
    const awaySpread = spreads.find(o => o.name === game.away)
    const homeSpread = spreads.find(o => o.name === game.home)
    const over = totals.find(o => o.name === 'Over')
    const under = totals.find(o => o.name === 'Under')

    bookOdds[book] = {
      awayMl: awayH2H?.price ?? null,
      homeMl: homeH2H?.price ?? null,
      awaySpread: awaySpread?.point ?? null,
      awaySpreadOdds: awaySpread?.price ?? null,
      homeSpread: homeSpread?.point ?? null,
      homeSpreadOdds: homeSpread?.price ?? null,
      overPoint: over?.point ?? null,
      overOdds: over?.price ?? null,
      underPoint: under?.point ?? null,
      underOdds: under?.price ?? null,
    }
  })

  // Find best ML for each team
  const awayMls = Object.values(bookOdds).map(b => b.awayMl).filter(v => v != null)
  const homeMls = Object.values(bookOdds).map(b => b.homeMl).filter(v => v != null)
  const bestAwayMl = awayMls.length ? Math.max(...awayMls) : null
  const bestHomeMl = homeMls.length ? Math.max(...homeMls) : null

  const availableBooks = SPORTSBOOKS.filter(b => bookOdds[b])

  const rowBg = index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-row-alt)'

  return (
    <tr
      className="cursor-pointer transition-colors hover:brightness-110"
      style={{ background: rowBg }}
      onClick={() => onSelect(game)}
    >
      {/* Game info cell */}
      <td className="py-0 pl-3 pr-2" style={{ minWidth: 200, verticalAlign: 'middle' }}>
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', height: 64 }}>
          {/* Away */}
          <div className="flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
            <span className="font-medium text-xs" style={{ color: 'var(--text-primary)' }}>
              {game.away}
            </span>
          </div>
          {/* Home */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-xs" style={{ color: 'var(--text-primary)' }}>
              {game.home}
            </span>
            <span className="text-xs ml-auto mr-1" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
              {isLive
                ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>● LIVE</span>
                : <>{dateLabel} {timeLabel}</>}
            </span>
          </div>
        </div>
      </td>

      {/* Per-book spread + total cells */}
      {SPORTSBOOKS.map(book => {
        const b = bookOdds[book]
        if (!b) {
          return (
            <td key={book} style={{ borderLeft: '1px solid var(--border-light)', minWidth: 90 }}>
              <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>—</span>
              </div>
            </td>
          )
        }
        return (
          <td key={book} className="px-0 py-0" style={{ borderLeft: '1px solid var(--border-light)', minWidth: 100 }}>
            <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', height: 64 }}>
              {/* Away: spread */}
              <div className="flex items-center gap-1 px-2"
                style={{ borderBottom: '1px solid var(--border-light)' }}>
                <span className="font-mono text-xs" style={{ color: 'var(--text-primary)', minWidth: 36 }}>
                  {b.awaySpread != null ? `${b.awaySpread > 0 ? '+' : ''}${b.awaySpread}` : '—'}
                </span>
                <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {b.awaySpreadOdds != null ? formatOdds(b.awaySpreadOdds) : ''}
                </span>
              </div>
              {/* Home: total (over) */}
              <div className="flex items-center gap-1 px-2">
                <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)', minWidth: 36 }}>
                  {b.overPoint != null ? `o${b.overPoint}` : '—'}
                </span>
                <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {b.overOdds != null ? formatOdds(b.overOdds) : ''}
                </span>
              </div>
            </div>
          </td>
        )
      })}

      {/* ML column */}
      <MLCell
        awayMl={bookOdds[SPORTSBOOKS.find(b => bookOdds[b]?.awayMl != null)]?.awayMl ?? null}
        homeMl={bookOdds[SPORTSBOOKS.find(b => bookOdds[b]?.homeMl != null)]?.homeMl ?? null}
        bestAwayMl={bestAwayMl}
        bestHomeMl={bestHomeMl}
      />
    </tr>
  )
}

// ─── Main table ───────────────────────────────────────────────────────────────
export default function MatchupTable({ games, loading, onSelect }) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="shimmer" style={{ height: 65, borderBottom: '1px solid var(--border-light)' }} />
        ))}
      </div>
    )
  }

  if (!games || games.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>
        No games available for this sport
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
      <table className="w-full border-collapse" style={{ minWidth: 700 }}>
        <thead>
          <tr style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
            <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)', minWidth: 200 }}>
              MATCHUP
            </th>
            {SPORTSBOOKS.map(book => (
              <th key={book} className="px-2 py-2 text-center text-xs font-semibold"
                style={{ color: 'var(--text-secondary)', borderLeft: '1px solid var(--border)', minWidth: 100 }}>
                {SPORTSBOOK_LABELS[book] || book}
                <div className="text-center" style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 400 }}>
                  Spread / Total
                </div>
              </th>
            ))}
            <th className="px-2 py-2 text-center text-xs font-semibold"
              style={{ color: 'var(--text-secondary)', borderLeft: '1px solid var(--border)', minWidth: 70 }}>
              BEST ML
            </th>
          </tr>
        </thead>
        <tbody>
          {games.map((game, i) => (
            <MatchupRow
              key={game.id}
              game={game}
              index={i}
              onSelect={g => onSelect ? onSelect(g) : navigate('/compare', { state: { game: g } })}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
