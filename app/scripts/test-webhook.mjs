/**
 * Fires a signed, fake `checkout.session.completed` event at the local
 * webhook, as Stripe would, and checks what it did. No Stripe account
 * needed: the signature uses STRIPE_WEBHOOK_SECRET from .env.local.
 *
 *   node scripts/test-webhook.mjs            (the dev server must be running)
 *
 * It creates a pending order for the first active paid product, posts the
 * event twice (the second must be acknowledged as a duplicate), then prints
 * the order, the buyer's profile and the entitlement.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const here = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(here, '../.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2]
  }
}
const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:4100'
const secret = process.env.STRIPE_WEBHOOK_SECRET
if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set')
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })

const buyer = `buyer-${Date.now()}@example.com`
const { data: product } = await admin.from('products').select('id, title, price_cents, currency').eq('status', 'active').gt('price_cents', 0).limit(1).single()
if (!product) throw new Error('no active paid product; put one on sale in /admin first')

const { data: order } = await admin.from('orders').insert({ email: null, total_cents: product.price_cents, currency: product.currency }).select('id').single()
await admin.from('order_items').insert({ order_id: order.id, product_id: product.id, title: product.title, unit_cents: product.price_cents, quantity: 1 })
const sessionId = `cs_test_fake_${order.id.slice(0, 8)}`
await admin.from('orders').update({ stripe_checkout_session_id: sessionId }).eq('id', order.id)

const event = {
  id: `evt_test_${Date.now()}`,
  object: 'event',
  api_version: '2026-10-28.endive',
  created: Math.floor(Date.now() / 1000),
  type: 'checkout.session.completed',
  livemode: false,
  pending_webhooks: 1,
  request: { id: null, idempotency_key: null },
  data: {
    object: {
      id: sessionId,
      object: 'checkout.session',
      mode: 'payment',
      status: 'complete',
      payment_status: 'paid',
      payment_intent: 'pi_test_fake',
      client_reference_id: order.id,
      metadata: { order_id: order.id, product_id: product.id },
      customer_details: { email: buyer, name: 'Test Buyer' },
      customer_email: null,
      amount_total: product.price_cents,
      currency: product.currency,
    },
  },
}
const payload = JSON.stringify(event)
const stripe = new Stripe('rk_test_placeholder_not_a_real_key')
const header = stripe.webhooks.generateTestHeaderString({ payload, secret })

async function post() {
  const r = await fetch(`${base}/api/stripe/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': header }, body: payload })
  return { status: r.status, body: await r.text() }
}
console.log('order', order.id, 'for', product.title, 'buyer', buyer)
console.log('1st delivery:', await post())
console.log('2nd delivery:', await post())
const bad = await fetch(`${base}/api/stripe/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': 't=1,v1=deadbeef' }, body: payload })
console.log('bad signature:', bad.status)

const { data: after } = await admin.from('orders').select('status, email, paid_at, stripe_payment_intent_id, user_id').eq('id', order.id).single()
const { data: profile } = await admin.from('profiles').select('id, email, role').eq('id', after.user_id).maybeSingle()
const { data: ent } = await admin.from('entitlements').select('source, order_id').eq('user_id', after.user_id).eq('product_id', product.id).maybeSingle()
const { data: ev } = await admin.from('stripe_events').select('type, processed_at, error').eq('id', event.id).maybeSingle()
console.log({ order: after, profile, entitlement: ent, event: ev })
