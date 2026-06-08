import { getAuthHeaders } from './authHeaders'

async function billingRequest(action, { method = 'GET', body } = {}) {
  const headers = await getAuthHeaders()
  const res = await fetch(`/api/billing?action=${action}`, {
    method,
    headers: {
      ...headers,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `Billing request failed (${res.status})`)
    err.code = data.code
    err.status = res.status
    throw err
  }
  return data
}

export async function fetchSubscriptionStatus() {
  const headers = await getAuthHeaders()
  const res = await fetch('/api/billing?action=status', { headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Subscription status failed (${res.status})`)
  }
  return data
}

export async function startPremiumCheckout() {
  const data = await billingRequest('checkout', { method: 'POST' })
  if (data.url) window.location.href = data.url
  return data
}

export async function openBillingPortal() {
  const data = await billingRequest('portal', { method: 'POST' })
  if (data.url) window.location.href = data.url
  return data
}

export async function syncCheckoutSession(sessionId) {
  return billingRequest('sync', { method: 'POST', body: { sessionId } })
}
