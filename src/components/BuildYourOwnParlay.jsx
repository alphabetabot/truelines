import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Layers, Loader2 } from 'lucide-react'
import { getOdds } from '../lib/oddsApi'
import { filterUpcomingGames } from '../lib/gameFilters'
import { getOddsGameTimeLabel } from '../lib/gameStatus'
import { gameHasDraftKingsOdds, getDraftKingsPickOptions } from '../lib/draftKingsOdds'
import {
  combineParlayAmericanOdds,
  formatAmericanOdds,
  parlayHasSameGameLegs,
  parlayPayout,
} from '../lib/parlayMath'

const TEAM_FONT = "'Oswald', 'Arial Narrow', system-ui, sans-serif"
const BUILD_SPORTS = [
  { key: 'baseball_mlb', label: 'MLB' },
  { key: 'basketball_nba', label: 'NBA' },
  { key: 'americanfootball_nfl', label: 'NFL' },
  { key: 'icehockey_nhl', label: 'NHL' },
  { key: 'soccer_fifa_world_cup', label: 'World Cup' },
  { key: 'americanfootball_ncaaf', label: 'NCAAF' },
  { key: 'basketball_ncaab', label: 'NCAA M Basketball' },
]
const LEG_OPTIONS = Array.from({ length: 9 }, (_, i) => i + 2)
const STAKE = 100

const selectStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '2px solid var(--border)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontSize: 18,
  fontWeight: 700,
}

