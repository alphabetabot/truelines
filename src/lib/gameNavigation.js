/** Sort games consistently and resolve prev/next for compare & analysis. */

export function sortGamesByTime(games) {
  return [...(games || [])].sort(
    (a, b) => new Date(a.commenceTime) - new Date(b.commenceTime),
  )
}

export function getAdjacentGames(games, selectedId) {
  const sorted = sortGamesByTime(games)
  const index = sorted.findIndex(g => g.id === selectedId)
  if (index < 0) {
    return { sorted, index: -1, prev: null, next: null }
  }
  return {
    sorted,
    index,
    prev: index > 0 ? sorted[index - 1] : null,
    next: index < sorted.length - 1 ? sorted[index + 1] : null,
  }
}
