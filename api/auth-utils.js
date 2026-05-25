const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

export function getBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || ''
  const match = String(header).match(/^Bearer\s+(.+)$/i)
  return match?.[1] || ''
}

export function isCronAuthorized(req) {
  const token = getBearerToken(req)
  return Boolean(process.env.CRON_SECRET && token === process.env.CRON_SECRET)
}

export function requireCronAuth(req, res) {
  if (isCronAuthorized(req)) return true
  res.status(401).json({ error: 'Unauthorized' })
  return false
}

export async function requireSupabaseUser(req, res) {
  const token = getBearerToken(req)
  if (!token) {
    res.status(401).json({ error: 'Authentication required' })
    return null
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    res.status(500).json({ error: 'Supabase auth environment variables are not configured' })
    return null
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    res.status(401).json({ error: 'Invalid or expired session' })
    return null
  }

  return response.json()
}