export default function BuildYourOwnParlay() {
  const [sport, setSport] = useState(BUILD_SPORTS[0].key)
  const [legCount, setLegCount] = useState(3)
  const [selectedLegs, setSelectedLegs] = useState([])
  const [activeLegIndex, setActiveLegIndex] = useState(0)
  const [expandedGameId, setExpandedGameId] = useState(null)
  const [editingLeg, setEditingLeg] = useState(false)

  useEffect(() => {
    setSelectedLegs([])
    setActiveLegIndex(0)
    setExpandedGameId(null)
    setEditingLeg(false)
  }, [sport, legCount])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['parlay-dk-odds', sport],
    queryFn: () => getOdds(sport, 'h2h,spreads,totals', 'draftkings'),
    staleTime: 60_000,
  })

  const games = useMemo(() => {
    const upcoming = filterUpcomingGames(
      (data || []).map(g => ({
        ...g,
        commenceTime: g.commence_time,
        away: g.away_team,
        home: g.home_team,
      })),
    )
    return upcoming.filter(gameHasDraftKingsOdds)
  }, [data])

  const allLegsFilled = selectedLegs.length === legCount
  const combined = allLegsFilled
    ? combineParlayAmericanOdds(selectedLegs.map(l => l.american))
    : null
  const payout100 = allLegsFilled ? parlayPayout(STAKE, selectedLegs.map(l => l.american)) : 0
  const sameGame = parlayHasSameGameLegs(selectedLegs)
  const showSlate = selectedLegs.length < legCount || editingLeg

  function pickLeg(option) {
    const next = [...selectedLegs]
    if (activeLegIndex < next.length) {
      next[activeLegIndex] = option
    } else {
      next.push(option)
    }
    const trimmed = next.slice(0, legCount)
    setSelectedLegs(trimmed)

    if (trimmed.length < legCount) {
      setActiveLegIndex(trimmed.length)
    } else {
      setEditingLeg(false)
    }
    setExpandedGameId(null)
  }

  function removeLeg(index) {
    const next = selectedLegs.filter((_, i) => i !== index)
    setSelectedLegs(next)
    setActiveLegIndex(Math.min(index, Math.max(0, next.length)))
  }

  function clearTicket() {
    setSelectedLegs([])
    setActiveLegIndex(0)
    setExpandedGameId(null)
    setEditingLeg(false)
  }

  return (
    <section className="mt-10">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={22} style={{ color: 'var(--green)' }} />
          <h2
            className="text-xl font-black uppercase"
            style={{ fontFamily: TEAM_FONT, color: 'var(--text-primary)' }}
          >
            Build Your Own
          </h2>
        </div>
        <p className="font-semibold leading-relaxed" style={{ fontSize: 17, color: 'var(--text-muted)' }}>
          Pick your own legs from today&apos;s slate. All odds are DraftKings moneylines, spreads, and totals.
        </p>
      </div>

      <div
        className="rounded-2xl p-6 sm:p-8 mb-6"
        style={{ background: 'var(--bg-card)', border: '2px solid var(--green-border)' }}
      >
        <label className="block mb-2 font-bold uppercase text-sm" style={{ color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
          Sport
        </label>
        <select
          value={sport}
          onChange={e => setSport(e.target.value)}
          style={{ ...selectStyle, marginBottom: 20 }}
        >
          {BUILD_SPORTS.map(s => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>

        <label className="block mb-2 font-bold uppercase text-sm" style={{ color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
          How many legs?
        </label>
        <select
          value={legCount}
          onChange={e => setLegCount(Number(e.target.value))}
          style={{ ...selectStyle, marginBottom: 0 }}
        >
          {LEG_OPTIONS.map(n => (
            <option key={n} value={n}>{n} legs</option>
          ))}
        </select>
      </div>

      {selectedLegs.length > 0 && (
        <div
          className="rounded-xl p-4 mb-6"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-xs font-bold uppercase" style={{ color: 'var(--gold)' }}>
              Your ticket ({selectedLegs.length}/{legCount})
            </p>
            <button
              type="button"
              onClick={clearTicket}
              className="text-xs font-semibold"
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Clear all
            </button>
          </div>
          <ol className="space-y-2">
            {selectedLegs.map((leg, i) => (
              <li
                key={`${leg.gameId}-${leg.market}-${leg.pick}-${i}`}
                className="flex items-start gap-3 rounded-lg px-3 py-2"
                style={{
                  background: i === activeLegIndex && !allLegsFilled ? 'rgba(57,255,100,0.08)' : 'rgba(255,255,255,0.03)',
                  border: i === activeLegIndex && !allLegsFilled ? '1px solid var(--green-border)' : '1px solid transparent',
                }}
              >
                <button
                  type="button"
                  onClick={() => { setActiveLegIndex(i); setEditingLeg(true) }}
                  className="font-black shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm"
                  style={{ background: 'var(--gold)', color: 'var(--text-on-cta)' }}
                >
                  {i + 1}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{leg.label}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{leg.matchup}</p>
                  <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--green)' }}>{leg.bet} · DK</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeLeg(i)}
                  className="text-xs font-semibold shrink-0"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      {showSlate && (
        <div className="mb-4">
          <p className="font-bold uppercase text-sm mb-3" style={{ color: 'var(--green)', letterSpacing: '0.06em' }}>
            {editingLeg ? `Replace leg ${activeLegIndex + 1} of ${legCount}` : `Pick leg ${activeLegIndex + 1} of ${legCount}`}
          </p>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-12" style={{ color: 'var(--text-muted)' }}>
              <Loader2 size={20} className="animate-spin" />
              Loading DraftKings slate…
            </div>
          )}

          {isError && (
            <div
              className="rounded-xl p-4 font-semibold text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
            >
              {error?.message || 'Could not load odds'}
            </div>
          )}

          {!isLoading && !isError && games.length === 0 && (
            <p className="text-center py-8 font-semibold" style={{ color: 'var(--text-muted)' }}>
              No upcoming games with DraftKings lines for this sport right now.
            </p>
          )}

          {!isLoading && games.length > 0 && (
            <div className="space-y-2">
              {games.map(game => {
                const expanded = expandedGameId === game.id
                const options = getDraftKingsPickOptions(game)
                return (
                  <div
                    key={game.id}
                    className="rounded-xl overflow-hidden"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedGameId(expanded ? null : game.id)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">
                          {game.away_team} @ {game.home_team}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {getOddsGameTimeLabel(game.commence_time)}
                        </p>
                      </div>
                      {expanded ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
                    </button>

                    {expanded && (
                      <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {options.map(opt => (
                          <button
                            key={`${opt.market}-${opt.pick}`}
                            type="button"
                            onClick={() => pickLeg(opt)}
                            className="text-left rounded-lg px-3 py-2.5 transition-opacity hover:opacity-90"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                            }}
                          >
                            <p className="text-sm font-bold">{opt.label}</p>
                            <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--green)' }}>
                              {opt.bet}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {allLegsFilled && combined != null && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid var(--green-border)' }}>
          <div
            className="px-5 py-4"
            style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
          >
            <p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--gold)' }}>
              {legCount}-leg parlay · DraftKings odds
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Combined (est.)</p>
                <p className="text-3xl font-black" style={{ color: 'var(--green)', fontFamily: TEAM_FONT }}>
                  {formatAmericanOdds(combined)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>$100 pays</p>
                <p className="text-3xl font-black" style={{ color: 'var(--green)', fontFamily: TEAM_FONT }}>
                  ${payout100.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 space-y-3" style={{ background: 'var(--bg-card)' }}>
            {sameGame && (
              <div
                className="rounded-lg px-3 py-2.5 text-sm font-semibold leading-relaxed"
                style={{ background: 'rgba(245,184,0,0.12)', border: '1px solid var(--gold)', color: 'var(--text-primary)' }}
              >
                <strong style={{ color: 'var(--gold)' }}>Estimated payout only.</strong> This ticket includes multiple legs on the same game. DraftKings uses special Same Game Parlay pricing — confirm the real payout on DraftKings before betting.
              </div>
            )}
            <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Illustrative math only — not a bet slip. Lines move fast. Must be 21+. Place wagers at a licensed sportsbook.
            </p>
            <button
              type="button"
              onClick={clearTicket}
              className="w-full py-3 rounded-xl font-bold"
              style={{
                background: 'transparent',
                color: 'var(--green)',
                border: '2px solid var(--green-border)',
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              Start over
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
