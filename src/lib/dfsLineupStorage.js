const PREFIX = 'dfs-preview-lineup'

export function getDfsLineupKey(userId, sport, contestType) {
  const who = userId || 'guest'
  return `${PREFIX}:${who}:${sport}:${contestType}`
}

export function loadDfsLineup(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveDfsLineup(key, lineup) {
  try {
    if (!lineup?.length) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify(lineup))
    }
  } catch {
    /* ignore */
  }
}
