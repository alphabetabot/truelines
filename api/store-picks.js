// Store daily picks in Supabase
import { getSupabase } from './supabase-client.js'
import {
  extractMatchup,
  cleanPickHeadline,
  formatBetDisplay,
  extractSportFromPick,
  parseAmericanOdds,
  formatConfidence,
} from './pick-utils.js'

/**
 * Parse picks from Claude's response text
 * Expected format with sections separated by ---
 */
export function extractPicksFromResponse(claudeResponse) {
  const sections = splitPickSections(claudeResponse)
  const picks = []

  for (const section of sections) {
    if (!section) continue

    const isFade = /\bFADE\b|❌/i.test(section)
    const rawHeadline = getPickHeadline(section)
    const betLine = getField(section, ['Bet'])
    const confidenceLine = getField(section, ['Confidence'])
    const edgeLine = getField(section, ['Edge', 'Why', 'Reasoning'])

    if (!rawHeadline) continue

    const pickLine = isFade ? `FADE: ${rawHeadline}` : rawHeadline
    const matchup = extractMatchup(section)
    const pickSelection = cleanPickHeadline(rawHeadline)
    const sport = extractSportFromPick(pickLine)
    const bet = parseBetLine(betLine, isFade)

    picks.push({
      pickLine,
      pickSelection,
      game: matchup || pickSelection,
      sport,
      betType: bet.betType,
      odds: bet.odds,
      bestBook: bet.bestBook,
      confidence: parseConfidence(confidenceLine),
      edge: edgeLine,
      isFade,
    })
  }

  return picks
}

function getPickHeadline(section) {
  const boldHeadlines = [...String(section || '').matchAll(/\*\*(.+?)\*\*/gis)]
    .map(match => match[1].trim())
    .filter(Boolean)

  const pickLike = boldHeadlines.find(headline =>
    !headline.includes('@') &&
    /\b(?:MLB|NBA|NHL|NFL)\b|(?:\bML\b|\bmoneyline\b|\bover\b|\bunder\b|[+-]\d+\.?\d*)/i.test(headline)
  )

  if (pickLike) return pickLike

  const nonMatchup = boldHeadlines.find(headline => !headline.includes('@'))
  if (nonMatchup) return nonMatchup

  const fieldMatch = section.match(/(?:^|\n)\s*(?:Pick|Selection):\s*(.+?)(?:\n|$)/i)
  return fieldMatch?.[1]?.trim() || ''
}

function splitPickSections(text) {
  const normalized = String(text || '').replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  const separated = normalized.split(/\n\s*-{3,}\s*\n/g).map(s => s.trim()).filter(Boolean)
  if (separated.length > 1) return separated

  return normalized
    .split(/\n(?=\s*(?:TOP PICK|PICK\s*#?\d+|FADE OF THE DAY)\b)/i)
    .map(s => s.trim())
    .filter(Boolean)
}

function getField(section, labels) {
  for (const label of labels) {
    const match = section.match(new RegExp(`(?:^|\\n)\\s*[-*]?\\s*${label}:\\s*(.+?)(?=\\n\\s*[-*]?\\s*(?:Bet|Confidence|Edge|Why|Reasoning):|\\n\\s*$|$)`, 'is'))
    if (match) return match[1].trim()
  }
  return ''
}

function parseConfidence(confidenceStr) {
  const value = confidenceStr || '3'
  const starCount = (value.match(/[★⭐]/g) || []).length
  if (starCount) return starCount

  const numMatch = value.match(/([1-5])(?:\s*\/\s*5)?/)
  return numMatch ? parseInt(numMatch[1], 10) : 3
}

function parseBetLine(betLine, isFade) {
  if (!betLine) {
    return { betType: isFade ? 'Fade' : 'Pick', odds: null, bestBook: null }
  }

  const oddsMatch = betLine.match(/([+-]\d{3,5})\b/)
  const viaMatch = betLine.match(/\bvia\s+(.+)$/i)
  const bookMatch = viaMatch || betLine.match(/\b(?:at|on)\s+([A-Za-z][A-Za-z0-9 .'-]+)$/i)
  const odds = oddsMatch?.[1] || null
  const bestBook = bookMatch?.[1]?.trim() || null

  let betType = betLine
    .replace(/\bvia\s+.+$/i, '')
    .replace(/\b(?:at|on)\s+[A-Za-z][A-Za-z0-9 .'-]+$/i, '')
    .replace(/\s+at\s+[+-]\d{3,5}\b/i, '')
    .replace(/[+-]\d{3,5}\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  if (!betType) betType = isFade ? 'Fade' : 'Pick'

  return { betType, odds, bestBook }
}

/**
 * Store picks in daily_picks table (replaces same-day rows)
 */
export async function storePicks(picks, date) {
  if (!picks || picks.length === 0) return []

  const dateStr = date.toISOString().split('T')[0]

  const rows = picks.map((pick) => {
    const oddsNum = parseAmericanOdds(pick.odds)
    const bet = formatBetDisplay(pick)
    const pickText = pick.isFade && !/^FADE:/i.test(pick.pickSelection)
      ? `FADE: ${pick.pickSelection}`
      : pick.pickSelection

    return {
      date: dateStr,
      sport: pick.sport,
      game: pick.game,
      pick: pickText,
      bet,
      bet_type: pick.betType,
      odds: oddsNum,
      confidence: formatConfidence(pick.confidence),
      edge: pick.edge,
      result: null,
      units: null,
    }
  })

  const supabase = getSupabase()

  // Replace today's picks so cron re-runs don't hit UNIQUE(date, pick)
  const { error: deleteError } = await supabase.from('daily_picks').delete().eq('date', dateStr)
  if (deleteError) {
    console.error('Error clearing existing picks:', deleteError.message)
    throw deleteError
  }

  const { data, error } = await supabase
    .from('daily_picks')
    .insert(rows)
    .select('*')

  if (error) {
    // Fallback: prod may use `bet` without bet_type/odds columns
    const fallbackRows = picks.map((pick) => ({
      date: dateStr,
      sport: pick.sport,
      game: pick.game,
      pick: pick.isFade && !/^FADE:/i.test(pick.pickSelection) ? `FADE: ${pick.pickSelection}` : pick.pickSelection,
      bet: formatBetDisplay(pick),
      confidence: formatConfidence(pick.confidence),
      edge: pick.edge,
      result: null,
    }))

    const { error: fallbackDeleteError } = await supabase.from('daily_picks').delete().eq('date', dateStr)
    if (fallbackDeleteError) {
      console.error('Error clearing existing picks before fallback:', fallbackDeleteError.message)
      throw fallbackDeleteError
    }

    const { data: fallbackData, error: fallbackError } = await supabase
      .from('daily_picks')
      .insert(fallbackRows)
      .select('*')

    if (fallbackError) {
      console.error('Error storing picks:', fallbackError.message)
      throw fallbackError
    }
    return fallbackData || []
  }

  return data || []
}
