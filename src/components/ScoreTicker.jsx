import { useQuery } from '@tanstack/react-query'
import { getScores } from '../lib/oddsApi'
import { SPORTS } from '../lib/oddsApi'

const TICKER_SPORTS = [
  'basketball_nba',
  'baseball_mlb',
  'icehockey_nhl',
  'americanfootball_nfl',
  'basketball_ncaab',
]

function TickerItem({ game }) {
  const today = new Date()
  const gameTime = new Date(game.commence_time)
  const isToday =
    gameTime.getFullYear() === today.getFullYear() &&
    gameTime.getMonth() === today.getMonth() &&
    gameTime.getDate() === today.getDate()

  if (!isToday) return null

  const home = game.scores?.find(s => s.name === game.home_team)
  const away = game.scores?.find(s => s.name === game.away_team)
  const isLive = !game.completed && gameTime < today
  const isFinal = game.completed

  // Short team names (last word)
  const awayShort = game.away_team.split(' ').slice(-1)[0]
  const homeShort = game.home_team.split(' ').slice(-1)[0]

  const awayScore = away?.score ?? null
  const homeScore = home?.score ?? null
  const awayWin = isFinal && awayScore > homeScore
  const homeWin = isFinal && homeScore > awayScore

  return (
    <div className="flex items-center gap-2 shrink-0 px-4 py-1"
      style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
      {/* Status */}
      <span className="text-xs font-bold shrink-0"
        style={{ color: isLive ? '#4ade80' : isFinal ? '#94a3b8' : '#fbbf24', fontSize: 9 }}>
        {isLive ? '● LIVE' : isFinal ? 'FINAL' : gameTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </span>

      {/* Away */}
      <span className="text-xs font-bold" style={{ color: awayWin ? '#ffffff' : 'rgba(255,255,255,0.7)' }}>
        {awayShort}
      </span>
      {awayScore != null && (
        <span className="font-mono text-xs font-bold" style={{ color: awayWin ? '#4ade80' : 'rgba(255,255,255,0.9)' }}>
          {awayScore}
        </span>
      )}

      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>-</span>

      {/* Home */}
      {homeScore != null && (
        <span className="font-mono text-xs font-bold" style={{ color: homeWin ? '#4ade80' : 'rgba(255,255,255,0.9)' }}>
          {homeScore}
        </span>
      )}
      <span className="text-xs font-bold" style={{ color: homeWin ? '#ffffff' : 'rgba(255,255,255,0.7)' }}>
        {homeShort}
      </span>
    </div>
  )
}

function SportTicker({ sportKey }) {
  const { data } = useQuery({
    queryKey: ['scores', sportKey],
    queryFn: () => getScores(sportKey),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const today = new Date()
  const todayGames = (data || []).filter(g => {
    const gameTime = new Date(g.commence_time)
    return (
      gameTime.getFullYear() === today.getFullYear() &&
      gameTime.getMonth() === today.getMonth() &&
      gameTime.getDate() === today.getDate()
    )
  })

  if (todayGames.length === 0) return null

  return (
    <>
      {todayGames.map(game => (
        <TickerItem key={game.id} game={game} />
      ))}
    </>
  )
}

export default function ScoreTicker() {
  return (
    <div style={{ background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.08)', overflowX: 'auto' }}
      className="flex items-center">
      <div className="flex items-center" style={{ minWidth: 'max-content' }}>
        {TICKER_SPORTS.map(sport => (
          <SportTicker key={sport} sportKey={sport} />
        ))}
      </div>
    </div>
  )
}
