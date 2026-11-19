import type { Metadata } from 'next'
import { getLibraryForEditing as getLibrary } from '@/lib/library'
import { money } from '@/lib/format'
import { ACCESS_LABEL, accessOf, fold } from '@/vendor/collab-library/src/index.ts'

export const metadata: Metadata = { title: 'Library · Admin' }
export const dynamic = 'force-dynamic'

type SP = Promise<Record<string, string | string[] | undefined>>
const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '')

export default async function AdminLibrary({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const data = await getLibrary()
  const status = one(sp.status)
  const type = one(sp.type)
  const q = one(sp.q)
  const shown = data.resources
    .filter((r) => (!status || r.status === status) && (!type || r.type === type) && (!q || fold(r.title + ' ' + r.subtitle).includes(fold(q))))
    .sort((a, b) => a.sort - b.sort)
  const count = (s: string) => data.resources.filter((r) => r.status === s).length
  const link = (over: Record<string, string>) => {
    const p = new URLSearchParams({ ...(status && { status }), ...(type && { type }), ...(q && { q }), ...over })
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k)
    const s = p.toString()
    return `/admin/library/${s ? `?${s}` : ''}`
  }

  return (
    <div className="stack">
      <div className="hw-admin-head">
        <div className="stack hw-page-head">
          <h1 className="t-h2">The Library</h1>
          <p className="t-body u-text-secondary">{count('published')} published · {count('draft')} drafts · {count('archived')} archived</p>
        </div>
        <div className="cluster">
          <a className="button" href="/library/"><span className="button-label">See the library</span></a>
          <a className="button cc-primary" href="/admin/library/new/"><span className="button-label">New resource</span></a>
        </div>
      </div>

      {sp.deleted && <div className="card" role="status"><p className="t-body">Resource deleted.</p></div>}

      <form className="cluster" action="/admin/library/" method="get" role="search">
        <div className="field">
          <label className="field-label t-sm u-sr-only" htmlFor="q">Find</label>
          <input id="q" className="input" type="search" name="q" defaultValue={q} placeholder="Find by title" />
        </div>
        {status && <input type="hidden" name="status" value={status} />}
        {type && <input type="hidden" name="type" value={type} />}
        <button className="button" type="submit"><span className="button-label">Find</span></button>
      </form>

      <div className="cluster" role="group" aria-label="Status">
        {[['', 'All'], ['published', 'Published'], ['draft', 'Drafts'], ['archived', 'Archived']].map(([v, l]) => (
          <a key={v} className="tag" href={link({ status: v })} aria-current={status === v ? 'true' : undefined}><span className="tag-label">{l}</span></a>
        ))}
      </div>
      <div className="cluster" role="group" aria-label="Kind">
        <a className="tag" href={link({ type: '' })} aria-current={!type ? 'true' : undefined}><span className="tag-label">Every kind</span></a>
        {data.types.filter((t) => data.resources.some((r) => r.type === t.key)).map((t) => (
          <a key={t.key} className="tag" href={link({ type: t.key })} aria-current={type === t.key ? 'true' : undefined}><span className="tag-label">{t.plural}</span></a>
        ))}
      </div>

      <ul className="list cc-group">
        {shown.map((r) => {
          const a = accessOf(r)
          return (
            <li key={r.id} className="list-item">
              <div className="list-body">
                <a className="list-title list-link t-body" href={`/admin/library/${r.id}/`}>{r.title}</a>
                <span className="list-sub t-sm">
                  {data.types.find((t) => t.key === r.type)?.label}
                  {r.subtitle ? ` · ${r.subtitle}` : ''}
                </span>
              </div>
              <span className="list-end hw-admin-row-meta">
                {r.status !== 'published' && <span className="tag cc-sm"><span className="tag-label">{r.status === 'draft' ? 'Draft' : 'Archived'}</span></span>}
                <span className="t-sm u-text-secondary">
                  {a === 'for-sale' ? money(r.price_cents ?? 0, r.currency ?? 'usd') : ACCESS_LABEL[a]}
                </span>
              </span>
            </li>
          )
        })}
      </ul>
      {shown.length === 0 && <p className="t-body u-text-secondary">Nothing here.</p>}
    </div>
  )
}
