import type { Metadata } from 'next'
import { getLibraryForEditing as getLibrary } from '@/lib/library'

export const metadata: Metadata = { title: 'Paths · Library · Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminPaths({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const data = await getLibrary()
  return (
    <div className="stack">
      <div className="hw-admin-head">
        <div className="stack hw-page-head">
          <h1 className="t-h2">Paths</h1>
          <p className="t-body u-text-secondary hw-measure">A path is a few resources in an order, each with a line on why it is there.</p>
        </div>
        <div className="cluster">
          <a className="button cc-primary" href="/admin/library/paths/new/"><span className="button-label">New path</span></a>
        </div>
      </div>
      {sp.deleted && <div className="card" role="status"><p className="t-body">Path deleted.</p></div>}
      <ul className="list cc-group">
        {data.collections.map((c) => (
          <li key={c.id} className="list-item">
            <div className="list-body">
              <a className="list-title list-link t-body" href={`/admin/library/paths/${c.id}/`}>{c.title}</a>
              <span className="list-sub t-sm">{c.stops.length} stops{c.by_line ? ` · ${c.by_line}` : ''}</span>
            </div>
            {c.status !== 'published' && (
              <span className="list-end"><span className="tag cc-sm"><span className="tag-label">{c.status === 'draft' ? 'Draft' : 'Archived'}</span></span></span>
            )}
          </li>
        ))}
      </ul>
      {data.collections.length === 0 && <p className="t-body u-text-secondary">No paths yet.</p>}
    </div>
  )
}
