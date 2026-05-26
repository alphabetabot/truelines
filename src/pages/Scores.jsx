import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SPORTS } from '../lib/oddsApi'
import { format, subDays, isSameDay } from 'date-fns'
import { getScores, MAX_SCORES_DAYS_FROM } from '../lib/oddsApi'
import OddsLoadError from '../components/OddsLoadError'

const SCOREABLE_SPORTS = SPORTS.filter(s =>
  !['tennis_atp_french_open', 'mma_mixed_martial_arts'].includes(s.key)
)

function parseScore(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function ScoreCard({ game }) {
  const home = game.scores?.find(s => s.name === game.home_team)
  const away = game.scores?.find(s => s.name === game.away_team)
  const isCompleted = game.completed
  const gameTime = new Date(game.commence_time)
  const homeScore = parseScore(home?.score)
  const awayScore = parseScore(away?.score)
  const hasResult = isCompleted && homeScore != null && awayScore != null
  const awayWins = hasResult && awayScore > homeScore
  const homeWins = hasResult && homeScore > awayScore

  return (
    <div className="rounded-xl overflow-hidden mb-2"
      style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5"
        style={{ background: '#1e293b' }}>
        <span className="text-xs font-semibold text-white">
          {format(gameTime, 'EEE M/d')}
        </span>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: isCompleted ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.2)',
            color: isCompleted ? '#4ade80' : '#fbbf24'
          }}>
          {isCompleted ? 'Final' : format(gameTime, 'h:mm a')}
        </span>
      </div>

      {/* Teams + scores */}
      <div className="px-4 py-2">
        {/* Away */}
        <div className="flex items-center justify-between py-1.5"
          style={{ borderBottom: '1px solid #f1f5f9' }}>
          <span className="text-sm" style={{
            color: '#0f172a',
            fontWeight: awayWins ? 800 : 500,
          }}>
            {game.away_team}
          </span>
          <span className="text-lg font-mono" style={{
            color: awayWins ? '#16a34a' : '#0f172a',
            fontWeight: awayWins ? 800 : 500,
            minWidth: 36,
            textAlign: 'right',
          }}>
            {isCompleted ? (away?.score ?? '—') : '—'}
          </span>
        </div>
        {/* Home */}
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm" style={{
            color: '#0f172a',
            fontWeight: homeWins ? 800 : 500,
          }}>
            {game.home_team}
          </span>
          <span className="text-lg font-mono" style={{
            color: homeWins ? '#16a34a' : '#0f172a',
            fontWeight: homeWins ? 800 : 500,
            minWidth: 36,
            textAlign: 'right',
          }}>
            {isCompleted ? (home?.score ?? '—') : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

function DateTab({ date, selected, onClick, label }) {
  const isSelected = selected === label
  return (
    <button
      onClick={() => onClick(label)}
      className="flex flex-col items-center px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all"
      style={{
        background: isSelected ? '#1e293b' : '#fff',
        color: isSelected ? '#fff' : '#64748b',
        border: `1px solid ${isSelected ? '#1e293b' : '#e2e8f0'}`,
      }}
    >
      <span style={{ fontSize: 10, opacity: 0.7 }}>{format(date, 'EEE')}</span>
      <span>{format(date, 'M/d')}</span>
    </button>
  )
}

export default function Scores({ sport }) {
  const today = new Date()
  const dates = Array.from({ length: 8 }, (_, i) => subDays(today, 7 - i)) // last 7 days + today
  const [selectedLabel, setSelectedLabel] = useState(format(today, 'M/d'))

  const selectedDate = dates.find(d => format(d, 'M/d') === selectedLabel) || today

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['scores', sport],
    queryFn: () => getScores(sport),
    staleTime: 60_000,
  })

  const games = (data || []).filter(g => {
    const gameDate = new Date(g.commence_time)
    return isSameDay(gameDate, selectedDate)
  })

  return (
    <div>
      {/* Date tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {dates.map(d => (
          <DateTab
            key={format(d, 'M/d')}
            date={d}
            selected={selectedLabel}
            label={format(d, 'M/d')}
            onClick={setSelectedLabel}
          />
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer rounded-xl" style={{ height: 90, border: '1px solid #e2e8f0' }} />
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
          <p className="text-lg font-medium" style={{ color: '#94a3b8' }}>No games on {format(selectedDate, 'EEEE, MMMM d')}</p>
        </div>
      )}

      {!isLoading && games.map(game => (
        <ScoreCard key={game.id} game={game} />
      ))}
    </div>
  )
}
