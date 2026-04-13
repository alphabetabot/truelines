const MLB_BASE = 'https://statsapi.mlb.com/api/v1'

export async function getTodayProbablePitchers() {
  const today = new Date().toISOString().split('T')[0]
  
  try {
    const res = await fetch(
      `${MLB_BASE}/schedule?sportId=1&date=${today}&hydrate=probablePitcher`
    )
    if (!res.ok) return {}
    const data = await res.json()

    // Collect pitcher IDs
    const pitcherIds = []
    const pitcherMap = {} // teamName -> { name, id }

    data.dates?.forEach(d => {
      d.games?.forEach(game => {
        const sides = [
          { side: game.teams?.away, teamName: game.teams?.away?.team?.name },
          { side: game.teams?.home, teamName: game.teams?.home?.team?.name },
        ]
        sides.forEach(({ side, teamName }) => {
          if (side?.probablePitcher && teamName) {
            const p = side.probablePitcher
            pitcherMap[teamName] = { name: p.fullName, id: p.id }
            if (p.id) pitcherIds.push(p.id)
          }
        })
      })
    })

    if (pitcherIds.length === 0) return {}

    // Fetch stats for all pitchers
    const statsRes = await fetch(
      `${MLB_BASE}/people?personIds=${pitcherIds.join(',')}&hydrate=stats(group=pitching,type=season)`
    )
    if (!statsRes.ok) return buildBasicMap(pitcherMap)
    const statsData = await statsRes.json()

    const statsByID = {}
    statsData.people?.forEach(person => {
      const seasonStats = person.stats?.find(
        s => s.group?.displayName === 'pitching' && s.type?.displayName === 'season'
      )
      const s = seasonStats?.splits?.[0]?.stat
      statsByID[person.id] = {
        wins: s?.wins ?? '?',
        losses: s?.losses ?? '?',
        era: s?.era ?? '?.??',
      }
    })

    // Build final map: teamName -> { name, wins, losses, era }
    // Also add city-only and last-word keys for fuzzy matching
    const result = {}
    Object.entries(pitcherMap).forEach(([teamName, { name, id }]) => {
      const stats = statsByID[id] || { wins: '?', losses: '?', era: '?.??' }
      const entry = { name, ...stats }
      result[teamName] = entry
      // e.g. 'New York Yankees' -> also store as 'Yankees'
      const lastWord = teamName.split(' ').slice(-1)[0]
      result[lastWord] = entry
    })

    return result
  } catch (e) {
    console.warn('MLB pitcher fetch failed:', e)
    return {}
  }
}

function buildBasicMap(pitcherMap) {
  const result = {}
  Object.entries(pitcherMap).forEach(([teamName, { name }]) => {
    result[teamName] = { name, wins: '?', losses: '?', era: '?.??' }
  })
  return result
}
