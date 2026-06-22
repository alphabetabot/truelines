const DK = 'draftkings'

function formatOdds(price) {
  if (price == null) return '—'
  const n = Number(price)
  if (!Number.isFinite(n)) return '—'
  return n > 0 ? `+${n}` : `${n}`
}

function draftKingsBookmaker(game) {
  return game?.bookmakers?.find(b => b.key === DK) || null
}

function formatSpreadPoint(point) {
  const n = Number(point)
  if (!Number.isFinite(n)) return ''
  return n > 0 ? `+${n}` : `${n}`
}

/**
 * All DraftKings ML / spread / total options for one odds API game.
 * @returns {Array<{ gameId, matchup, market, pick, label, american, bet }>}
 */
export function getDraftKingsPickOptions(game) {
  const dk = draftKingsBookmaker(game)
  if (!dk) return []

  const gameId = game.id
  const matchup = `${game.away_team} @ ${game.home_team}`
  const options = []

  for (const market of dk.markets || []) {
    if (market.key === 'h2h') {
      for (const o of market.outcomes || []) {
        const price = Number(o.price)
        if (!Number.isFinite(price)) continue
        options.push({
          gameId,
          matchup,
          market: 'h2h',
          pick: o.name,
          label: `ML · ${o.name}`,
          american: price,
          bet: `ML ${formatOdds(price)}`,
        })
      }
    }

    if (market.key === 'spreads') {
      for (const o of market.outcomes || []) {
        const price = Number(o.price)
        const point = formatSpreadPoint(o.point)
        if (!Number.isFinite(price) || !point) continue
        options.push({
          gameId,
          matchup,
          market: 'spreads',
          pick: `${o.name} ${point}`,
          label: `Spread · ${o.name} ${point}`,
          american: price,
          bet: `${o.name} ${point} (${formatOdds(price)})`,
        })
      }
    }

    if (market.key === 'totals') {
      for (const o of market.outcomes || []) {
        const price = Number(o.price)
        const point = Number(o.point)
        if (!Number.isFinite(price) || !Number.isFinite(point)) continue
        const side = o.name === 'Over' ? 'o' : 'u'
        options.push({
          gameId,
          matchup,
          market: 'totals',
          pick: `${o.name} ${point}`,
          label: `${o.name} ${point}`,
          american: price,
          bet: `${side}${point} (${formatOdds(price)})`,
        })
      }
    }
  }

  return options
}

export function gameHasDraftKingsOdds(game) {
  return getDraftKingsPickOptions(game).length > 0
}
