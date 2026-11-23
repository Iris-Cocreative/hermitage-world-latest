import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { longDate, money } from '@/lib/format'
import { StatusTag } from '../status'

export const metadata: Metadata = { title: 'Orders · Admin' }
export const dynamic = 'force-dynamic'

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
    <div className="stack">
      <div className="stack hw-page-head">
        <h1 className="t-h2">Orders</h1>
        <p className="t-body u-text-secondary hw-measure">{paid.length} paid · {money(revenue)} in all · the latest {rows.length} shown. Refunds are made in the Stripe Dashboard.</p>
      </div>
      {rows.length === 0 ? <p className="t-body u-text-secondary">No orders yet.</p> : (
        <ul className="list cc-group">
          {rows.map((o) => (
            <li key={o.id} className="list-item">
              <div className="list-body">
                <span className="list-title t-body">{o.order_items.map((i) => `${i.title}${i.quantity > 1 ? ` × ${i.quantity}` : ''}`).join(', ')}</span>
                <span className="list-sub t-sm">
                  {longDate(o.paid_at ?? o.created_at)} · {o.email ?? 'no email yet'}{o.stripe_payment_intent_id ? ` · ${o.stripe_payment_intent_id}` : ''}
                </span>
              </div>
              <span className="list-end hw-admin-row-meta">
                <StatusTag status={o.status} />
                <span className="t-sm">{money(o.total_cents, o.currency)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
