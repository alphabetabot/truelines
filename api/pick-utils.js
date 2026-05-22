/** Shared helpers for picks storage, grading, and display */

export function parseAmericanOdds(oddsStr) {
  if (!oddsStr) return null
  const match = String(oddsStr).match(/([+-]?\d+)/)
  if (!match) return null
  const n = parseInt(match[1], 10)
  if (Number.isNaN(n) || Math.abs(n) < 100) return null
  return n
}

export function profitUnits(americanOdds, won) {
  const odds = typeof americanOdds === 'number' ? americanOdds : parseAmericanOdds(americanOdds)
  if (!odds) return won ? 1 : -1
  if (!won) return -1
  if (odds > 0) return odds / 100
  return 100 / Math.abs(odds)
}

export function formatConfidence(stars) {
  const n = Math.min(5, Math.max(1, stars || 3))
  return '★'.repeat(n)
}

/** Extract "Away @ Home" from a pick section */
export function extractMatchup(section) {
  const arrowMatch = section.match(/([A-Za-z0-9\s.'-]+?)\s+@\s+([A-Za-z0-9\s.'-]+?)\s*(?:→|->)/)
  if (arrowMatch) {
    return `${arrowMatch[1].trim()} @ ${arrowMatch[2].trim()}`
  }
  const atMatch = section.match(/(?:^|\n)\s*(?:[A-Z]{2,4}:?\s*)?([A-Za-z0-9\s.'-]+?)\s+@\s+([A-Za-z0-9\s.'-]+?)(?:\s|$|\n)/m)
  if (atMatch) {
    return `${atMatch[1].trim()} @ ${atMatch[2].trim()}`
  }
  return null
}

/** Strip sport prefix from pick headline */
export function cleanPickHeadline(headline) {
  return headline
    .replace(/^FADE:\s*/i, '')
    .replace(/^(?:MLB|NBA|NHL|NFL)\s*(?:Pick)?:\s*/i, '')
    .trim()
}

export function formatBetDisplay({ betType, odds, bestBook, isFade }) {
  const oddsStr = odds && odds !== 'N/A' ? odds : ''
  const book = bestBook && bestBook !== 'N/A' ? bestBook : ''
  if (isFade) return `FADE${book ? ` · ${book}` : ''}`
  const parts = [betType, oddsStr, book].filter(Boolean)
  return parts.join(' · ') || 'N/A'
}

export function extractSportFromPick(pickLine) {
  const clean = pickLine.replace(/^FADE:\s*/i, '')
  if (clean.toUpperCase().startsWith('MLB')) return 'MLB'
  if (clean.toUpperCase().startsWith('NBA')) return 'NBA'
  if (clean.toUpperCase().startsWith('NHL')) return 'NHL'
  if (clean.toUpperCase().startsWith('NFL')) return 'NFL'
  if (clean.toLowerCase().includes('baseball')) return 'MLB'
  if (clean.toLowerCase().includes('basketball')) return 'NBA'
  if (clean.toLowerCase().includes('hockey')) return 'NHL'
  if (clean.toLowerCase().includes('football')) return 'NFL'
  return 'Mixed'
}
