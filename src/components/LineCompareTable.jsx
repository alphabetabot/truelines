import { formatOdds, SPORTSBOOKS, SPORTSBOOK_LABELS, SPORTSBOOK_COLORS } from '../lib/oddsApi'

function BestBadge() {
  return <span style={{ color: 'var(--green)', fontSize: 10, fontWeight: 800, marginLeft: 2 }}>▲</span>
}

function MarketSection({ game, marketKey, labelA, labelB, sectionTitle }) {
  const data = {}
  SPORTSBOOKS.forEach(book => {
    const markets = game.bookmakers?.[book]
    if (!markets) return
    const market = markets[marketKey]
    if (!market) return
    data[book] = {}
    market.forEach(o => {
      [labelA, labelB].forEach(label => {
        if (o.name === label || o.name.toLowerCase() === label.toLowerCase()) {
          data[book][label] = { price: o.price, point: o.point }
        }
      })
    })
  })

  const availableBooks = SPORTSBOOKS.filter(b => data[b] && Object.keys(data[b]).length > 0)
  if (availableBooks.length === 0) return null

  const sectionColors = {
    '💰 MONEYLINE': { bg: '#1e3a5f', color: '#93c5fd' },
    '📊 SPREAD': { bg: '#14532d', color: '#86efac' },
    '🎯 TOTAL (OVER/UNDER)': { bg: '#4a1d96', color: '#c4b5fd' },
  }

  const best = {}
  ;[labelA, labelB].forEach(label => {
    const prices = availableBooks.map(b => data[b]?.[label]?.price).filter(p => p != null)
    best[label] = prices.length ? Math.max(...prices) : null
  })

  const _rowLabels = {
    h2h: { a: 'Away ML', b: 'Home ML' },
    spreads: { a: 'Away Spread', b: 'Home Spread' },
    totals: { a: 'Over', b: 'Under' },
  }

  return (
    <div className="mb-4">
      {/* Section header */}
      <div className="px-3 py-2.5 font-black text-sm"
        style={{ background: sectionColors[sectionTitle]?.bg || '#0f172a', color: sectionColors[sectionTitle]?.color || '#f59e0b' }}>
        {sectionTitle}
      </div>

      {/* Book headers + rows — scrollable */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: availableBooks.length * 100 + 130, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#1e293b', borderBottom: '2px solid #334155' }}>
              <th style={{ width: 130, padding: '8px 12px', textAlign: 'left', color: '#94a3b8', fontSize: 11, fontWeight: 700, position: 'sticky', left: 0, background: '#1e293b', zIndex: 2 }}>BOOK</th>
              {availableBooks.map(book => (
                <th key={book} style={{ minWidth: 100, padding: '8px 12px', textAlign: 'center', color: '#ffffff', fontSize: 12, fontWeight: 800, borderLeft: '1px solid #334155', whiteSpace: 'nowrap' }}>
                  {SPORTSBOOK_LABELS[book] || book}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[labelA, labelB].map((label, rowIdx) => (
              <tr key={label} style={{ background: rowIdx % 2 === 0 ? '#ffffff' : '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                {/* Row label */}
                <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: '#1e293b', borderRight: '2px solid #cbd5e1', background: rowIdx % 2 === 0 ? '#f8fafc' : '#f1f5f9', whiteSpace: 'nowrap', position: 'sticky', left: 0, zIndex: 1 }}>
                  {marketKey === 'h2h' ? (rowIdx === 0 ? game.away : game.home) :
                   marketKey === 'totals' ? (rowIdx === 0 ? '⬆ Over' : '⬇ Under') :
                   (rowIdx === 0 ? `${game.away} Spread` : `${game.home} Spread`)}
                </td>

                {/* Book odds */}
                {availableBooks.map(book => {
                  const d = data[book]?.[label]
                  const isBest = d?.price != null && d.price === best[label]
                  return (
                    <td key={book} style={{ padding: '10px 12px', textAlign: 'center', borderLeft: '1px solid #e2e8f0', minWidth: 100 }}>
                      {d ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          {d.point != null && (
                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>
                              {d.point > 0 ? '+' : ''}{d.point}
                            </span>
                          )}
                          <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 900, color: isBest ? '#16a34a' : '#0f172a' }}>
                            {formatOdds(d.price)}
                          </span>
                          {isBest && <BestBadge />}
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function LineCompareTable({ game }) {
  if (!game) return null

  return (
    <div>
      {/* Game header */}
      <div className="p-4 mb-4 rounded-xl" style={{ background: '#0f172a' }}>
        <h2 className="text-base font-black text-white mb-1">
          {game.away} <span style={{ color: '#94a3b8' }}>@</span> {game.home}
        </h2>
        <p className="text-xs" style={{ color: '#94a3b8' }}>
          {new Date(game.commenceTime).toLocaleString()} · Green ▲ = best odds available
        </p>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <MarketSection game={game} marketKey="h2h" labelA={game.away} labelB={game.home} sectionTitle="💰 MONEYLINE" />
        <MarketSection game={game} marketKey="spreads" labelA={game.away} labelB={game.home} sectionTitle="📊 SPREAD" />
        <MarketSection game={game} marketKey="totals" labelA="Over" labelB="Under" sectionTitle="🎯 TOTAL (OVER/UNDER)" />
      </div>
    </div>
  )
}
