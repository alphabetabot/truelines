import { formatOdds, SPORTSBOOKS, SPORTSBOOK_LABELS } from '../lib/oddsApi'
import { useNavigate } from 'react-router-dom'
import { getOddsGameTimeLabel } from '../lib/gameStatus'

function TeamCell({ name, isAway }) {
  return (
    <div
      className="flex items-center px-3"
      style={{
        height: 36,
        borderBottom: isAway ? '1px solid var(--border-light)' : 'none',
      }}
    >
      <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
        {name}
      </span>
    </div>
  )
}

function OddsCell({ awaySpread, awaySpreadOdds, overPoint, overOdds, bestAwaySpread }) {
  return (
    <td className="px-0 py-0" style={{ borderLeft: '1px solid var(--border-light)', minWidth: 110, verticalAlign: 'top' }}>
      {/* Away row: spread */}
      <div className="flex items-center justify-between px-2"
        style={{ height: 36, borderBottom: '1px solid var(--border-light)' }}>
        <span className="font-mono text-xs" style={{ color: awaySpread === bestAwaySpread ? 'var(--green)' : 'var(--text-primary)', minWidth: 36 }}>
          {awaySpread != null ? `${awaySpread > 0 ? '+' : ''}${awaySpread}` : '—'}
        </span>
        <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
          {awaySpreadOdds != null ? formatOdds(awaySpreadOdds) : ''}
        </span>
      </div>
      {/* Home row: total */}
      <div className="flex items-center justify-between px-2" style={{ height: 36 }}>
        <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)', minWidth: 36 }}>
          {overPoint != null ? `o${overPoint}` : '—'}
        </span>
        <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
          {overOdds != null ? formatOdds(overOdds) : ''}
        </span>
      </div>
    </td>
  )
}

function MLCell({ awayMl, homeMl, bestAwayMl, bestHomeMl }) {
  return (
    <td className="px-0 py-0" style={{ borderLeft: '1px solid var(--border-light)', minWidth: 70, verticalAlign: 'top' }}>
      <div className="flex items-center justify-end px-3"
        style={{ height: 36, borderBottom: '1px solid var(--border-light)' }}>
        <span className="font-mono text-xs font-semibold"
          style={{ color: awayMl === bestAwayMl && awayMl != null ? 'var(--green)' : 'var(--text-primary)' }}>
          {awayMl != null ? formatOdds(awayMl) : '—'}
        </span>
      </div>
      <div className="flex items-center justify-end px-3" style={{ height: 36 }}>
        <span className="font-mono text-xs font-semibold"
          style={{ color: homeMl === bestHomeMl && homeMl != null ? 'var(--green)' : 'var(--text-primary)' }}>
          {homeMl != null ? formatOdds(homeMl) : '—'}
        </span>
      </div>
    </td>
  )
}

function MatchupRow({ game, index, onSelect }) {
  const timeLabel = getOddsGameTimeLabel(game.commenceTime)

  // Collect odds per book
  const bookOdds = {}
  SPORTSBOOKS.forEach(book => {
    const markets = game.bookmakers?.[book]
    if (!markets) return
    const h2h = markets.h2h || []
    const spreads = markets.spreads || []
    const totals = markets.totals || []

    bookOdds[book] = {
      awayMl: h2h.find(o => o.name === game.away)?.price ?? null,
      homeMl: h2h.find(o => o.name === game.home)?.price ?? null,
      awaySpread: spreads.find(o => o.name === game.away)?.point ?? null,
      awaySpreadOdds: spreads.find(o => o.name === game.away)?.price ?? null,
      homeSpread: spreads.find(o => o.name === game.home)?.point ?? null,
      homeSpreadOdds: spreads.find(o => o.name === game.home)?.price ?? null,
      overPoint: totals.find(o => o.name === 'Over')?.point ?? null,
      overOdds: totals.find(o => o.name === 'Over')?.price ?? null,
      underPoint: totals.find(o => o.name === 'Under')?.point ?? null,
      underOdds: totals.find(o => o.name === 'Under')?.price ?? null,
    }
  })

  // Best ML
  const awayMls = Object.values(bookOdds).map(b => b.awayMl).filter(v => v != null)
  const homeMls = Object.values(bookOdds).map(b => b.homeMl).filter(v => v != null)
  const bestAwayMl = awayMls.length ? Math.max(...awayMls) : null
  const bestHomeMl = homeMls.length ? Math.max(...homeMls) : null

  // Best spread odds
  const awaySpreads = Object.values(bookOdds).map(b => b.awaySpread).filter(v => v != null)
  const bestAwaySpread = awaySpreads.length ? Math.max(...awaySpreads) : null

  const rowBg = index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-row-alt)'

  return (
    <tr
      className="cursor-pointer transition-colors"
      style={{ background: rowBg, borderBottom: '2px solid var(--border)' }}
      onClick={() => onSelect(game)}
    >
      {/* Matchup info cell */}
      <td className="py-0 pl-0 pr-0" style={{ minWidth: 180, verticalAlign: 'top' }}>
        {/* Time header */}
        <div className="flex items-center gap-2 px-3"
          style={{ height: 14, background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-light)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>{timeLabel}</span>
        </div>
        {/* Away team */}
        <TeamCell name={game.away} isAway={true} />
        {/* Home team */}
        <TeamCell name={game.home} isAway={false} />
      </td>

      {/* Per-book odds */}
      {SPORTSBOOKS.map(book => {
        const b = bookOdds[book]
        if (!b) {
          return (
            <td key={book} style={{ borderLeft: '1px solid var(--border-light)', minWidth: 110, verticalAlign: 'top' }}>
              <div style={{ height: 36, borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
              </div>
              <div style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
              </div>
            </td>
          )
        }
        return (
          <OddsCell
            key={book}
            awaySpread={b.awaySpread}
            awaySpreadOdds={b.awaySpreadOdds}
            overPoint={b.overPoint}
            overOdds={b.overOdds}
            awayMl={b.awayMl}
            homeMl={b.homeMl}
            homeSpread={b.homeSpread}
            homeSpreadOdds={b.homeSpreadOdds}
            underPoint={b.underPoint}
            underOdds={b.underOdds}
            bestAwayMl={bestAwayMl}
            bestHomeMl={bestHomeMl}
            bestAwaySpread={bestAwaySpread}
          />
        )
      })}

      {/* Best ML column */}
      <MLCell
        awayMl={bestAwayMl}
        homeMl={bestHomeMl}
        bestAwayMl={bestAwayMl}
        bestHomeMl={bestHomeMl}
      />
    </tr>
  )
}

export default function MatchupTable({ games, loading, onSelect }) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="shimmer" style={{ height: 86, borderBottom: '2px solid var(--border)' }} />
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
          <tr style={{ background: 'var(--bg-header)', borderBottom: '2px solid var(--border)' }}>
            <th className="text-left px-3 py-2 text-xs font-semibold"
              style={{ color: 'var(--text-secondary)', minWidth: 180 }}>
              MATCHUP
            </th>
            {SPORTSBOOKS.map(book => (
              <th key={book} className="px-2 py-2 text-center text-xs font-semibold"
                style={{ color: 'var(--text-secondary)', borderLeft: '1px solid var(--border)', minWidth: 110 }}>
                {SPORTSBOOK_LABELS[book] || book}
                <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 400 }}>
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
