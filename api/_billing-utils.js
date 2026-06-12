import Stripe from 'stripe'
import { getSupabase } from './_supabase-client.js'
import { isAdminUser } from './_admin-utils.js'

export const PREMIUM_PRICE_DISPLAY = '$19.95/mo'
export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing'])

let stripeClient = null

/** Default Premium price IDs — public, not secrets. Matched to sk_test_ vs sk_live_ when env unset. */
export const STRIPE_PRICE_IDS = {
  test: 'price_1TfpfBFCKgaALk0xP6JzwBkm',
  live: 'price_1TRjAFFCKgaALk0xnt5WLpYI',
}

export function getStripeMode() {
  const key = process.env.STRIPE_SECRET_KEY || ''
  if (key.startsWith('sk_live_')) return 'live'
  if (key.startsWith('sk_test_')) return 'test'
  return 'unknown'
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  if (!stripeClient) stripeClient = new Stripe(key)
  return stripeClient
}

export function getStripePriceId() {
  const explicit = (process.env.STRIPE_PRICE_ID || '').trim()
  if (explicit) return explicit

  const mode = getStripeMode()
  if (mode === 'live') return STRIPE_PRICE_IDS.live
  if (mode === 'test') return STRIPE_PRICE_IDS.test
  return ''
}

export function getStripeConfigStatus() {
  const mode = getStripeMode()
  const priceId = getStripePriceId()
  const explicitPrice = Boolean((process.env.STRIPE_PRICE_ID || '').trim())
  return {
    mode,
    secretKey: Boolean(process.env.STRIPE_SECRET_KEY),
    priceId: Boolean(priceId),
    priceIdSource: explicitPrice ? 'env' : priceId ? 'fallback' : 'missing',
    siteUrl: Boolean(process.env.SITE_URL),
    webhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    publishableKey: Boolean(process.env.VITE_STRIPE_PUBLISHABLE_KEY),
  }
}

export function getSiteUrl() {
  const raw = process.env.SITE_URL || 'https://www.trueoddsiq.com'
  return raw.replace(/\/$/, '')
}

export function isPremiumStatus(status) {
  return ACTIVE_SUBSCRIPTION_STATUSES.has(String(status || '').toLowerCase())
}

export function isPremiumRow(row) {
  if (!row) return false
  if (!isPremiumStatus(row.status)) return false
  if (row.current_period_end) {
    const end = new Date(row.current_period_end)
    if (!Number.isNaN(end.getTime()) && end < new Date()) return false
  }
  return true
}

export async function getSubscriptionRow(userId) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertSubscription({
  userId,
  stripeCustomerId,
  stripeSubscriptionId,
  status,
  priceId,
  currentPeriodEnd,
  cancelAtPeriodEnd = false,
}) {
  const supabase = getSupabase()
  const payload = {
    user_id: userId,
    stripe_customer_id: stripeCustomerId || null,
    stripe_subscription_id: stripeSubscriptionId || null,
    status: status || 'inactive',
    price_id: priceId || null,
    current_period_end: currentPeriodEnd || null,
    cancel_at_period_end: Boolean(cancelAtPeriodEnd),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export function stripePeriodEnd(subscription) {
  if (!subscription?.current_period_end) return null
  return new Date(subscription.current_period_end * 1000).toISOString()
}

export async function upsertFromStripeSubscription(subscription, userId, customerId) {
  if (!subscription || !userId) {
    throw new Error('Missing subscription or user id')
  }

  return upsertSubscription({
    userId,
    stripeCustomerId: typeof customerId === 'string' ? customerId : subscription.customer,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    priceId: subscription.items?.data?.[0]?.price?.id || null,
    currentPeriodEnd: stripePeriodEnd(subscription),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  })
}

export async function syncFromCheckoutSession(sessionId) {
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'customer'],
  })

  const userId = session.metadata?.user_id || session.client_reference_id
  if (!userId) throw new Error('Checkout session missing user_id')

  if (session.mode !== 'subscription') {
    throw new Error('Checkout session is not a subscription')
  }

  let subscription = session.subscription
  if (!subscription) {
    throw new Error('Checkout session has no subscription yet')
  }

  if (typeof subscription === 'string') {
    subscription = await stripe.subscriptions.retrieve(subscription)
  }

  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id

  return upsertFromStripeSubscription(subscription, userId, customerId)
}

export async function refreshSubscriptionFromStripe(userId) {
  const row = await getSubscriptionRow(userId)
  if (!row?.stripe_subscription_id) return row

  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id)
  return upsertFromStripeSubscription(subscription, userId, row.stripe_customer_id)
}

export function subscriptionPayload(row, { user } = {}) {
  const admin = isAdminUser(user)
  const isPremium = admin || isPremiumRow(row)
  return {
    isPremium,
    isAdmin: admin,
    status: admin ? 'admin' : (row?.status || 'inactive'),
    currentPeriodEnd: admin ? null : (row?.current_period_end || null),
    cancelAtPeriodEnd: admin ? false : Boolean(row?.cancel_at_period_end),
    priceDisplay: PREMIUM_PRICE_DISPLAY,
  }
}
