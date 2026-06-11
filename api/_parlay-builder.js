import { filterBettableGames } from './_pick-metrics.js'

const ODDS_API_KEY = process.env.ODDS_API_KEY || process.env.VITE_ODDS_API_KEY
const BOOKMAKERS = 'draftkings,fanduel,betmgm,williamhill_us,pinnacle,bet365'

const BOOK_LABELS = {
  draftkings: 'DraftKings',
  fanduel: 'FanDuel',
  betmgm: 'BetMGM',
  williamhill_us: 'Caesars',
  pinnacle: 'Pinnacle',
  bet365: 'Bet365',
}

export const PARLAY_SPORT_OPTIONS = [
  { key: 'baseball_mlb', label: 'MLB' },
  { key: 'basketball_nba', label: 'NBA' },
  { key: 'americanfootball_nfl', label: 'NFL' },
  { key: 'icehockey_nhl', label: 'NHL' },
  { key: 'americanfootball_ncaaf', label: 'NCAAF' },
  { key: 'basketball_ncaab', label: 'NCAA M Basketball' },
]

const ALLOWED_SPORT_KEYS = new Set(PARLAY_SPORT_OPTIONS.map(s => s.key))

function formatAmerican(price) {
  if (price == null) return null
  const n = Number(price)
  if (!Number.isFinite(n)) return null
  return n > 0 ? `+${n}` : `${n}`
}

function bestOutcomes(game) {
  const best = { h2h: {}, spreads: {}, totals: {} }

  for (const book of game.bookmakers || []) {
    for (const market of book.markets || []) {
      for (const outcome of market.outcomes || []) {
        const price = Number(outcome.price)
        if (!Number.isFinite(price)) continue
        const bookLabel = BOOK_LABELS[book.key] || book.key
        let key
        if (market.key === 'h2h') {
          key = outcome.name
        } else if (market.key === 'spreads') {
          key = `${outcome.name} ${outcome.point > 0 ? '+' : ''}${outcome.point}`
        } else if (market.key === 'totals') {
          key = `${outcome.name} ${outcome.point}`
        } else {
          continue
        }
        const prev = best[market.key]?.[key]
        if (!prev || price > prev.price) {
          if (!best[market.key]) best[market.key] = {}
          best[market.key][key] = { price, book: bookLabel, point: outcome.point, name: outcome.name }
        }
      }
    }
  }

  return best
}

function summarizeGame(game) {
  const matchup = `${game.away_team} @ ${game.home_team}`
  const best = bestOutcomes(game)
  const lines = []

  for (const [team, data] of Object.entries(best.h2h || {})) {
    lines.push(`ML ${team}: ${formatAmerican(data.price)} (${data.book})`)
  }
  for (const [label, data] of Object.entries(best.spreads || {})) {
    lines.push(`Spread ${label}: ${formatAmerican(data.price)} (${data.book})`)
  }
  for (const [label, data] of Object.entries(best.totals || {})) {
    lines.push(`Total ${label}: ${formatAmerican(data.price)} (${data.book})`)
  }

  return { matchup, lines }
}

