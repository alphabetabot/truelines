import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SPORTS } from '../lib/oddsApi'
import { format, subDays } from 'date-fns'
import { getScores, MAX_SCORES_DAYS_FROM } from '../lib/oddsApi'
import { getGameStatus, pacificDateKey } from '../lib/scoreUtils'
import { formatLiveStatusBadge, lookupLiveStatus } from '../lib/liveGameStatus'
import { useLiveStatusMap } from '../hooks/useLiveStatusMap'
import OddsLoadError from '../components/OddsLoadError'

const SCOREABLE_SPORTS = SPORTS.filter(s =>
  !['tennis_atp_french_open', 'mma_mixed_martial_arts'].includes(s.key)
)

function parseScore(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function ScoreCard({ game, liveStatusMap }) {
  const home = game.scores?.find(s => s.name === game.home_team)
  const away = game.scores?.find(s => s.name === game.away_team)
  const gameTime = new Date(game.commence_time)
  const { isFinal, isLive } = getGameStatus(game)
  const homeScore = parseScore(home?.score)
  const awayScore = parseScore(away?.score)
  const hasResult = isFinal && homeScore != null && awayScore != null
  const awayWins = hasResult && awayScore > homeScore
  const homeWins = hasResult && homeScore > awayScore

  const liveDetail = isLive ? lookupLiveStatus(game, liveStatusMap) : null
  const { label: statusLabel, bg: statusBg, color: statusColor } = formatLiveStatusBadge({
    isFinal,
    isLive,
    gameTime,
    liveDetail,
  })

  return (
    <div
      className="mb-2 rounded-xl"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      {/* Header — no overflow-hidden on card; it clipped “Final” and scores at rounded corners */}
      <div
        className="flex items-center justify-between gap-3 rounded-t-xl px-4 py-2"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <span className="min-w-0 shrink text-xs font-semibold text-white truncate">
          {format(gameTime, 'EEE M/d')}
        </span>
        <span
          className="shrink-0 text-xs font-bold whitespace-nowrap px-2.5 py-0.5 rounded-full"
          style={{ background: statusBg, color: statusColor }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Teams + scores */}
      <div className="rounded-b-xl px-4 py-2.5 sm:px-5">
        {/* Away */}
        <div
          className="flex items-center gap-3 py-1.5"
          style={{ borderBottom: '1px solid #f1f5f9' }}
        >
          <span
            className="min-w-0 flex-1 text-sm truncate"
            style={{
              color: 'var(--text-primary)',
              fontWeight: awayWins ? 800 : 500,
            }}
          >
            {game.away_team}
          </span>
          <span
            className="shrink-0 text-lg font-mono tabular-nums"
            style={{
              color: awayWins ? 'var(--green)' : 'var(--text-primary)',
              fontWeight: awayWins ? 800 : 500,
              minWidth: 44,
              textAlign: 'right',
            }}
          >
            {isFinal || isLive ? (away?.score ?? '—') : '—'}
          </span>
        </div>
        {/* Home */}
        <div className="flex items-center gap-3 py-1.5">
          <span
            className="min-w-0 flex-1 text-sm truncate"
            style={{
              color: 'var(--text-primary)',
              fontWeight: homeWins ? 800 : 500,
            }}
          >
            {game.home_team}
          </span>
          <span
            className="shrink-0 text-lg font-mono tabular-nums"
            style={{
              color: homeWins ? 'var(--green)' : 'var(--text-primary)',
              fontWeight: homeWins ? 800 : 500,
              minWidth: 44,
              textAlign: 'right',
            }}
          >
            {isFinal || isLive ? (home?.score ?? '—') : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

function DateTab({ date, selected, onClick, label, displayLabel, gameCount }) {
  const isSelected = selected === label
  return (
    <button
      type="button"
      onClick={() => onClick(label)}
      className="flex flex-col items-center px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all"
      style={{
        background: isSelected ? 'var(--gold)' : 'var(--bg-card)',
        color: isSelected ? 'var(--text-on-cta)' : 'var(--text-muted)',
        border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
      }}
    >
      <span>{displayLabel}</span>
      <span style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>
        {gameCount > 0 ? `${gameCount} game${gameCount === 1 ? '' : 's'}` : 'No games'}
      </span>
    </button>
  )
}

function dateTabLabel(date, todayKey) {
  const key = pacificDateKey(date)
  if (key === todayKey) return 'Today'
  if (key === pacificDateKey(subDays(new Date(), 1))) return 'Yesterday'
  return format(date, 'EEE M/d')
}

export default function Scores({ sport }) {
  const todayKey = pacificDateKey()
  const today = new Date()
  const dates = useMemo(
    () => Array.from({ length: MAX_SCORES_DAYS_FROM }, (_, i) =>
      subDays(today, MAX_SCORES_DAYS_FROM - 1 - i)),
    [todayKey],
  )
  const [selectedKey, setSelectedKey] = useState(todayKey)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['scores', sport],
    queryFn: () => getScores(sport, MAX_SCORES_DAYS_FROM),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const { data: liveStatusMap = {} } = useLiveStatusMap(sport)

  const games = useMemo(() => (data || []).filter(g =>
    pacificDateKey(new Date(g.commence_time)) === selectedKey,
  ), [data, selectedKey])

  const gamesByDay = useMemo(() => {
    const counts = {}
    for (const g of data || []) {
      const key = pacificDateKey(new Date(g.commence_time))
      counts[key] = (counts[key] || 0) + 1
    }
    return counts
  }, [data])

  return (
    <div>
      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
        Game results for the selected sport (last {MAX_SCORES_DAYS_FROM} days).
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {dates.map(d => {
          const key = pacificDateKey(d)
          const count = gamesByDay[key] || 0
          return (
            <DateTab
              key={key}
              date={d}
              selected={selectedKey}
              label={key}
              displayLabel={dateTabLabel(d, todayKey)}
              gameCount={count}
              onClick={setSelectedKey}
            />
          )
        })}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer rounded-xl" style={{ height: 90, border: '1px solid var(--border)' }} />
          ))}
        </div>
      )}

      {isError && (
        <OddsLoadError
          title="Failed to load scores"
          message={error?.message || 'Scores unavailable for this sport'}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && games.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>
            No {SPORTS.find(s => s.key === sport)?.label || 'league'} games on this day
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Try another date above, or switch sport.
          </p>
        </div>
      )}

      {!isLoading && games.map(game => (
        <ScoreCard key={game.id} game={game} liveStatusMap={liveStatusMap} />
      ))}
    </div>
  )
}
