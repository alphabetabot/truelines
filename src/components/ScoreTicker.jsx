import { useQuery } from '@tanstack/react-query'
import { useRef, useEffect } from 'react'
import { getScores } from '../lib/oddsApi'
import { getScoresTickerColor, getScoresTickerLabel } from '../lib/gameStatus'

function TickerItem({ game }) {
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
      style={{ borderRight: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
      <span style={{ color: getScoresTickerColor(game), fontSize: 9, fontWeight: 700 }}>
        {getScoresTickerLabel(game)}
      </span>
      <span className="text-xs font-semibold" style={{ color: awayWin ? '#fff' : 'rgba(255,255,255,0.6)' }}>
        {awayShort}
      </span>
      {awayScore != null && (
        <span className="font-mono text-xs font-bold" style={{ color: awayWin ? '#4ade80' : '#fff' }}>
          {awayScore}
        </span>
      )}
      <span style={{ color: 'rgba(255,255,255,0.3)' }}>–</span>
      {homeScore != null && (
        <span className="font-mono text-xs font-bold" style={{ color: homeWin ? '#4ade80' : '#fff' }}>
          {homeScore}
        </span>
      )}
      <span className="text-xs font-semibold" style={{ color: homeWin ? '#fff' : 'rgba(255,255,255,0.6)' }}>
        {homeShort}
      </span>
    </div>
  )
}

export default function ScoreTicker() {
  const { data: mlb = [] } = useQuery({
    queryKey: ['ticker-mlb'],
    queryFn: () => getScores('baseball_mlb', 1),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
  const { data: nba = [] } = useQuery({
    queryKey: ['ticker-nba'],
    queryFn: () => getScores('basketball_nba', 1),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
  const { data: nhl = [] } = useQuery({
    queryKey: ['ticker-nhl'],
    queryFn: () => getScores('icehockey_nhl', 1),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const now = new Date()
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const allGames = [...mlb, ...nba, ...nhl].filter(g =>
    new Date(g.commence_time) > cutoff
  ).sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time))

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

  // Always render the bar — show placeholder if no data yet
  const doubled = allGames.length > 0 ? [...allGames, ...allGames] : []

  return (
    <div style={{ background: '#0f172a', borderBottom: '2px solid #1e293b', height: 28, overflow: 'hidden' }}
      className="flex items-center">
      {doubled.length === 0 ? (
        <div className="flex items-center gap-2 px-4">
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Loading scores...</span>
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
