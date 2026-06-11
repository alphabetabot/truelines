import { getAuthHeaders } from './authHeaders'

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
    throw new Error(data.error || data.message || `Parlay build failed (${res.status})`)
  }
  return data
}
