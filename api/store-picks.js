// Store daily picks in Supabase
import { getSupabase } from './supabase-client.js'

/**
 * Parse picks from Claude's response text
 * Expected format with sections separated by ---
 */
export function extractPicksFromResponse(claudeResponse) {
  const sections = claudeResponse.split('---').map(s => s.trim())
  const picks = []

  for (const section of sections) {
    if (!section) continue

    const pickMatch = section.match(/\*\*(.+?Pick.+?)\*\*/i)
    const betMatch = section.match(/- Bet: (.+?) at (.+?) via (.+?)(?:\n|$)/i)
    const confMatch = section.match(/- Confidence: ([\d★]+)/i)
    const edgeMatch = section.match(/- Edge: (.+?)(?:\n\n|$)/is)

    if (pickMatch && betMatch) {
      const confidenceStr = confMatch ? confMatch[1] : '★★★'
      const stars = (confidenceStr.match(/★/g) || []).length

      picks.push({
        pickLine: pickMatch[1].trim(),
        betType: betMatch[1].trim(),
        odds: betMatch[2].trim(),
        bestBook: betMatch[3].trim(),
        confidence: stars,
        edge: edgeMatch ? edgeMatch[1].trim() : '',
      })
    }
  }

  return picks
}

/**
 * Store picks in daily_picks table
 */
export async function storePicks(picks, date) {
  if (!picks || picks.length === 0) return []

  const rows = picks.map((pick, idx) => ({
    date: date.toISOString().split('T')[0],
    sport: extractSportFromPick(pick.pickLine),
    game: pick.pickLine,
    pick: pick.pickLine,
    bet: `${pick.bestBook} ${pick.odds}`,
    confidence: pick.confidence,
    edge: pick.edge,
    result: null,
  }))

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('daily_picks')
    .insert(rows, { count: 'exact' })
    .select('*')

  if (error) {
    console.error('Error storing picks:', error.message)
    throw error
  }

  return data || []
}

function extractSportFromPick(pickLine) {
  // Extract sport from lines like "MLB: Pirates @ Rockies" or just "Pirates @ Rockies"
  if (pickLine.toUpperCase().startsWith('MLB')) return 'MLB'
  if (pickLine.toUpperCase().startsWith('NBA')) return 'NBA'
  if (pickLine.toUpperCase().startsWith('NHL')) return 'NHL'
  if (pickLine.toUpperCase().startsWith('NFL')) return 'NFL'
  if (pickLine.toLowerCase().includes('baseball')) return 'MLB'
  if (pickLine.toLowerCase().includes('basketball')) return 'NBA'
  if (pickLine.toLowerCase().includes('hockey')) return 'NHL'
  if (pickLine.toLowerCase().includes('football')) return 'NFL'
  return 'Mixed'
}
