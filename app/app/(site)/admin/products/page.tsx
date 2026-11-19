import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { KIND_LABEL, money } from '@/lib/format'
import { coverUrl } from '@/lib/site'
import { Notice } from '@/components/notice'

export const metadata: Metadata = { title: 'Products · Admin' }
export const dynamic = 'force-dynamic'

const ORDER: Record<string, number> = { active: 0, draft: 1, archived: 2 }

export default async function AdminProducts({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: products } = await supabase.from('products').select('id, slug, kind, title, subtitle, price_cents, currency, status, sort, cover_path').order('sort')
  const rows = [...(products ?? [])].sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.sort - b.sort)
  const status = typeof sp.status === 'string' ? sp.status : ''
  const shown = status ? rows.filter((p) => p.status === status) : rows

  return (
    <>
      <section className="page-head" data-room="dark">
        <div className="container page-head__row">
          <div><h1>Products</h1><p className="t-lede">{rows.filter((p) => p.status === 'active').length} on sale · {rows.filter((p) => p.status === 'draft').length} drafts · {rows.filter((p) => p.status === 'archived').length} archived</p></div>
          <Link className="btn btn--solid" href="/admin/products/new/">New product</Link>
        </div>
      </section>
      <section className="section section--tight" data-room="plaster">
        <div className="container stack">
          {sp.deleted && <Notice>Product deleted.</Notice>}
          <div className="chips" role="group" aria-label="Show">
            {[['', 'All'], ['active', 'On sale'], ['draft', 'Drafts'], ['archived', 'Archived']].map(([v, l]) => (
              <Link key={v} className="chip" href={v ? `/admin/products/?status=${v}` : '/admin/products/'}>
                <input type="radio" readOnly checked={status === v} tabIndex={-1} aria-hidden="true" /><span>{l}</span>
              </Link>
            ))}
          </div>
          <div className="board">
            {shown.map((p) => {
              const cover = coverUrl(p.cover_path)
              return (
                <div key={p.id} className="board__row board__row--compact">
                  <div className="board__label">{KIND_LABEL[p.kind] ?? p.kind}<small><span className={`tag tag--${p.status}`}>{p.status}</span></small></div>
                  <div className="cluster">
                    {cover && <img className="cover cover--sm" src={cover} alt="" />}
                    <div>
                      <Link className="board__title" href={`/admin/products/${p.id}/`}>{p.title}</Link>
                      {p.subtitle && <div className="board__text">{p.subtitle}</div>}
                    </div>
                  </div>
                  <div className="board__action cluster">
                    <span className="price">{money(p.price_cents, p.currency)}</span>
                    <Link className="btn btn--sm" href={`/admin/products/${p.id}/`}>Edit</Link>
                  </div>
                </div>
              )
            })}
            {shown.length === 0 && <p className="t-muted mt-sm">No products here.</p>}
          </div>
        </div>
      </section>
    </>
  )
}
