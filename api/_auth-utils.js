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

export function isJobSecretAuthorized(req) {
  const token = getBearerToken(req)
  if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) return true
  if (process.env.NEWSLETTER_SECRET && token === process.env.NEWSLETTER_SECRET) return true
  return false
}

export function requireCronAuth(req, res) {
  if (isCronAuthorized(req)) return true
  res.status(401).json({ error: 'Unauthorized' })
  return false
}

/** Cron jobs + one-off maintenance (e.g. regrade tracker). */
export function requireJobAuth(req, res) {
  if (isJobSecretAuthorized(req)) return true
  const hasCron = Boolean(process.env.CRON_SECRET)
  const hasNewsletter = Boolean(process.env.NEWSLETTER_SECRET)
  res.status(401).json({
    error: 'Unauthorized',
    hint: hasCron || hasNewsletter
      ? 'Send Authorization: Bearer <CRON_SECRET or NEWSLETTER_SECRET>. Use https://www.trueoddsiq.com/api/log-results'
      : 'CRON_SECRET is not configured on this deployment',
  })
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

export async function requirePremiumUser(req, res) {
  const user = await requireSupabaseUser(req, res)
  if (!user) return null

  const { isAdminUser } = await import('./_admin-utils.js')
  if (isAdminUser(user)) return user

  try {
    const { getSubscriptionRow, isPremiumRow } = await import('./_billing-utils.js')
    const row = await getSubscriptionRow(user.id)
    if (!isPremiumRow(row)) {
      res.status(402).json({
        error: 'Premium subscription required',
        code: 'premium_required',
      })
      return null
    }
    return user
  } catch (err) {
    console.error('Premium check failed:', err.message)
    res.status(500).json({ error: 'Unable to verify subscription status' })
    return null
  }
}
