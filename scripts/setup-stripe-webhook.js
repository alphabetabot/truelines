/**
 * Create Stripe webhook without using Stripe's confusing dashboard UI.
 *
 * Usage (paste your secret key from Vercel — test or live):
 *   STRIPE_SECRET_KEY=sk_test_xxx node scripts/setup-stripe-webhook.js
 *
 * Copy the printed whsec_... into Vercel as STRIPE_WEBHOOK_SECRET, then redeploy.
 */
import Stripe from 'stripe'

const WEBHOOK_URL = 'https://www.trueoddsiq.com/api/billing?action=webhook'
const EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error('Missing STRIPE_SECRET_KEY.')
  console.error('Run: STRIPE_SECRET_KEY=sk_... node scripts/setup-stripe-webhook.js')
  process.exit(1)
}

const stripe = new Stripe(key)

const existing = await stripe.webhookEndpoints.list({ limit: 100 })
const match = existing.data.find(e => e.url === WEBHOOK_URL && e.status !== 'disabled')

if (match) {
  console.log('Webhook already exists for TrueOddsIQ:')
  console.log('  ID:', match.id)
  console.log('  URL:', match.url)
  console.log('')
  console.log('Stripe only shows the signing secret when the endpoint is first created.')
  console.log('In Stripe: open Developers (bottom bar) → Webhooks → click this endpoint → Signing secret → Reveal')
  console.log('Or delete this endpoint in Stripe and run this script again to get a new secret.')
  process.exit(0)
}

const endpoint = await stripe.webhookEndpoints.create({
  url: WEBHOOK_URL,
  enabled_events: EVENTS,
  description: 'TrueOddsIQ Premium subscriptions',
})

console.log('')
console.log('SUCCESS — webhook created')
console.log('')
console.log('1. Copy this into Vercel → Environment Variables → STRIPE_WEBHOOK_SECRET')
console.log('')
console.log(endpoint.secret)
console.log('')
console.log('2. Redeploy on Vercel')
console.log('')
console.log('Webhook URL:', WEBHOOK_URL)
