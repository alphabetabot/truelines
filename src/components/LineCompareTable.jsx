import { formatOdds, SPORTSBOOKS, SPORTSBOOK_LABELS } from '../lib/oddsApi'

function BestBadge() {
  return (
    <span className="text-xs font-bold ml-1" style={{ color: 'var(--green)', fontSize: 9 }}>▲</span>
  )
}

function MarketRows({ game, marketKey, labelA, labelB }) {
  const rows = [labelA, labelB]

  // Collect data per book per team
  const data = {}
  SPORTSBOOKS.forEach(book => {
    const markets = game.bookmakers?.[book]
    if (!markets) return
    const market = markets[marketKey]
    if (!market) return
    data[book] = {}
    market.forEach(o => {
      rows.forEach(label => {
        if (o.name === label || o.name.toLowerCase() === label.toLowerCase()) {
          data[book][label] = { price: o.price, point: o.point }
        }
      })
    })
  })

  const availableBooks = SPORTSBOOKS.filter(b => data[b] && Object.keys(data[b]).length > 0)
  if (availableBooks.length === 0) return null

  // Best per row label
  const best = {}
  rows.forEach(label => {
    const prices = availableBooks.map(b => data[b]?.[label]?.price).filter(p => p != null)
    best[label] = prices.length ? Math.max(...prices) : null
  })

  return (
    <>
      {rows.map((label, rowIdx) => (
        <tr key={label} style={{
          background: rowIdx === 0 ? 'var(--bg-card)' : 'var(--bg-row-alt)',
          borderBottom: rowIdx === 0 ? '1px solid var(--border-light)' : '1px solid var(--border)',
        }}>
          <td className="pl-3 pr-2 py-2.5 text-xs font-medium" style={{
            color: 'var(--text-primary)',
            minWidth: 180,
            borderRight: '1px solid var(--border)',
          }}>
            {rowIdx === 0 && (
              <div className="text-xs font-bold mb-0.5" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                {marketKey === 'h2h' ? 'MONEYLINE' : marketKey === 'spreads' ? 'SPREAD' : 'TOTAL'}
              </div>
            )}
            {label}
          </td>
          {SPORTSBOOKS.map(book => {
            const d = data[book]?.[label]
            const isBest = d?.price != null && d.price === best[label]
            return (
              <td key={book} className="px-3 py-2.5 text-center"
                style={{ borderRight: '1px solid var(--border-light)', minWidth: 100 }}>
                {d ? (
                  <div className="flex items-center justify-center gap-1">
                    {d.point != null && (
                      <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {d.point > 0 ? '+' : ''}{d.point}
                      </span>
                    )}
                    <span className="font-mono text-xs font-semibold"
                      style={{ color: isBest ? 'var(--green)' : 'var(--text-primary)' }}>
                      {formatOdds(d.price)}
                    </span>
                    {isBest && <BestBadge />}
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                )}
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}

export default function LineCompareTable({ game }) {
  if (!game) return null

  return (
    <div>
      {/* Game header */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            {game.away} <span style={{ color: 'var(--text-muted)' }}>@</span> {game.home}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {new Date(game.commenceTime).toLocaleString()} · Green = best odds available
          </p>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full border-collapse" style={{ minWidth: 600 }}>
          <thead>
            <tr style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
              <th className="text-left pl-3 pr-2 py-2.5 text-xs font-semibold"
                style={{ color: 'var(--text-secondary)', minWidth: 180, borderRight: '1px solid var(--border)' }}>
                MARKET
              </th>
              {SPORTSBOOKS.map(book => (
                <th key={book} className="px-3 py-2.5 text-center text-xs font-semibold"
                  style={{ color: 'var(--text-secondary)', borderRight: '1px solid var(--border-light)', minWidth: 100 }}>
                  {SPORTSBOOK_LABELS[book] || book}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <MarketRows game={game} marketKey="h2h" labelA={game.away} labelB={game.home} />
            <MarketRows game={game} marketKey="spreads" labelA={game.away} labelB={game.home} />
            <MarketRows game={game} marketKey="totals" labelA="Over" labelB="Under" />
          </tbody>
        </table>
      </div>
    </div>
  )
}
