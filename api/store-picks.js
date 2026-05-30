// Store daily picks in Supabase
import { getSupabase } from './supabase-client.js'
import {
  extractMatchup,
  cleanPickHeadline,
  formatBetDisplay,
  extractSportFromPick,
  resolvePickSport,
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

    if (/\bFADE\b|❌/i.test(section)) continue

    const rawHeadline = getPickHeadline(section)
    const betLine = getField(section, ['Bet'])
    const confidenceLine = getField(section, ['Confidence'])
    const edgeLine = getField(section, ['Edge', 'Why', 'Reasoning'])

    if (!rawHeadline || !betLine) continue

    const pickLine = rawHeadline
    const matchup = extractMatchup(section)
    const pickSelection = cleanPickHeadline(rawHeadline)
    if (!isActionablePick(pickSelection, section)) continue

    const game = matchup || pickSelection
    const sport = resolvePickSport({ pick: pickSelection, game, edge: edgeLine })
    const bet = parseBetLine(betLine, false)

    picks.push({
      pickLine,
      pickSelection,
      game,
      sport,
      betType: bet.betType,
      odds: bet.odds,
      bestBook: bet.bestBook,
      confidence: parseConfidence(confidenceLine),
      edge: edgeLine,
      isFade: false,
    })
  }

  return picks
}

function isActionablePick(pickSelection, section) {
  const text = `${pickSelection} ${section}`.toLowerCase()
  if (!pickSelection || pickSelection.length > 120) return false
  if (/all picks require|verification of live odds|no nba\/nhl|no games|check the site|informational purposes/.test(text)) {
    return false
  }
  return true
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

  const rows = picks.map((pick, index) => {
    const oddsNum = parseAmericanOdds(pick.odds)
    const bet = formatBetDisplay(pick)
    const pickText = pick.isFade && !/^FADE:/i.test(pick.pickSelection)
      ? `FADE: ${pick.pickSelection}`
      : pick.pickSelection

    return {
      date: dateStr,
      sport: resolvePickSport({
        sport: pick.sport,
        pick: pickText,
        game: pick.game,
        edge: pick.edge,
      }),
      game: pick.game,
      pick: pickText,
      bet,
      bet_type: pick.betType,
      odds: oddsNum,
      confidence: formatConfidence(pick.confidence),
      edge: pick.edge,
      result: null,
      units: null,
      _sort_order: index,
    }
  })

  const supabase = getSupabase()
  const existingByPick = await fetchExistingPicksByText(supabase, dateStr)
  const rowsToStore = rows.map(row => {
    const existing = existingByPick.get(row.pick)
    if (existing?.result) {
      return { ...row, result: existing.result, units: existing.units ?? row.units }
    }
    return row
  })

  const { data, error } = await supabase
    .from('daily_picks')
    .upsert(rowsToStore, { onConflict: 'date,pick' })
    .select('*')

  if (error) {
    // Fallback: table may not have the new _sort_order column yet.
    // eslint-disable-next-line no-unused-vars -- sort_order omitted for legacy schema fallback
    const rowsWithoutSortOrder = rowsToStore.map(({ sort_order, ...row }) => row)
    const retry = await supabase
      .from('daily_picks')
      .upsert(rowsWithoutSortOrder, { onConflict: 'date,pick' })
      .select('*')

    if (!retry.error) {
      await deleteStalePicks(supabase, dateStr, rowsToStore.map(row => row.pick))
      return retry.data || []
    }

    // Fallback: prod may use `bet` without bet_type/odds/units columns.
    const fallbackRows = rowsToStore.map(row => ({
      date: dateStr,
      sport: row.sport,
      game: row.game,
      pick: row.pick,
      bet: row.bet,
      confidence: row.confidence,
      edge: row.edge,
      result: null,
    }))

    const { data: fallbackData, error: fallbackError } = await supabase
      .from('daily_picks')
      .upsert(fallbackRows, { onConflict: 'date,pick' })
      .select('*')

    if (fallbackError) {
      console.error('Error storing picks:', fallbackError.message)
      throw fallbackError
    }

    await deleteStalePicks(supabase, dateStr, rowsToStore.map(row => row.pick))
    return fallbackData || []
  }

  await deleteStalePicks(supabase, dateStr, rowsToStore.map(row => row.pick))
  return data || []
}

async function fetchExistingPicksByText(supabase, dateStr) {
  const { data, error } = await supabase
    .from('daily_picks')
    .select('pick,result,units')
    .eq('date', dateStr)

  if (error) {
    console.warn('Failed to inspect existing picks:', error.message)
    return new Map()
  }

  return new Map((data || []).map(row => [row.pick, row]))
}

async function deleteStalePicks(supabase, dateStr, activePickTexts) {
  const active = new Set(activePickTexts)
  const { data, error } = await supabase
    .from('daily_picks')
    .select('id,pick,result')
    .eq('date', dateStr)

  if (error) {
    console.warn('Failed to inspect stale picks:', error.message)
    return
  }

  if ((data || []).some(row => row.result)) {
    return
  }

  const stale = (data || []).filter(row => !active.has(row.pick))
  for (const row of stale) {
    const { error: deleteError } = await supabase.from('daily_picks').delete().eq('id', row.id)
    if (deleteError) {
      console.warn(`Failed to delete stale pick ${row.id}:`, deleteError.message)
    }
  }
}
