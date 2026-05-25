import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getOdds } from '../lib/oddsApi'

async function fetchEdges() {
  const edges = []

  // Fetch MLB totals
  try {
    const games = await getOdds('baseball_mlb', 'totals', 'draftkings,fanduel,pinnacle')
    games?.slice(0, 6).forEach(g => {
      const books = g.bookmakers || []
      const totals = books.map(b => {
        const mkt = b.markets?.find(m => m.key === 'totals')
        const over = mkt?.outcomes?.find(o => o.name === 'Over')
        return over?.point
      }).filter(Boolean)

      if (totals.length >= 2) {
        const avg = totals.reduce((a, b) => a + b, 0) / totals.length
        const min = Math.min(...totals)
        const max = Math.max(...totals)
        const spread = max - min

        // Only show if there's meaningful line spread across books
        if (spread >= 0.5) {
          const away = g.away_team.split(' ').slice(-1)[0]
          const home = g.home_team.split(' ').slice(-1)[0]
          edges.push({
            game: `${away} @ ${home}`,
            sport: 'MLB',
            market: 'Total',
            line: avg.toFixed(1),
            low: min,
            high: max,
            edge: spread.toFixed(1),
            lean: spread >= 1.0 ? 'sharp' : 'soft',
          })
        }
      }
    })
  } catch {}

  // Fetch NBA spreads
  try {
    const games = await getOdds('basketball_nba', 'spreads', 'draftkings,fanduel,pinnacle')
    games?.slice(0, 4).forEach(g => {
      const books = g.bookmakers || []
      const spreads = books.map(b => {
        const mkt = b.markets?.find(m => m.key === 'spreads')
        const away = mkt?.outcomes?.find(o => o.name === g.away_team)
        return away?.point
      }).filter(p => p !== undefined && p !== null)

      if (spreads.length >= 2) {
        const min = Math.min(...spreads)
        const max = Math.max(...spreads)
        const spread = Math.abs(max - min)

        if (spread >= 1.0) {
          const away = g.away_team.split(' ').slice(-1)[0]
          const home = g.home_team.split(' ').slice(-1)[0]
          edges.push({
            game: `${away} @ ${home}`,
            sport: 'NBA',
            market: 'Spread',
            line: ((min + max) / 2).toFixed(1),
            low: min,
            high: max,
            edge: spread.toFixed(1),
            lean: spread >= 2.0 ? 'sharp' : 'soft',
          })
        }
      }
    })
  } catch {}

  return edges.sort((a, b) => parseFloat(b.edge) - parseFloat(a.edge)).slice(0, 5)
}

const sportColor = { MLB: '#22c55e', NBA: '#2563eb', NHL: '#6366f1' }

export default function TodaysEdges() {
  const { data: edges = [], isLoading } = useQuery({
    queryKey: ['edges'],
    queryFn: fetchEdges,
    staleTime: 300_000,
    refetchInterval: 600_000,
  })

  if (isLoading) return null
  if (!edges.length) return null

  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ border: '1px solid #e2e8f0', background: '#fff' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#0f172a' }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={15} style={{ color: '#f59e0b' }} />
          <span className="text-sm font-black text-white">Today's Edges</span>
        </div>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Line discrepancies across books
        </span>
      </div>

      <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
        {edges.map((edge, i) => (
          <div key={i} className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0"
                style={{ background: (sportColor[edge.sport] || '#94a3b8') + '20', color: sportColor[edge.sport] || '#94a3b8' }}>
                {edge.sport}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: '#0f172a' }}>{edge.game}</p>
                <p className="text-xs" style={{ color: '#94a3b8' }}>{edge.market} · Books: {edge.low} – {edge.high}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-right">
                <p className="text-xs font-black" style={{ color: '#0f172a' }}>Avg {edge.line}</p>
                <p className="text-xs font-bold" style={{ color: edge.lean === 'sharp' ? '#ef4444' : '#f59e0b' }}>
                  {edge.lean === 'sharp' ? '🔴 Sharp' : '🟡 Soft'} +{edge.edge}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2" style={{ borderTop: '1px solid #f1f5f9' }}>
        <p className="text-xs" style={{ color: '#94a3b8' }}>
          Edge = line spread across DraftKings, FanDuel & Pinnacle · For informational use only
        </p>
      </div>
    </div>
  )
}
