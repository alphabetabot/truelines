import { useQuery } from '@tanstack/react-query'
import { useRef, useEffect, useMemo } from 'react'
import { getScores } from '../lib/oddsApi'
import {
  filterTickerGames,
  getGameScores,
  getGameStatus,
  sortTickerGames,
} from '../lib/scoreUtils'

function TickerItem({ game }) {
  const now = new Date()
  const { isFinal, isLive, isUpcoming, gameTime } = getGameStatus(game, now)
  const { homeScore, awayScore, hasScores } = getGameScores(game)

  const awayShort = game.away_team.split(' ').slice(-1)[0]
  const homeShort = game.home_team.split(' ').slice(-1)[0]
  const awayWin = isFinal && hasScores && awayScore > homeScore
  const homeWin = isFinal && hasScores && homeScore > awayScore

  let statusLabel
  if (isLive) statusLabel = '● LIVE'
  else if (isFinal) statusLabel = 'FINAL'
  else statusLabel = gameTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  const showScores = hasScores && (isLive || isFinal)

  return (
    <div className="flex items-center gap-2 shrink-0 px-3"
      style={{ borderRight: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
      <span style={{
        color: isLive ? '#4ade80' : isFinal ? '#94a3b8' : '#fbbf24',
        fontSize: 9,
        fontWeight: 700,
      }}>
        {statusLabel}
      </span>
      <span className="text-xs font-semibold" style={{ color: awayWin ? '#fff' : 'rgba(255,255,255,0.6)' }}>
        {awayShort}
      </span>
      {showScores ? (
        <>
          <span className="font-mono text-xs font-bold" style={{
            color: isLive ? '#fff' : awayWin ? '#4ade80' : '#fff',
          }}>
            {awayScore}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>–</span>
          <span className="font-mono text-xs font-bold" style={{
            color: isLive ? '#fff' : homeWin ? '#4ade80' : '#fff',
          }}>
            {homeScore}
          </span>
        </>
      ) : isUpcoming ? null : (
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>vs</span>
      )}
      <span className="text-xs font-semibold" style={{ color: homeWin ? '#fff' : 'rgba(255,255,255,0.6)' }}>
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

export default function ScoreTicker() {
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

  useEffect(() => {
    const track = trackRef.current
    if (!track || allGames.length === 0) return
    let pos = 0
    const animate = () => {
      pos += 0.4
      if (pos >= track.scrollWidth / 2) pos = 0
      track.style.transform = `translateX(-${pos}px)`
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [allGames.length])

  const doubled = allGames.length > 0 ? [...allGames, ...allGames] : []
  const loading = mlb.isLoading || nba.isLoading || nhl.isLoading

  return (
    <div style={{ background: '#0f172a', borderBottom: '2px solid #1e293b', height: 28, overflow: 'hidden' }}
      className="flex items-center">
      {loading && doubled.length === 0 ? (
        <div className="flex items-center gap-2 px-4">
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Loading scores...</span>
        </div>
      ) : doubled.length === 0 ? (
        <div className="flex items-center gap-2 px-4">
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>No games on today&apos;s slate</span>
        </div>
      ) : (
        <div ref={trackRef} className="flex items-center h-full" style={{ willChange: 'transform' }}>
          {doubled.map((game, i) => (
            <TickerItem key={`${game.id}-${i}`} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}
