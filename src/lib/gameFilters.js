import { format, isToday, isTomorrow } from 'date-fns'

/** Games that haven't tipped yet (small buffer for clock skew). */
export function isUpcomingGame(game, now = new Date(), bufferMs = 3 * 60 * 1000) {
  const commence = new Date(game.commenceTime || game.commence_time)
  if (Number.isNaN(commence.getTime())) return false
  return commence.getTime() > now.getTime() - bufferMs
}

export function filterUpcomingGames(games, now = new Date()) {
  return (games || []).filter(g => isUpcomingGame(g, now))
}

export function getAnalysisWindow(now = new Date()) {
  const from = new Date(now)
  const to = new Date(now)
  to.setDate(to.getDate() + 7)
  return {
    commenceTimeFrom: from.toISOString(),
    commenceTimeTo: to.toISOString(),
  }
}

export function formatGameOptionLabel(game) {
  const commence = new Date(game.commenceTime || game.commence_time)
  if (Number.isNaN(commence.getTime())) {
    return `${game.away} @ ${game.home}`
  }

  let dayLabel = format(commence, 'EEE M/d')
  if (isToday(commence)) dayLabel = 'Today'
  else if (isTomorrow(commence)) dayLabel = 'Tomorrow'

  const timeLabel = format(commence, 'h:mm a')
  return `${game.away} @ ${game.home} · ${dayLabel} · ${timeLabel}`
}

export function groupGamesByDay(games) {
  const groups = new Map()

  for (const game of games || []) {
    const commence = new Date(game.commenceTime || game.commence_time)
    const key = Number.isNaN(commence.getTime())
      ? 'TBD'
      : format(commence, 'yyyy-MM-dd')

    if (!groups.has(key)) {
      let label = 'Date TBD'
      if (!Number.isNaN(commence.getTime())) {
        if (isToday(commence)) label = 'Today'
        else if (isTomorrow(commence)) label = 'Tomorrow'
        else label = format(commence, 'EEEE, MMM d')
      }
      groups.set(key, { key, label, games: [] })
    }
    groups.get(key).games.push(game)
  }

  return [...groups.values()]
}
