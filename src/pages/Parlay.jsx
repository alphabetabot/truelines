import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layers, Trash2, X } from 'lucide-react'
import { useSportSelection } from '../hooks/useSportSelection'
import { getOdds, parseOddsForComparison, formatOdds, SPORTSBOOK_LABELS } from '../lib/oddsApi'
import {
  combineParlayAmericanOdds,
  formatAmericanOdds,
  parlayPayout,
} from '../lib/parlayMath'
import SportSelector from '../components/SportSelector'
import OddsLoadError from '../components/OddsLoadError'
import { getOddsGameTimeLabel } from '../lib/gameStatus'
import { sortGamesByTime } from '../lib/gameNavigation'

const MAX_LEGS = 10
const STAKE_OPTIONS = [10, 25, 100]

function legKey(gameId, market, side) {
  return `${gameId}:${market}:${side}`
}

function buildLegOptions(game) {
  const options = []
  const matchup = `${game.away} @ ${game.home}`

  const h2h = game.best?.h2h
  if (h2h?.away?.price != null) {
    options.push({
      key: legKey(game.id, 'h2h', 'away'),
      gameId: game.id,
      market: 'h2h',
      label: `${game.away} ML`,
      american: h2h.away.price,
      book: h2h.away.book,
      matchup,
    })
  }
  if (h2h?.home?.price != null) {
    options.push({
      key: legKey(game.id, 'h2h', 'home'),
      gameId: game.id,
      market: 'h2h',
      label: `${game.home} ML`,
      american: h2h.home.price,
      book: h2h.home.book,
      matchup,
    })
  }

  const spread = game.best?.spread
  if (spread?.away?.price != null) {
    const pt = spread.away.point
    options.push({
      key: legKey(game.id, 'spreads', 'away'),
      gameId: game.id,
      market: 'spreads',
      label: `${game.away} ${pt > 0 ? '+' : ''}${pt}`,
      american: spread.away.price,
      book: spread.away.book,
      matchup,
    })
  }
  if (spread?.home?.price != null) {
    const pt = spread.home.point
    options.push({
      key: legKey(game.id, 'spreads', 'home'),
      gameId: game.id,
      market: 'spreads',
      label: `${game.home} ${pt > 0 ? '+' : ''}${pt}`,
      american: spread.home.price,
      book: spread.home.book,
      matchup,
    })
  }

  const total = game.best?.total
  if (total?.over?.price != null) {
    options.push({
      key: legKey(game.id, 'totals', 'over'),
      gameId: game.id,
      market: 'totals',
      label: `Over ${total.over.point}`,
      american: total.over.price,
      book: total.over.book,
      matchup,
    })
  }
  if (total?.under?.price != null) {
    options.push({
      key: legKey(game.id, 'totals', 'under'),
      gameId: game.id,
      market: 'totals',
      label: `Under ${total.under.point}`,
      american: total.under.price,
      book: total.under.book,
      matchup,
    })
  }

  return options
}

