'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getViewer } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { coverUrl, siteUrl } from '@/lib/site'

/**
 * Starts a Stripe Checkout for one product. A pending order is written
 * first, so the webhook (app/api/stripe/webhook) has something to mark paid;
 * nothing is granted here. Guests may buy: the webhook makes their account
 * from the email Stripe collected, and a sign-in link opens their library.
 */
export async function startCheckout(formData: FormData) {
  const productId = String(formData.get('product_id') ?? '')
  const supabase = await createClient()
  const { data: product } = await supabase.from('products').select('*').eq('id', productId).eq('status', 'active').maybeSingle()
  if (!product) redirect('/shop/')
  if (product.price_cents === 0) redirect(`/shop/${product.slug}/`)

  const viewer = await getViewer()
  const admin = createAdminClient()
  const origin = await siteUrl()

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({ user_id: viewer?.user.id ?? null, email: viewer?.user.email ?? null, total_cents: product.price_cents, currency: product.currency })
    .select('id')
    .single()
  if (orderError || !order) {
    console.error('checkout: could not create order:', orderError?.message)
    redirect(`/shop/${product.slug}/?error=1`)
  }
  await admin.from('order_items').insert({ order_id: order.id, product_id: product.id, title: product.title, unit_cents: product.price_cents, quantity: 1 })

  let checkoutUrl: string | null = null
  try {
    const cover = coverUrl(product.cover_path)
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: product.currency,
            unit_amount: product.price_cents,
            product_data: {
              name: product.title,
              ...(product.subtitle ? { description: product.subtitle } : {}),
              ...(cover && cover.startsWith('https://') ? { images: [cover] } : {}),
            },
          },
        },
      ],
      client_reference_id: order.id,
      metadata: { order_id: order.id, product_id: product.id },
      ...(viewer?.user.email ? { customer_email: viewer.user.email } : {}),
      success_url: `${origin}/checkout/return/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop/${product.slug}/?canceled=1`,
    })
    await admin.from('orders').update({ stripe_checkout_session_id: session.id }).eq('id', order.id)
    checkoutUrl = session.url
  } catch (err) {
    // Only the message: the full Stripe error carries headers and a raw body, and
    // a server action's console output is replayed to the browser in dev.
    console.error('checkout: Stripe session failed:', err instanceof Error ? err.message : String(err))
    await admin.from('orders').update({ status: 'failed' }).eq('id', order.id)
  }

  if (!checkoutUrl) redirect(`/shop/${product.slug}/?error=1`)
  redirect(checkoutUrl)
}

/** A free recording goes straight into a signed-in person's library. */
export async function claimFree(formData: FormData) {
  const productId = String(formData.get('product_id') ?? '')
  const supabase = await createClient()
  const { data: product } = await supabase.from('products').select('id, slug, price_cents, status').eq('id', productId).maybeSingle()
  if (!product || product.status !== 'active') redirect('/shop/')

  const viewer = await getViewer()
  if (!viewer) redirect(`/sign-in/?next=${encodeURIComponent(`/shop/${product.slug}/`)}`)
  if (product.price_cents !== 0) redirect(`/shop/${product.slug}/`)

  const admin = createAdminClient()
  const { error } = await admin
    .from('entitlements')
    .upsert({ user_id: viewer.user.id, product_id: product.id, source: 'free' }, { onConflict: 'user_id,product_id', ignoreDuplicates: true })
  if (error) {
    console.error('claimFree failed:', error.message)
    redirect(`/shop/${product.slug}/?error=1`)
  }
  redirect(`/account/?added=${encodeURIComponent(product.slug)}`)
}
