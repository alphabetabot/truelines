import { requireSupabaseUser } from './auth-utils.js'
import {
  getSiteUrl,
  getStripe,
  getStripeConfigStatus,
  getStripePriceId,
  getSubscriptionRow,
  refreshSubscriptionFromStripe,
  subscriptionPayload,
  syncFromCheckoutSession,
  upsertFromStripeSubscription,
} from './billing-utils.js'

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body
  if (typeof req.body === 'string') return Buffer.from(req.body)

  const chunks = []
  return new Promise((resolve, reject) => {
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function handleCheckout(req, res, user) {
  const priceId = getStripePriceId()
  if (!priceId) {
    return res.status(500).json({
      error: 'Stripe price ID is not configured. In Vercel, add STRIPE_PRICE_ID (starts with price_) for your $19.95/mo product, then redeploy.',
      code: 'stripe_price_missing',
    })
  }

  const stripe = getStripe()
  const siteUrl = getSiteUrl()
  const existing = await getSubscriptionRow(user.id)

  const sessionParams = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/premium?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/premium?checkout=cancelled`,
    client_reference_id: user.id,
    metadata: { user_id: user.id },
    subscription_data: {
      metadata: { user_id: user.id },
    },
    allow_promotion_codes: true,
  }

  if (existing?.stripe_customer_id) {
    sessionParams.customer = existing.stripe_customer_id
  } else if (user.email) {
    sessionParams.customer_email = user.email
  }

  const session = await stripe.checkout.sessions.create(sessionParams)
  return res.json({ url: session.url, sessionId: session.id })
}

async function handlePortal(req, res, user) {
  const row = await getSubscriptionRow(user.id)
  if (!row?.stripe_customer_id) {
    return res.status(400).json({ error: 'No billing account found. Subscribe first.' })
  }

  const stripe = getStripe()
  const portal = await stripe.billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    return_url: `${getSiteUrl()}/premium`,
  })

  return res.json({ url: portal.url })
}

async function handleStatus(req, res, user) {
  let row = await getSubscriptionRow(user.id)
  if (row?.stripe_subscription_id) {
    try {
      row = await refreshSubscriptionFromStripe(user.id)
    } catch (err) {
      console.warn('Stripe refresh failed:', err.message)
    }
  }

  return res.json(subscriptionPayload(row))
}

async function handleSync(req, res, user) {
  const sessionId = String(req.body?.sessionId || req.query?.session_id || '').trim()
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' })
  }

  const row = await syncFromCheckoutSession(sessionId)
  if (row.user_id !== user.id) {
    return res.status(403).json({ error: 'Checkout session does not belong to this user' })
  }

  return res.json(subscriptionPayload(row))
}

async function handleWebhook(req, res) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET is not configured' })
  }

  const signature = req.headers['stripe-signature']
  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header' })
  }

  let event
  try {
    const stripe = getStripe()
    const rawBody = await readRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode === 'subscription' && session.subscription) {
          const userId = session.metadata?.user_id || session.client_reference_id
          const stripe = getStripe()
          const subscription = await stripe.subscriptions.retrieve(String(session.subscription))
          await upsertFromStripeSubscription(subscription, userId, session.customer)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = subscription.metadata?.user_id
        if (userId) {
          await upsertFromStripeSubscription(subscription, userId, subscription.customer)
        }
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error('Stripe webhook handler error:', err.message)
    return res.status(500).json({ error: 'Webhook handler failed' })
  }

  return res.json({ received: true })
}

const BILLING_ACTIONS = new Set([
  'billing-checkout',
  'billing-portal',
  'billing-status',
  'billing-sync',
  'billing-webhook',
  'billing-config',
  // Legacy aliases (pre-consolidation URLs)
  'checkout',
  'portal',
  'status',
  'sync',
  'webhook',
])

export function isBillingAction(action) {
  return BILLING_ACTIONS.has(action)
}

/** Route Stripe billing inside picks-status to stay under Vercel's 12-function limit. */
export async function handleBillingRequest(req, res) {
  const action = String(req.query?.action || '').toLowerCase()

  if (req.method === 'POST' && (action === 'billing-webhook' || action === 'webhook' || req.headers['stripe-signature'])) {
    return handleWebhook(req, res)
  }

  if ((action === 'billing-status' || action === 'status') && req.method === 'GET') {
    const user = await requireSupabaseUser(req, res)
    if (!user) return undefined
    return handleStatus(req, res, user)
  }

  if ((action === 'billing-config' || action === 'config') && req.method === 'GET') {
    return res.json(getStripeConfigStatus())
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return undefined
  }

  const user = await requireSupabaseUser(req, res)
  if (!user) return undefined

  try {
    if (action === 'billing-checkout' || action === 'checkout') return handleCheckout(req, res, user)
    if (action === 'billing-portal' || action === 'portal') return handlePortal(req, res, user)
    if (action === 'billing-sync' || action === 'sync') return handleSync(req, res, user)
    res.status(400).json({ error: 'Unknown billing action' })
    return undefined
  } catch (err) {
    console.error('Billing error:', err.message)
    res.status(500).json({ error: err.message })
    return undefined
  }
}
