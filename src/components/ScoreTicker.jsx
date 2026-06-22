import { useQuery, useQueries } from '@tanstack/react-query'
import { useRef, useEffect, useMemo } from 'react'
import { getScores } from '../lib/oddsApi'
import {
  filterTickerGames,
  getGameScores,
  getGameStatus,
  sortTickerGames,
} from '../lib/scoreUtils'
import { fetchLiveStatusMapForSport, lookupLiveStatus } from '../lib/liveGameStatus'

function TickerItem({ game, liveStatusMap }) {
  const now = new Date()
  const { isFinal, isLive, isUpcoming, gameTime } = getGameStatus(game, now)
  const { homeScore, awayScore, hasScores } = getGameScores(game)

  const awayShort = game.away_team.split(' ').slice(-1)[0]
  const homeShort = game.home_team.split(' ').slice(-1)[0]
  const awayWin = isFinal && hasScores && awayScore > homeScore
  const homeWin = isFinal && hasScores && homeScore > awayScore

  const liveDetail = isLive ? lookupLiveStatus(game, liveStatusMap) : null
  let statusLabel
  if (isLive) statusLabel = liveDetail ? `● ${liveDetail}` : '● LIVE'
  else if (isFinal) statusLabel = 'FINAL'
  else statusLabel = gameTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  const showScores = hasScores && (isLive || isFinal)

  return (
    <div className="flex items-center gap-2 shrink-0 px-3"
      style={{ borderRight: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
      <span style={{
        color: isLive ? 'var(--green-live)' : isFinal ? 'var(--text-muted)' : 'var(--gold)',
        fontSize: 16,
        fontWeight: 700,
      }}>
        {statusLabel}
      </span>
      <span className="text-xs font-semibold" style={{ color: awayWin ? '#fff' : 'rgba(255,255,255,0.82)' }}>
        {awayShort}
      </span>
      {showScores ? (
        <>
          <span className="font-mono text-xs font-bold" style={{
            color: isLive ? '#fff' : awayWin ? 'var(--green-live)' : '#fff',
          }}>
            {awayScore}
          </span>
          <span style={{ color: 'var(--text-primary)' }}>–</span>
          <span className="font-mono text-xs font-bold" style={{
            color: isLive ? '#fff' : homeWin ? 'var(--green-live)' : '#fff',
          }}>
            {homeScore}
          </span>
        </>
      ) : isUpcoming ? null : (
        <span className="text-xs" style={{ color: 'var(--text-primary)' }}>vs</span>
      )}
      <span className="text-xs font-semibold" style={{ color: homeWin ? '#fff' : 'rgba(255,255,255,0.82)' }}>
        {homeShort}
      </span>
    </div>
  )
}

const TICKER_SPORTS = [
  { key: 'baseball_mlb', queryKey: 'ticker-mlb' },
  { key: 'basketball_nba', queryKey: 'ticker-nba' },
  { key: 'icehockey_nhl', queryKey: 'ticker-nhl' },
]

const SCORES_POLL_MS = 30_000

export default function ScoreTicker({ embedded = false }) {
  const mlb = useQuery({
    queryKey: ['ticker-mlb'],
    queryFn: () => getScores('baseball_mlb', 1),
    staleTime: SCORES_POLL_MS,
    refetchInterval: SCORES_POLL_MS,
  })
  const nba = useQuery({
    queryKey: ['ticker-nba'],
    queryFn: () => getScores('basketball_nba', 1),
    staleTime: SCORES_POLL_MS,
    refetchInterval: SCORES_POLL_MS,
  })
  const nhl = useQuery({
    queryKey: ['ticker-nhl'],
    queryFn: () => getScores('icehockey_nhl', 1),
    staleTime: SCORES_POLL_MS,
    refetchInterval: SCORES_POLL_MS,
  })

  const liveStatusQueries = useQueries({
    queries: TICKER_SPORTS.map(({ key }) => ({
      queryKey: ['live-game-status', key],
      queryFn: () => fetchLiveStatusMapForSport(key),
      staleTime: SCORES_POLL_MS,
      refetchInterval: SCORES_POLL_MS,
    })),
  })

  const mlbLiveMap = liveStatusQueries[0]?.data
  const nbaLiveMap = liveStatusQueries[1]?.data
  const nhlLiveMap = liveStatusQueries[2]?.data
  const liveStatusMap = useMemo(() => ({
    ...(mlbLiveMap || {}),
    ...(nbaLiveMap || {}),
    ...(nhlLiveMap || {}),
  }), [mlbLiveMap, nbaLiveMap, nhlLiveMap])

  const allGames = useMemo(() => {
    const raw = [
      ...(mlb.data || []),
      ...(nba.data || []),
      ...(nhl.data || []),
    ]
    return sortTickerGames(filterTickerGames(raw))
  }, [mlb.data, nba.data, nhl.data])

  const trackRef = useRef(null)
  const rafRef = useRef(null)

  const loading = mlb.isLoading || nba.isLoading || nhl.isLoading
  const needsMarquee = allGames.length > 4

  const displayGames = useMemo(() => {
    if (allGames.length === 0) return []
    return needsMarquee ? [...allGames, ...allGames] : allGames
  }, [allGames, needsMarquee])

  useEffect(() => {
    const track = trackRef.current
    if (!track || displayGames.length === 0 || !needsMarquee) {
      if (track) track.style.transform = 'translateX(0)'
      return
    }
    let pos = 0
    const animate = () => {
      pos += 0.4
      if (pos >= track.scrollWidth / 2) pos = 0
      track.style.transform = `translateX(-${pos}px)`
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [displayGames.length, needsMarquee])

  const shellStyle = embedded
    ? { height: 28, overflow: 'hidden' }
    : { background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)', height: 28, overflow: 'hidden' }

  return (
    <div style={shellStyle} className="flex items-center">
      {loading && displayGames.length === 0 ? (
        <div className="flex items-center gap-2 px-4">
          <span style={{ color: 'var(--text-primary)', fontSize: 16 }}>Loading scores...</span>
        </div>
      ) : displayGames.length === 0 ? (
        <div className="flex items-center gap-2 px-4">
          <span style={{ color: 'var(--text-primary)', fontSize: 16 }}>No games on today&apos;s slate</span>
        </div>
      ) : (
        <div ref={trackRef} className="flex items-center h-full" style={{ willChange: needsMarquee ? 'transform' : 'auto' }}>
          {displayGames.map((game, i) => (
            <TickerItem key={`${game.id}-${i}`} game={game} liveStatusMap={liveStatusMap} />
          ))}
        </div>
      )}
    </div>
  )
}
