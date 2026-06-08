import Stripe from 'stripe'
import { getSupabase } from './supabase-client.js'

export const PREMIUM_PRICE_DISPLAY = '$19.95/mo'
export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing'])

let stripeClient = null

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  if (!stripeClient) stripeClient = new Stripe(key)
  return stripeClient
}

export function getStripePriceId() {
  return process.env.STRIPE_PRICE_ID || process.env.STRIPE_PRICE_ID_TEST || ''
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

export function subscriptionPayload(row) {
  const isPremium = isPremiumRow(row)
  return {
    isPremium,
    status: row?.status || 'inactive',
    currentPeriodEnd: row?.current_period_end || null,
    cancelAtPeriodEnd: Boolean(row?.cancel_at_period_end),
    priceDisplay: PREMIUM_PRICE_DISPLAY,
  }
}
