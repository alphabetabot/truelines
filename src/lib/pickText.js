/** Short edge copy for public preview; full edge for signed-in users. */
export function briefEdgeSummary(edge, maxSentences = 2) {
  if (!edge || typeof edge !== 'string') return ''
  const trimmed = edge.trim()
  if (!trimmed) return ''

  const sentences = trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g)
  if (!sentences?.length) {
    return trimmed.length > 220 ? `${trimmed.slice(0, 217)}…` : trimmed
  }

  const brief = sentences.slice(0, maxSentences).join('').trim()
  if (brief.length < trimmed.length && !/[.!?]$/.test(brief)) {
    return `${brief}…`
  }
  return brief
}
