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
  const lines = String(section || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean)

  for (const line of lines) {
    const atMatch = line.match(/^(?:[A-Z]{2,4}:?\s*)?([^@]+?)\s+@\s+([^@]+?)(?:\s*(?:→|->|\|).*)?$/)
    if (atMatch) {
      const away = cleanTeamName(atMatch[1])
      const home = cleanTeamName(atMatch[2])
      if (away && home) return `${away} @ ${home}`
    }
  }

  return null
}

function cleanTeamName(value) {
  return value
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/, '')
    .replace(/\s*(?:→|->|\|).*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Strip sport prefix from pick headline */
export function cleanPickHeadline(headline) {
  return headline
    .replace(/\*\*/g, '')
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

export function isFadePick(pick) {
  const betType = String(pick?.bet_type || pick?.betType || '').trim()
  if (/^fade$/i.test(betType)) return true
  const text = `${pick?.pick || ''} ${pick?.bet || ''} ${betType}`
  return /\bfade\b/i.test(text) || /^FADE:/i.test(pick?.pick || '')
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
