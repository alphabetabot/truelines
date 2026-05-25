const ODDS_API_KEY = process.env.ODDS_API_KEY || process.env.VITE_ODDS_API_KEY
const BASE_URL = 'https://api.the-odds-api.com/v4'

const ALLOWED_PATHS = [
  /^\/sports$/,
  /^\/sports\/[a-z0-9_]+\/odds$/,
  /^\/sports\/[a-z0-9_]+\/scores$/,
]

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!ODDS_API_KEY) {
    return res.status(500).json({ error: 'ODDS_API_KEY is not configured' })
  }

  const path = String(req.query?.path || '')
  if (!ALLOWED_PATHS.some(pattern => pattern.test(path))) {
    return res.status(400).json({ error: 'Unsupported odds endpoint' })
  }

  const upstreamUrl = new URL(`${BASE_URL}${path}`)
  upstreamUrl.searchParams.set('apiKey', ODDS_API_KEY)

  for (const [key, value] of Object.entries(req.query || {})) {
    if (key === 'path' || key === 'apiKey') continue
    if (Array.isArray(value)) {
      value.forEach(v => upstreamUrl.searchParams.append(key, String(v)))
    } else if (value != null) {
      upstreamUrl.searchParams.set(key, String(value))
    }
  }

  try {
    const upstream = await fetch(upstreamUrl)
    const text = await upstream.text()
    res.setHeader('Cache-Control', upstream.ok ? 's-maxage=30, stale-while-revalidate=60' : 'no-store')
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    return res.status(upstream.status).send(text)
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
