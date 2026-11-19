import { type NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Admin = ReturnType<typeof createAdminClient>

/**
 * Stripe's events. This is where a purchase becomes real: the order is
 * marked paid and the entitlements are granted. Never from the return page,
 * which a buyer may never reach.
 *
 * - The signature is verified before anything is read.
 * - Each event id is recorded first; a redelivery of a processed event is
 *   acknowledged and skipped. A failed one is retried by Stripe (500) and
 *   processed again, because fulfillment is idempotent.
 * - Fulfillment waits for payment_status != unpaid, so a delayed payment
 *   method grants nothing until async_payment_succeeded arrives.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = request.headers.get('stripe-signature')
  if (!secret || !signature) return new NextResponse('Webhook not configured', { status: 400 })

  const payload = await request.text()
  let event: Stripe.Event
  try {
    event = stripe().webhooks.constructEvent(payload, signature, secret)
  } catch (err) {
    console.error('stripe webhook: bad signature', err)
    return new NextResponse('Bad signature', { status: 400 })
  }

  const admin = createAdminClient()
  const { data: seen } = await admin.from('stripe_events').select('processed_at').eq('id', event.id).maybeSingle()
  if (seen?.processed_at) return NextResponse.json({ received: true, duplicate: true })
  if (!seen) await admin.from('stripe_events').insert({ id: event.id, type: event.type })

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object
        if (session.payment_status !== 'unpaid') await fulfill(admin, session)
        break
      }
      case 'checkout.session.async_payment_failed':
        await setStatus(admin, event.data.object, 'failed')
        break
      case 'checkout.session.expired':
        await setStatus(admin, event.data.object, 'canceled')
        break
      default:
        break
    }
    await admin.from('stripe_events').update({ processed_at: new Date().toISOString(), error: null }).eq('id', event.id)
    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`stripe webhook: ${event.type} ${event.id} failed`, err)
    await admin.from('stripe_events').update({ error: message }).eq('id', event.id)
    return new NextResponse('Processing failed', { status: 500 })
  }
}

async function findOrder(admin: Admin, session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id ?? session.client_reference_id
  if (orderId) {
    const { data } = await admin.from('orders').select('*, order_items(*)').eq('id', orderId).maybeSingle()
    if (data) return data
  }
  const { data } = await admin.from('orders').select('*, order_items(*)').eq('stripe_checkout_session_id', session.id).maybeSingle()
  return data
}

async function setStatus(admin: Admin, session: Stripe.Checkout.Session, status: 'failed' | 'canceled') {
  const order = await findOrder(admin, session)
  if (!order || order.status === 'paid') return
  await admin.from('orders').update({ status }).eq('id', order.id)
}

async function fulfill(admin: Admin, session: Stripe.Checkout.Session) {
  const order = await findOrder(admin, session)
  if (!order) throw new Error(`no order for checkout session ${session.id}`)
  if (order.status === 'paid') return

  const email = session.customer_details?.email ?? session.customer_email ?? order.email ?? null
  let userId = order.user_id
  if (!userId && email) userId = await findOrCreateUser(admin, email)

  const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null
  const { error } = await admin
    .from('orders')
    .update({ status: 'paid', paid_at: new Date().toISOString(), user_id: userId, email, stripe_checkout_session_id: session.id, stripe_payment_intent_id: paymentIntent })
    .eq('id', order.id)
  if (error) throw error

  if (!userId) {
    console.error(`stripe webhook: order ${order.id} paid but no email to attach it to`)
    return
  }
  const rows = order.order_items
    .filter((i) => i.product_id)
    .map((i) => ({ user_id: userId as string, product_id: i.product_id as string, source: 'purchase' as const, order_id: order.id }))
  if (rows.length) {
    const { error: grantError } = await admin.from('entitlements').upsert(rows, { onConflict: 'user_id,product_id', ignoreDuplicates: true })
    if (grantError) throw grantError
  }
}

/** A guest buyer becomes a member: the profile trigger follows the auth user. */
async function findOrCreateUser(admin: Admin, email: string) {
  const { data: existing } = await admin.from('profiles').select('id').ilike('email', email).maybeSingle()
  if (existing) return existing.id
  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (error) throw error
  return data.user.id
}
