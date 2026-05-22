// Store daily picks in Supabase
import { getSupabase } from './supabase-client.js'
import {
  extractMatchup,
  cleanPickHeadline,
  formatBetDisplay,
  extractSportFromPick,
  parseAmericanOdds,
  formatConfidence,
  preparePicksForStore,
} from './pick-utils.js'

/**
 * Parse picks from Claude's response text
 * Expected format with sections separated by ---
 */
export function extractPicksFromResponse(claudeResponse) {
  const sections = claudeResponse.split('---').map(s => s.trim())
  const picks = []

  for (const section of sections) {
    if (!section) continue

    const isFade = section.includes('FADE') || section.includes('❌')
    const pickMatch = section.match(/\*\*(.+?)\*\*/i)
    const betMatch = section.match(/- Bet: (.+?) at (.+?) via (.+?)(?:\n|$)/i)
    const confMatch = section.match(/- Confidence:\s*([\d★\/]+)/i)
    const edgeMatch = section.match(/- Edge: (.+?)(?:\n\n|$)/is)
    const whyMatch = section.match(/- Why: (.+?)(?:\n|$)/i)

    if (!pickMatch) continue

    const confidenceStr = confMatch ? confMatch[1] : '3'
    let stars = (confidenceStr.match(/★/g) || []).length
    if (!stars) {
      const numMatch = confidenceStr.match(/(\d)/)
      stars = numMatch ? parseInt(numMatch[1], 10) : 3
    }

    const rawHeadline = pickMatch[1].trim()
    const pickLine = isFade ? `FADE: ${rawHeadline}` : rawHeadline
    const matchup = extractMatchup(section)
    const pickSelection = cleanPickHeadline(rawHeadline)
    const sport = extractSportFromPick(pickLine)

    picks.push({
      pickLine,
      pickSelection,
      game: matchup || pickSelection,
      sport,
      betType: betMatch ? betMatch[1].trim() : (isFade ? 'Fade' : 'Pick'),
      odds: betMatch ? betMatch[2].trim() : null,
      bestBook: betMatch ? betMatch[3].trim() : null,
      confidence: stars,
      edge: (edgeMatch?.[1] || whyMatch?.[1] || '').trim(),
      isFade,
    })
  }

  return picks
}

/**
 * Validate, attach DraftKings odds, and store picks (replaces same-day rows)
 */
export async function storePicks(rawPicks, date, oddsByMatchup) {
  const picks = preparePicksForStore(rawPicks, oddsByMatchup)
  if (!picks.length) return []

  const dateStr = date.toISOString().split('T')[0]

  const rows = picks.map((pick) => {
    const oddsNum = typeof pick.odds === 'number' ? pick.odds : parseAmericanOdds(pick.odds)
    const bet = formatBetDisplay(pick)

    return {
      date: dateStr,
      sport: pick.sport,
      game: pick.game,
      pick: pick.pickSelection,
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

  await supabase.from('daily_picks').delete().eq('date', dateStr)

  const { data, error } = await supabase
    .from('daily_picks')
    .insert(rows)
    .select('*')

  if (error) {
    const fallbackRows = picks.map((pick) => ({
      date: dateStr,
      sport: pick.sport,
      game: pick.game,
      pick: pick.pickSelection,
      bet: formatBetDisplay(pick),
      confidence: formatConfidence(pick.confidence),
      edge: pick.edge,
      result: null,
    }))

    await supabase.from('daily_picks').delete().eq('date', dateStr)
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
