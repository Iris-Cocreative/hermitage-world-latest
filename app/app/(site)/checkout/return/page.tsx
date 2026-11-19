import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getViewer } from '@/lib/auth'
import { stripe } from '@/lib/stripe'

export const metadata: Metadata = { title: 'Thank you' }
export const dynamic = 'force-dynamic'

/**
 * Where Stripe sends people after paying. This page only REPORTS: the
 * webhook is what marks the order paid and grants the purchase, so a person
 * who closes the tab early still receives it.
 */
export default async function ReturnPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const sessionId = typeof sp.session_id === 'string' ? sp.session_id : null
  const viewer = await getViewer()

  let state: 'paid' | 'confirming' | 'unpaid' | 'unknown' = 'unknown'
  let email: string | null = null
  if (sessionId) {
    const admin = createAdminClient()
    const { data: order } = await admin.from('orders').select('status, email').eq('stripe_checkout_session_id', sessionId).maybeSingle()
    email = order?.email ?? null
    if (order?.status === 'paid') state = 'paid'
    else {
      try {
        const session = await stripe().checkout.sessions.retrieve(sessionId)
        email = session.customer_details?.email ?? email
        state = session.payment_status === 'paid' ? 'confirming' : session.status === 'open' ? 'unpaid' : 'confirming'
      } catch {
        state = order ? 'confirming' : 'unknown'
      }
    }
  }

  return (
    <section className="section" data-room="dark">
      {state === 'confirming' && <meta httpEquiv="refresh" content="4" />}
      <div className="container container--narrow stack stack--lg">
        {state === 'paid' && (
          <>
            <h1 className="t-h2">Thank you.</h1>
            <p className="t-lede">Your purchase is in your library.</p>
            {viewer ? (
              <p><Link className="btn btn--solid" href="/account/">Open your library</Link></p>
            ) : (
              <p className="stack stack--sm">
                <span className="t-muted">Sign in with {email ? <strong>{email}</strong> : 'the email you gave at checkout'} and we&rsquo;ll send you a link; no password needed.</span>
                <Link className="btn btn--solid" href={`/sign-in/?next=%2Faccount%2F${email ? `&email=${encodeURIComponent(email)}` : ''}`}>Sign in</Link>
              </p>
            )}
          </>
        )}
        {state === 'confirming' && (
          <>
            <h1 className="t-h2">Payment received.</h1>
            <p className="t-lede">We&rsquo;re adding it to your library. This page refreshes itself in a moment.</p>
          </>
        )}
        {state === 'unpaid' && (
          <>
            <h1 className="t-h2">The payment wasn&rsquo;t completed.</h1>
            <p className="t-lede">Nothing was charged. You can try again from the shop.</p>
            <p><Link className="btn" href="/shop/">Back to the shop</Link></p>
          </>
        )}
        {state === 'unknown' && (
          <>
            <h1 className="t-h2">We couldn&rsquo;t find that checkout.</h1>
            <p><Link className="btn" href="/shop/">Back to the shop</Link></p>
          </>
        )}
      </div>
    </section>
  )
}