export default function Parlay() {
  const [sport, setSport] = useSportSelection('parlay')
  const [legs, setLegs] = useState([])
  const [stake, setStake] = useState(25)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['odds', sport],
    queryFn: () => getOdds(sport),
    staleTime: 30_000,
  })

  const games = useMemo(
    () => sortGamesByTime(data ? parseOddsForComparison(data) : []),
    [data],
  )

  const legGameIds = useMemo(() => new Set(legs.map(l => l.gameId)), [legs])

  const combinedAmerican = combineParlayAmericanOdds(legs.map(l => l.american))
  const payout = parlayPayout(stake, legs.map(l => l.american))

  function addLeg(option) {
    if (legs.length >= MAX_LEGS) return
    if (legs.some(l => l.key === option.key)) return
    if (legGameIds.has(option.gameId)) return
    setLegs(prev => [...prev, option])
  }

  function removeLeg(key) {
    setLegs(prev => prev.filter(l => l.key !== key))
  }

  function clearSlip() {
    setLegs([])
  }

  return (
    <div className="pb-44 sm:pb-36">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={22} style={{ color: '#f59e0b' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Parlay Builder
          </h1>
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Stack up to {MAX_LEGS} legs from today&apos;s best lines. Combined odds are illustrative — actual parlay prices vary by sportsbook.
        </p>
      </div>

      <SportSelector selected={sport} onChange={setSport} />

      {isError && <OddsLoadError message={error?.message} onRetry={() => refetch()} />}

      {isLoading && (
        <div className="rounded-xl p-8 text-center shimmer" style={{ border: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Loading games…</p>
        </div>
      )}

      {!isLoading && !isError && games.length === 0 && (
        <div className="rounded-xl p-8 text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <p className="font-semibold" style={{ color: '#0f172a' }}>No games on today&apos;s slate</p>
        </div>
      )}

      <div className="space-y-4 mt-4">
        {games.map(game => {
          const options = buildLegOptions(game)
          const timeLabel = getOddsGameTimeLabel(game.commenceTime)
          const gameBlocked = legGameIds.has(game.id)

          return (
            <div
              key={game.id}
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid #e2e8f0', background: '#fff' }}
            >
              <div
                className="px-4 py-3 flex flex-wrap items-center justify-between gap-2"
                style={{ background: '#1e293b' }}
              >
                <div>
                  <p className="text-xs font-bold uppercase" style={{ color: '#f59e0b' }}>{timeLabel}</p>
                  <p className="font-bold text-white text-sm sm:text-base">
                    {game.away} <span style={{ color: '#94a3b8' }}>@</span> {game.home}
                  </p>
                </div>
                {gameBlocked && (
                  <span className="text-xs font-bold px-2 py-1 rounded-md" style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                    In parlay
                  </span>
                )}
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {options.map(opt => {
                  const selected = legs.some(l => l.key === opt.key)
                  const disabled = selected || gameBlocked || legs.length >= MAX_LEGS
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => addLeg(opt)}
                      className="px-3 py-2 rounded-lg text-left transition-opacity"
                      style={{
                        background: selected ? '#dcfce7' : '#f8fafc',
                        border: `1.5px solid ${selected ? '#16a34a' : '#e2e8f0'}`,
                        opacity: disabled && !selected ? 0.45 : 1,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        minWidth: 140,
                      }}
                    >
                      <span className="block text-xs font-bold" style={{ color: '#0f172a' }}>{opt.label}</span>
                      <span className="block text-sm font-black" style={{ color: '#16a34a' }}>
                        {formatOdds(opt.american)} · {SPORTSBOOK_LABELS[opt.book] || opt.book}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Slip */}
      <div
        className="fixed left-0 right-0 z-30 px-4 pb-4"
        style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div
          className="max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-lg"
          style={{ border: '2px solid #f59e0b', background: '#0f172a', color: '#fff' }}
        >
          <div
            className="px-4 sm:px-6 py-3 flex items-center justify-between"
            style={{ background: '#f59e0b', color: '#0f172a' }}
          >
            <span className="font-black uppercase text-sm sm:text-base" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Your parlay · {legs.length}/{MAX_LEGS}
            </span>
            {legs.length > 0 && (
              <button
                type="button"
                onClick={clearSlip}
                className="flex items-center gap-1 text-xs font-bold"
                style={{ color: '#0f172a' }}
              >
                <Trash2 size={14} /> Clear
              </button>
            )}
          </div>

          <div className="px-4 sm:px-6 py-4">
            {legs.length === 0 ? (
              <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
                Tap lines above to build your parlay — one pick per game.
              </p>
            ) : (
              <ul className="space-y-2 mb-4 max-h-52 overflow-y-auto">
                {legs.map(leg => (
                  <li
                    key={leg.key}
                    className="flex items-start justify-between gap-2 text-sm"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}
                  >
                    <div>
                      <span className="font-bold block">{leg.label}</span>
                      <span className="text-xs" style={{ color: '#94a3b8' }}>{leg.matchup}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black" style={{ color: '#4ade80' }}>{formatOdds(leg.american)}</span>
                      <button
                        type="button"
                        onClick={() => removeLeg(leg.key)}
                        aria-label="Remove leg"
                        style={{ color: '#94a3b8' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {legs.length >= 2 && (
              <div className="grid sm:grid-cols-2 gap-4 items-end">
                <div>
                  <p className="text-xs font-bold uppercase mb-1" style={{ color: '#fbbf24' }}>Combined odds</p>
                  <p className="text-3xl font-black" style={{ fontFamily: "'Oswald', sans-serif", color: '#4ade80' }}>
                    {formatAmericanOdds(combinedAmerican)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase mb-2" style={{ color: '#fbbf24' }}>Payout if all hit</p>
                  <div className="flex flex-wrap gap-2">
                    {STAKE_OPTIONS.map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setStake(amount)}
                        className="px-3 py-2 rounded-lg text-sm font-bold"
                        style={{
                          background: stake === amount ? '#f59e0b' : 'rgba(255,255,255,0.08)',
                          color: stake === amount ? '#0f172a' : '#fff',
                          border: '1px solid rgba(255,255,255,0.12)',
                        }}
                      >
                        ${amount} → ${parlayPayout(amount, legs.map(l => l.american)).toFixed(2)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {legs.length === 1 && (
              <p className="text-sm font-semibold mt-2" style={{ color: '#fde68a' }}>
                Add at least one more leg to see combined odds.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
