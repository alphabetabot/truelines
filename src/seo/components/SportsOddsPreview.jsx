import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getOdds, parseOddsForComparison, SPORTSBOOK_LABELS } from '../../lib/oddsApi'
import { formatOdds } from '../../lib/oddsApi'

function formatAmerican(price) {
  if (price == null || Number.isNaN(price)) return null
  return formatOdds(price)
}

export default function SportsOddsPreview({ sportKey, sportLabel, liveOddsPath = '/odds' }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['seo-odds-preview', sportKey],
    queryFn: () => getOdds(sportKey),
    staleTime: 60_000,
    retry: 1,
  })

  const games = data ? parseOddsForComparison(data).slice(0, 6) : []

  return (
    <section className="mb-8">
      <h2 className="text-xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>
        {sportLabel} odds preview
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
        Sample of upcoming {sportLabel} matchups from our live feed. Numbers change — confirm on the sportsbook before betting.
      </p>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shimmer rounded-xl h-16" style={{ border: '1px solid var(--border)' }} />
          ))}
        </div>
      )}

      {!isLoading && (isError || games.length === 0) && (
        <div className="rounded-xl p-4 text-sm" style={{ background: 'var(--odds-bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          Odds are currently unavailable. Check back closer to game time, or open the{' '}
          <Link to={liveOddsPath} style={{ color: 'var(--accent)', fontWeight: 600 }}>live odds tool</Link>.
        </div>
      )}

      {!isLoading && !isError && games.length > 0 && (
        <ul className="space-y-2 mb-4">
          {games.map(game => {
            const awayMl = game.best?.h2h?.away
            const homeMl = game.best?.h2h?.home
            return (
              <li
                key={game.id}
                className="rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {game.away} @ {game.home}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {game.commenceTime
                      ? new Date(game.commenceTime).toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : 'Time TBD'}
                  </p>
                </div>
                {awayMl?.price != null && homeMl?.price != null ? (
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    Best ML (if available): {game.away}{' '}
                    <span style={{ color: 'var(--green)' }}>{formatAmerican(awayMl.price)}</span>
                    {' · '}
                    {game.home}{' '}
                    <span style={{ color: 'var(--green)' }}>{formatAmerican(homeMl.price)}</span>
                    {awayMl.book && (
                      <span style={{ color: 'var(--text-muted)' }}>
                        {' '}
                        via {SPORTSBOOK_LABELS[awayMl.book] || awayMl.book}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Moneyline not available in feed</p>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Link
        to={liveOddsPath}
        className="text-sm font-bold"
        style={{ color: 'var(--accent)' }}
      >
        Open full live {sportLabel} odds →
      </Link>
    </section>
  )
}