async function fetchSportOdds(sportKey) {
  if (!ODDS_API_KEY) throw new Error('Odds API is not configured')
  const url = new URL(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds`)
  url.searchParams.set('apiKey', ODDS_API_KEY)
  url.searchParams.set('regions', 'us')
  url.searchParams.set('markets', 'h2h,spreads,totals')
  url.searchParams.set('oddsFormat', 'american')
  url.searchParams.set('bookmakers', BOOKMAKERS)

  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Odds API error ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error('Unexpected odds API response')
  return data.map(g => ({
    ...g,
    sport: PARLAY_SPORT_OPTIONS.find(s => s.key === sportKey)?.label || sportKey,
  }))
}

function buildSlatePrompt(games) {
  return games.map((game, i) => {
    const { matchup, lines } = summarizeGame(game)
    return `${i + 1}. ${matchup}\n   ${lines.join('\n   ')}`
  }).join('\n\n')
}

function extractJsonObject(text) {
  const trimmed = String(text || '').trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('AI response was not valid JSON')
    return JSON.parse(match[0])
  }
}

function normalizeLegs(rawLegs, legCount) {
  if (!Array.isArray(rawLegs)) throw new Error('AI response missing legs array')
  const legs = rawLegs.slice(0, legCount).map((leg, i) => {
    const pick = String(leg.pick || leg.selection || '').trim()
    const matchup = String(leg.matchup || '').trim()
    const bet = String(leg.bet || '').trim()
    const american = Number(leg.american ?? leg.odds)
    if (!pick || !matchup || !bet || !Number.isFinite(american)) {
      throw new Error(`Leg ${i + 1} is incomplete in AI response`)
    }
    return { pick, matchup, bet, american }
  })

  if (legs.length !== legCount) {
    throw new Error(`Expected ${legCount} legs, got ${legs.length}`)
  }

  const matchups = legs.map(l => l.matchup.toLowerCase())
  if (new Set(matchups).size !== matchups.length) {
    throw new Error('AI suggested duplicate games — try Generate New Parlay')
  }

  return legs
}

async function callClaudeForParlay({ sportLabel, legCount, slateText, avoidMatchups, regenerate }) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const avoidLine = avoidMatchups?.length
    ? `\nDo NOT reuse these matchups: ${avoidMatchups.join(' | ')}`
    : ''
  const regenLine = regenerate
    ? '\nThis is a regeneration — pick a different combination of games and bet types than before.'
    : ''

  const prompt = `You are Vega, TrueOddsIQ's sports betting analyst. Build an illustrative ${legCount}-leg parlay for ${sportLabel} using ONLY the games and lines below. Use real teams and realistic odds from the slate — do not invent games.

RULES:
- Exactly ${legCount} legs, each from a DIFFERENT game/matchup
- Mix of moneyline, spread, or total is fine
- Each leg must cite a sportsbook from the slate
- Entertainment/research only — no guarantees
${avoidLine}${regenLine}

TODAY'S ${sportLabel} SLATE:
${slateText}

Respond with ONLY valid JSON (no markdown):
{"legs":[{"pick":"Team ML","matchup":"Away @ Home","bet":"ML · -142 · DraftKings","american":-142}]}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || `Claude API error ${res.status}`)
  }

  const text = data.content?.find(c => c.type === 'text')?.text || ''
  const parsed = extractJsonObject(text)
  return normalizeLegs(parsed.legs, legCount)
}

export async function buildAiParlayTicket({ sportKey, legCount, previousMatchups = [], regenerate = false }) {
  if (!ALLOWED_SPORT_KEYS.has(sportKey)) {
    throw new Error('Unsupported sport')
  }

  const legs = Math.min(10, Math.max(2, Number(legCount) || 3))
  const sportLabel = PARLAY_SPORT_OPTIONS.find(s => s.key === sportKey)?.label || sportKey

  const rawGames = await fetchSportOdds(sportKey)
  const bettable = filterBettableGames(rawGames)

  if (bettable.length < legs) {
    throw new Error(
      bettable.length === 0
        ? `No bettable ${sportLabel} games on today's slate.`
        : `Only ${bettable.length} ${sportLabel} game${bettable.length === 1 ? '' : 's'} available — choose ${bettable.length} or fewer legs.`,
    )
  }

  const slateGames = bettable.slice(0, 20)
  const slateText = buildSlatePrompt(slateGames)
  const ticketLegs = await callClaudeForParlay({
    sportLabel,
    legCount: legs,
    slateText,
    avoidMatchups: previousMatchups,
    regenerate,
  })

  return {
    sport: sportLabel,
    sportKey,
    legCount: legs,
    legs: ticketLegs,
    generatedAt: new Date().toISOString(),
    disclaimer: 'Illustrative parlay for entertainment only. Not a sportsbook — confirm all lines before wagering.',
  }
}
