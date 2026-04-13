// MLB Stats API - free, no key required
const MLB_BASE = 'https://statsapi.mlb.com/api/v1'

export async function getTodayProbablePitchers() {
  const today = new Date().toISOString().split('T')[0]
  const res = await fetch(`${MLB_BASE}/schedule?sportId=1&date=${today}&hydrate=probablePitcher(stats)`)
  if (!res.ok) return {}

  const data = await res.json()
  const pitchers = {}

  data.dates?.forEach(d => {
    d.games?.forEach(game => {
      const away = game.teams?.away
      const home = game.teams?.home
      const awayName = away?.team?.name
      const homeName = home?.team?.name

      if (away?.probablePitcher) {
        const p = away.probablePitcher
        const stats = p.stats?.find(s => s.type?.displayName === 'statsSingleSeason')?.stat
        pitchers[awayName] = {
          name: p.fullName,
          wins: stats?.wins ?? '?',
          losses: stats?.losses ?? '?',
          era: stats?.era ?? '?.??',
        }
      }
      if (home?.probablePitcher) {
        const p = home.probablePitcher
        const stats = p.stats?.find(s => s.type?.displayName === 'statsSingleSeason')?.stat
        pitchers[homeName] = {
          name: p.fullName,
          wins: stats?.wins ?? '?',
          losses: stats?.losses ?? '?',
          era: stats?.era ?? '?.??',
        }
      }
    })
  })

  return pitchers
}
