import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { longDate, money } from '@/lib/format'

export const metadata: Metadata = { title: 'Orders · Admin' }
export const dynamic = 'force-dynamic'

const LABEL: Record<string, string> = { pending: 'Not completed', paid: 'Paid', failed: 'Failed', refunded: 'Refunded', canceled: 'Canceled' }

export default async function AdminOrders() {
  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('id, email, status, total_cents, currency, created_at, paid_at, stripe_payment_intent_id, order_items(title, unit_cents, quantity)')
    .order('created_at', { ascending: false })
    .limit(200)
  const rows = orders ?? []
  const paid = rows.filter((o) => o.status === 'paid')
  const revenue = paid.reduce((s, o) => s + o.total_cents, 0)

  return (
    <>
      <section className="page-head" data-room="dark">
        <div className="container">
          <h1>Orders</h1>
          <p className="t-lede">{paid.length} paid · {money(revenue)} in all · the latest {rows.length} shown. Refunds are made in the Stripe Dashboard.</p>
        </div>
      </section>
      <section className="section section--tight" data-room="plaster">
        <div className="container">
          {rows.length === 0 ? <p className="t-muted">No orders yet.</p> : (
            <div className="board">
              {rows.map((o) => (
                <div key={o.id} className="board__row board__row--compact">
                  <div className="board__label">{longDate(o.paid_at ?? o.created_at)}<small><span className={`tag tag--${o.status === 'paid' ? 'paid' : o.status === 'pending' ? 'draft' : o.status}`}>{LABEL[o.status] ?? o.status}</span></small></div>
                  <div>
                    <div className="board__title">{o.order_items.map((i) => `${i.title}${i.quantity > 1 ? ` × ${i.quantity}` : ''}`).join(', ')}</div>
                    <div className="board__text">{o.email ?? 'no email yet'}{o.stripe_payment_intent_id ? ` · ${o.stripe_payment_intent_id}` : ''}</div>
                  </div>
                  <div className="board__action price">{money(o.total_cents, o.currency)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
