/**
 * Debug grading for series games — run: node scripts/debug-grade-may31.mjs
 */
import {
  findGameForPick,
  findGameForPickWithDateFallback,
  gradePickResult,
  resolvePickGrade,
  gameMatchesPickDate,
} from '../api/pick-utils.js'
import { getMLBGamesInRange } from '../api/grading-scores.js'

const PICKS = [
  { date: '2026-05-31', game: 'Atlanta Braves @ Cincinnati Reds', pick: 'Atlanta Braves ML', bet_type: 'ML', odds: -125 },
  { date: '2026-05-31', game: 'Milwaukee Brewers @ Houston Astros', pick: 'Milwaukee Brewers ML', bet_type: 'ML', odds: -197 },
  { date: '2026-05-31', game: 'Los Angeles Dodgers @ Philadelphia Phillies', pick: 'Los Angeles Dodgers ML', bet_type: 'ML', odds: -212 },
]

const games = await getMLBGamesInRange('2026-05-28', '2026-06-01')

for (const pick of PICKS) {
  const teamMatches = games.filter(g =>
    g.away_team?.includes('Braves') || g.home_team?.includes('Braves') ||
    g.away_team?.includes('Brewers') || g.away_team?.includes('Dodgers') ||
    pick.game.includes(g.away_team?.split(' ').slice(-1)[0] || 'XXX')
  )
  const relevant = games.filter(g => {
    const blob = `${g.away_team} ${g.home_team}`
    return pick.game.split('@').every(part => {
      const t = part.trim().split(' ').slice(-1)[0]
      return blob.includes(t)
    })
  })

  console.log('\n===', pick.pick, pick.date, '===')
  console.log('Relevant finals:')
  for (const g of relevant) {
    console.log(
      `  ${g.game_date} / PT ${g.pacific_date}: ${g.away_team} ${g.away_score} @ ${g.home_team} ${g.home_score}`,
      gameMatchesPickDate(g, pick.date) ? '← MATCHES pick.date' : ''
    )
  }

  const resolved = resolvePickGrade(
    { ...pick, sport: 'MLB', result: '?' },
    games,
    { resolveOdds: p => p.odds }
  )
  if (resolved.skipReason) {
    console.log('SKIP:', resolved.skipReason)
  } else {
    console.log(
      `GRADE: ${resolved.result} (${resolved.units?.toFixed?.(2)}u) using ${resolved.game.away_score}-${resolved.game.home_score} on ${resolved.game.game_date} / ${resolved.game.pacific_date}`
    )
  }
}
