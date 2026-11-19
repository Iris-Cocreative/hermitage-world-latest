import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireViewer } from '@/lib/auth'
import { KIND_LABEL, longDate, money } from '@/lib/format'
import { coverUrl } from '@/lib/site'
import { Notice } from '@/components/notice'
import { ProductFiles } from '@/components/product-files'

export const metadata: Metadata = { title: 'Your library' }
export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = { pending: 'Not completed', paid: 'Paid', failed: 'Failed', refunded: 'Refunded', canceled: 'Canceled' }

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const viewer = await requireViewer('/account/')
  const supabase = await createClient()

  const [{ data: entitlements }, { data: orders }] = await Promise.all([
    supabase.from('entitlements').select('id, source, granted_at, product:products(id, slug, kind, title, subtitle, cover_path)').eq('user_id', viewer.user.id).order('granted_at', { ascending: false }),
    supabase.from('orders').select('id, status, total_cents, currency, created_at, paid_at, order_items(title, unit_cents, quantity)').eq('user_id', viewer.user.id).order('created_at', { ascending: false }),
  ])

  const productIds = (entitlements ?? []).map((e) => e.product?.id).filter((id): id is string => !!id)
  const { data: files } = productIds.length
    ? await supabase.from('product_files').select('*').in('product_id', productIds).order('sort')
    : { data: [] }

  return (
    <>
      <section className="page-head" data-room="dark">
        <div className="container page-head__row">
          <div>
            <h1>Your library</h1>
            <p className="t-lede">{viewer.profile?.full_name ? `${viewer.profile.full_name} · ` : ''}{viewer.user.email}</p>
          </div>
          <Link className="btn" href="/shop/">Browse the shop</Link>
        </div>
      </section>

      <section className="section" data-room="plaster">
        <div className="container stack stack--xl">
          {sp.added && <Notice>Added to your library.</Notice>}
          {sp.denied && <Notice tone="warn">That page is for the Hermitage team.</Notice>}

          {(entitlements ?? []).length === 0 ? (
            <div className="stack stack--sm">
              <h2 className="t-h3">Nothing here yet.</h2>
              <p className="t-muted">Recordings and books you buy, and the free meditations you add, will appear on this shelf.</p>
            </div>
          ) : (
            <div className="grid grid--2">
              {(entitlements ?? []).map((e) => {
                const p = e.product
                if (!p) return null
                const cover = coverUrl(p.cover_path)
                const own = (files ?? []).filter((f) => f.product_id === p.id)
                return (
                  <article key={e.id} className="card library-item">
                    <div className="library-item__head">
                      {cover && <img className="cover cover--sm" src={cover} alt="" />}
                      <div className="stack stack--xs">
                        <span className="tag">{KIND_LABEL[p.kind] ?? p.kind}</span>
                        <h3><Link href={`/shop/${p.slug}/`}>{p.title}</Link></h3>
                        {p.subtitle && <p>{p.subtitle}</p>}
                        <p className="t-small t-muted">{e.source === 'free' ? 'Free' : e.source === 'grant' ? 'A gift from the Hermitage' : 'Purchased'} · {longDate(e.granted_at)}</p>
                      </div>
                    </div>
                    {own.length > 0 ? <ProductFiles files={own} /> : <p className="t-small t-muted">The files for this title are being prepared.</p>}
                  </article>
                )
              })}
            </div>
          )}

          {(orders ?? []).length > 0 && (
            <div className="stack stack--sm">
              <h2 className="t-h3">Your orders</h2>
              <div className="board">
                {(orders ?? []).map((o) => (
                  <div key={o.id} className="board__row board__row--compact">
                    <div className="board__label">{longDate(o.paid_at ?? o.created_at)}</div>
                    <div>
                      <div className="board__title">{o.order_items.map((i) => i.title).join(', ')}</div>
                      <div className="board__text">{STATUS_LABEL[o.status] ?? o.status}</div>
                    </div>
                    <div className="board__action price">{money(o.total_cents, o.currency)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
