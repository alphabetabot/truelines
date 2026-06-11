import { getAuthHeaders } from './authHeaders'

export const PARLAY_DAILY_LIMIT = 3

export async function fetchParlayUsage() {
  const headers = await getAuthHeaders()
  const res = await fetch('/api/picks-status?action=parlay-usage', { headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Could not load parlay limit')
  }
  return data.usage
}

export async function buildAiParlay({ sport, legs, regenerate = false, previousMatchups = [] }) {
  const headers = await getAuthHeaders()
  const res = await fetch('/api/picks-status?action=ai-parlay', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sport, legs, regenerate, previousMatchups }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || data.message || `Parlay build failed (${res.status})`)
    err.code = data.code
    err.usage = data.usage
    throw err
  }
  return data
}
