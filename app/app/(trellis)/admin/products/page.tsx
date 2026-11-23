import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { KIND_LABEL, money } from '@/lib/format'
import { coverUrl } from '@/lib/site'
import { Notice } from '../notice'
import { StatusTag } from '../status'

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
  const count = (s: string) => rows.filter((p) => p.status === s).length
  const thumbs = shown.some((p) => p.cover_path)

  return (
    <div className="stack">
      <div className="hw-admin-head">
        <div className="stack hw-page-head">
          <h1 className="t-h2">Products</h1>
          <p className="t-body u-text-secondary">{count('active')} on sale · {count('draft')} drafts · {count('archived')} archived</p>
        </div>
        <div className="cluster">
          <a className="button cc-primary" href="/admin/products/new/"><span className="button-label">New product</span></a>
        </div>
      </div>

      {sp.deleted && <Notice>Product deleted.</Notice>}

      <nav className="tabs cc-seg" aria-label="Show">
        {[['', 'All'], ['active', 'On sale'], ['draft', 'Drafts'], ['archived', 'Archived']].map(([v, l]) => (
          <a key={v} className="tab" href={v ? `/admin/products/?status=${v}` : '/admin/products/'} aria-current={status === v ? 'page' : undefined}>{l}</a>
        ))}
      </nav>

      {shown.length === 0 ? <p className="t-body u-text-secondary">No products here.</p> : (
        <ul className="list cc-group">
          {shown.map((p) => {
            const cover = coverUrl(p.cover_path)
            return (
              <li key={p.id} className="list-item">
                {thumbs && (cover ? <img className="hw-admin-thumb" src={cover} alt="" /> : <span className="hw-admin-thumb" aria-hidden="true" />)}
                <div className="list-body">
                  <a className="list-title list-link t-body" href={`/admin/products/${p.id}/`}>{p.title}</a>
                  <span className="list-sub t-sm">
                    {KIND_LABEL[p.kind] ?? p.kind}
                    {p.subtitle ? ` · ${p.subtitle}` : ''}
                  </span>
                </div>
                <span className="list-end hw-admin-row-meta">
                  <StatusTag status={p.status} />
                  <span className="t-sm u-text-secondary">{money(p.price_cents, p.currency)}</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
