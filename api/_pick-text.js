/** Short edge copy for public/free preview responses. */
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

export function publicPickPreview(row) {
  if (!row) return null
  const { edge, ...rest } = row
  return {
    ...rest,
    edge: briefEdgeSummary(edge),
    edgePreview: true,
  }
}
