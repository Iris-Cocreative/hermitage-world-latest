import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { POST_KIND_LABEL, longDate } from '@/lib/format'
import { Notice } from '../notice'
import { StatusTag } from '../status'

export const metadata: Metadata = { title: 'Posts · Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminPosts({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: posts } = await supabase.from('posts').select('id, slug, kind, title, excerpt, status, published_at, updated_at').order('updated_at', { ascending: false })
  const rows = posts ?? []

  return (
    <div className="stack">
      <div className="hw-admin-head">
        <div className="stack hw-page-head">
          <h1 className="t-h2">Posts</h1>
          <p className="t-body u-text-secondary">{rows.filter((p) => p.status === 'published').length} published · {rows.filter((p) => p.status === 'draft').length} drafts</p>
        </div>
        <div className="cluster">
          <a className="button cc-primary" href="/admin/posts/new/"><span className="button-label">New post</span></a>
        </div>
      </div>

      {sp.deleted && <Notice>Post deleted.</Notice>}

      {rows.length === 0 ? <p className="t-body u-text-secondary">No posts yet.</p> : (
        <ul className="list cc-group">
          {rows.map((p) => (
            <li key={p.id} className="list-item">
              <div className="list-body">
                <a className="list-title list-link t-body" href={`/admin/posts/${p.id}/`}>{p.title}</a>
                <span className="list-sub t-sm">
                  {POST_KIND_LABEL[p.kind] ?? p.kind}
                  {p.published_at ? ` · ${longDate(p.published_at)}` : ''}
                  {p.excerpt ? ` · ${p.excerpt}` : ''}
                </span>
              </div>
              <span className="list-end hw-admin-row-meta">
                <StatusTag status={p.status} />
                {p.status === 'published' && <a className="button cc-sm cc-ghost hw-admin-over" href={`/posts/${p.slug}/`}><span className="button-label">View</span></a>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
