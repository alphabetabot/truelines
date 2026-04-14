import { useQuery } from '@tanstack/react-query'
import { useRef, useEffect } from 'react'
import { getScores } from '../lib/oddsApi'

const TICKER_SPORTS = [
  'basketball_nba',
  'baseball_mlb',
  'icehockey_nhl',
]

function TickerItem({ game }) {
  const gameTime = new Date(game.commence_time)
  const now = new Date()
  const isLive = !game.completed && gameTime < now
  const isFinal = game.completed

  const awayShort = game.away_team.split(' ').slice(-1)[0]
  const homeShort = game.home_team.split(' ').slice(-1)[0]
  const home = game.scores?.find(s => s.name === game.home_team)
  const away = game.scores?.find(s => s.name === game.away_team)
  const awayScore = away?.score ?? null
  const homeScore = home?.score ?? null
  const awayWin = isFinal && awayScore > homeScore
  const homeWin = isFinal && homeScore > awayScore

  return (
    <div className="flex items-center gap-2 shrink-0 px-3"
      style={{ borderRight: '1px solid rgba(255,255,255,0.1)', height: 28 }}>
      <span className="font-bold shrink-0"
        style={{ color: isLive ? '#4ade80' : isFinal ? '#94a3b8' : '#fbbf24', fontSize: 9 }}>
        {isLive ? '● LIVE' : isFinal ? 'FINAL' : gameTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </span>
      <span className="text-xs font-semibold" style={{ color: awayWin ? '#fff' : 'rgba(255,255,255,0.65)' }}>
        {awayShort}
      </span>
      {awayScore != null && (
        <span className="font-mono text-xs font-bold" style={{ color: awayWin ? '#4ade80' : 'rgba(255,255,255,0.9)' }}>
          {awayScore}
        </span>
      )}
      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>–</span>
      {homeScore != null && (
        <span className="font-mono text-xs font-bold" style={{ color: homeWin ? '#4ade80' : 'rgba(255,255,255,0.9)' }}>
          {homeScore}
        </span>
      )}
      <span className="text-xs font-semibold" style={{ color: homeWin ? '#fff' : 'rgba(255,255,255,0.65)' }}>
        {homeShort}
      </span>
    </div>
  )
}

function useSportScores(sportKey) {
  return useQuery({
    queryKey: ['scores', sportKey],
    queryFn: () => getScores(sportKey),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}

export default function ScoreTicker() {
  const nba = useSportScores('basketball_nba')
  const mlb = useSportScores('baseball_mlb')
  const nhl = useSportScores('icehockey_nhl')

  const now = new Date()
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000) // last 24 hours

  const allGames = [
    ...(nba.data || []),
    ...(mlb.data || []),
    ...(nhl.data || []),
  ].filter(g => new Date(g.commence_time) > cutoff)

  const trackRef = useRef(null)

  // Auto-scroll animation
  useEffect(() => {
    const track = trackRef.current
    if (!track || allGames.length === 0) return
    let pos = 0
    const speed = 0.5
    const animate = () => {
      pos += speed
      if (pos >= track.scrollWidth / 2) pos = 0
      track.style.transform = `translateX(-${pos}px)`
      raf = requestAnimationFrame(animate)
    }
    let raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [allGames.length])

  if (allGames.length === 0) return null

  // Duplicate for seamless loop
  const doubled = [...allGames, ...allGames]

  return (
    <div style={{ background: '#0f172a', borderBottom: '2px solid #1e293b', overflow: 'hidden', height: 28 }}
      className="relative flex items-center">
      <div ref={trackRef} className="flex items-center" style={{ willChange: 'transform' }}>
        {doubled.map((game, i) => (
          <TickerItem key={`${game.id}-${i}`} game={game} />
        ))}
      </div>
    </div>
  )
}
