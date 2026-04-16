const API_KEY = import.meta.env.VITE_ODDS_API_KEY
const BASE_URL = 'https://api.the-odds-api.com/v4'

export const SPORTS = [
  { key: 'americanfootball_nfl', label: 'NFL', icon: '🏈' },
  { key: 'americanfootball_ncaaf', label: 'NCAAF', icon: '🏈' },
  { key: 'basketball_nba', label: 'NBA', icon: '🏀' },
  { key: 'basketball_ncaab', label: 'NCAAB', icon: '🏀' },
  { key: 'baseball_mlb', label: 'MLB', icon: '⚾' },
  { key: 'icehockey_nhl', label: 'NHL', icon: '🏒' },
  { key: 'soccer_epl', label: 'EPL', icon: '⚽' },
  { key: 'soccer_usa_mls', label: 'MLS', icon: '⚽' },
  { key: 'tennis_atp_french_open', label: 'Tennis', icon: '🎾' },
  { key: 'mma_mixed_martial_arts', label: 'MMA', icon: '🥊' },
]

export const SPORTSBOOKS = [
  'draftkings',
  'fanduel',
  'betmgm',
  'williamhill_us',
  'pinnacle',
  'bet365',
]

export const SPORTSBOOK_LABELS = {
  draftkings: 'DraftKings',
  fanduel: 'FanDuel',
  betmgm: 'BetMGM',
  williamhill_us: 'Caesars',
  pinnacle: 'Pinnacle',
  bet365: 'Bet365',
}

export const SPORTSBOOK_COLORS = {
  draftkings: '#1a9c3e',
  fanduel: '#1493ff',
  betmgm: '#c9a84c',
  williamhill_us: '#004b87',
  pinnacle: '#ef3340',
  bet365: '#f5a623',
}

async function apiFetch(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set('apiKey', API_KEY)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Odds API error ${res.status}: ${err}`)
  }
  return res.json()
}

export async function getSports() {
  return apiFetch('/sports', { all: false })
}

export async function getOdds(sport, markets = 'h2h,spreads,totals') {
  return apiFetch(`/sports/${sport}/odds`, {
    regions: 'us',
    markets,
    oddsFormat: 'american',
    bookmakers: 'draftkings,fanduel,betmgm,williamhill_us,pinnacle,bet365',
  })
}

export async function getScores(sport) {
  return apiFetch(`/sports/${sport}/scores`, { daysFrom: 7 })
}

// Parse odds data into a structured comparison format
export function parseOddsForComparison(games) {
  return games.map(game => {
    const bookmakerMap = {}
    game.bookmakers?.forEach(bm => {
      bookmakerMap[bm.key] = {}
      bm.markets?.forEach(market => {
        bookmakerMap[bm.key][market.key] = market.outcomes
      })
    })

    // Find best odds for each team
    const bestH2H = findBestH2H(game)
    const bestSpread = findBestSpread(game)
    const bestTotal = findBestTotal(game)

    return {
      id: game.id,
      sport: game.sport_key,
      home: game.home_team,
      away: game.away_team,
      commenceTime: game.commence_time,
      bookmakers: bookmakerMap,
      best: { h2h: bestH2H, spread: bestSpread, total: bestTotal },
    }
  })
}

function findBestH2H(game) {
  const best = { home: null, away: null }
  game.bookmakers?.forEach(bm => {
    const market = bm.markets?.find(m => m.key === 'h2h')
    if (!market) return
    market.outcomes.forEach(o => {
      const isHome = o.name === game.home_team
      const key = isHome ? 'home' : 'away'
      if (best[key] === null || o.price > best[key].price) {
        best[key] = { price: o.price, book: bm.key }
      }
    })
  })
  return best
}

function findBestSpread(game) {
  const best = { home: null, away: null }
  game.bookmakers?.forEach(bm => {
    const market = bm.markets?.find(m => m.key === 'spreads')
    if (!market) return
    market.outcomes.forEach(o => {
      const isHome = o.name === game.home_team
      const key = isHome ? 'home' : 'away'
      if (best[key] === null || o.price > best[key].price) {
        best[key] = { price: o.price, point: o.point, book: bm.key }
      }
    })
  })
  return best
}

function findBestTotal(game) {
  const best = { over: null, under: null }
  game.bookmakers?.forEach(bm => {
    const market = bm.markets?.find(m => m.key === 'totals')
    if (!market) return
    market.outcomes.forEach(o => {
      const key = o.name.toLowerCase()
      if (key === 'over' || key === 'under') {
        if (best[key] === null || o.price > best[key].price) {
          best[key] = { price: o.price, point: o.point, book: bm.key }
        }
      }
    })
  })
  return best
}

export function formatOdds(price) {
  if (price === null || price === undefined) return '—'
  return price > 0 ? `+${price}` : `${price}`
}

export function oddsToImpliedProb(price) {
  if (!price) return null
  if (price > 0) return 100 / (price + 100)
  return Math.abs(price) / (Math.abs(price) + 100)
}

export function impliedProbToPercent(prob) {
  return prob ? `${(prob * 100).toFixed(1)}%` : '—'
}
