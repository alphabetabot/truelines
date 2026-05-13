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

    const isFade = section.includes('FADE') || section.includes('❌')
    const pickMatch = section.match(/\*\*(.+?)\*\*/i)
    const betMatch = section.match(/- Bet: (.+?) at (.+?) via (.+?)(?:\n|$)/i)
    const whyMatch = section.match(/- Why: (.+?)(?:\n|$)/i)
    const confMatch = section.match(/- Confidence: ([\d★]+)/i)
    const edgeMatch = section.match(/- Edge: (.+?)(?:\n\n|$)/is) || whyMatch

    if (pickMatch) {
      const confidenceStr = confMatch ? confMatch[1] : '★★★'
      const stars = (confidenceStr.match(/★/g) || []).length
      const pickText = pickMatch[1].trim()
      
      // Mark fades with FADE: prefix so log-results can invert them
      const pickLineToStore = isFade ? `FADE: ${pickText}` : pickText

      picks.push({
        pickLine: pickLineToStore,
        betType: betMatch ? betMatch[1].trim() : 'Fade',
        odds: betMatch ? betMatch[2].trim() : 'N/A',
        bestBook: betMatch ? betMatch[3].trim() : 'N/A',
        confidence: stars,
        edge: edgeMatch ? edgeMatch[1].trim() : '',
        isFade,
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
    bet: pick.isFade ? `FADE: ${pick.bestBook} ${pick.odds}` : `${pick.bestBook} ${pick.odds}`,
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
  // Remove FADE: prefix if present
  const clean = pickLine.replace(/^FADE:\s*/i, '')
  // Extract sport from lines like "MLB: Pirates @ Rockies" or just "Pirates @ Rockies"
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
