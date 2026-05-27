export function parseScore(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function pacificDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
  }).format(date)
}

export function getGameScores(game) {
  const home = game.scores?.find(s => s.name === game.home_team)
  const away = game.scores?.find(s => s.name === game.away_team)
  const homeScore = parseScore(home?.score)
  const awayScore = parseScore(away?.score)
  return {
    homeScore,
    awayScore,
    hasScores: homeScore != null && awayScore != null,
  }
}

export function getGameStatus(game, now = new Date()) {
  const gameTime = new Date(game.commence_time)
  const completed = game.completed === true
  const started = gameTime.getTime() <= now.getTime()
  const { hasScores } = getGameScores(game)
  const isLive = !completed && (started || hasScores)
  return {
    gameTime,
    isFinal: completed,
    isLive,
    isUpcoming: !completed && !isLive,
  }
}

/** Ticker: today (Pacific) + any in-progress game; drop yesterday's finals. */
export function filterTickerGames(games, now = new Date()) {
  const todayKey = pacificDateKey(now)

  return games.filter(game => {
    const { isFinal, isLive, isUpcoming, gameTime } = getGameStatus(game, now)
    const gameDayKey = pacificDateKey(gameTime)

    if (isLive) return true
    if (gameDayKey !== todayKey) return false
    return isUpcoming || isFinal
  })
}

export function sortTickerGames(games, now = new Date()) {
  const rank = game => {
    const { isLive, isUpcoming } = getGameStatus(game, now)
    if (isLive) return 0
    if (isUpcoming) return 1
    return 2
  }

  return [...games].sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    if (ra !== rb) return ra - rb
    return new Date(a.commence_time) - new Date(b.commence_time)
  })
}
