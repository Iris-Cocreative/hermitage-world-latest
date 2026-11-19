import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { POST_KIND_LABEL, longDate } from '@/lib/format'
import { Notice } from '@/components/notice'

export const metadata: Metadata = { title: 'Posts · Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminPosts({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: posts } = await supabase.from('posts').select('id, slug, kind, title, excerpt, status, published_at, updated_at').order('updated_at', { ascending: false })
  const rows = posts ?? []

  return (
    <>
      <section className="page-head" data-room="dark">
        <div className="container page-head__row">
          <div><h1>Posts</h1><p className="t-lede">{rows.filter((p) => p.status === 'published').length} published · {rows.filter((p) => p.status === 'draft').length} drafts</p></div>
          <Link className="btn btn--solid" href="/admin/posts/new/">New post</Link>
        </div>
      </section>
      <section className="section section--tight" data-room="plaster">
        <div className="container stack">
          {sp.deleted && <Notice>Post deleted.</Notice>}
          <div className="board post-list">
            {rows.map((p) => (
              <div key={p.id} className="board__row board__row--compact">
                <div className="board__label">{POST_KIND_LABEL[p.kind] ?? p.kind}<small><span className={`tag tag--${p.status === 'published' ? 'active' : 'draft'}`}>{p.status}</span>{p.published_at ? ` ${longDate(p.published_at)}` : ''}</small></div>
                <div>
                  <Link className="board__title" href={`/admin/posts/${p.id}/`}>{p.title}</Link>
                  {p.excerpt && <div className="board__text">{p.excerpt}</div>}
                </div>
                <div className="board__action cluster cluster--tight">
                  {p.status === 'published' && <Link className="btn btn--sm" href={`/posts/${p.slug}/`}>View</Link>}
                  <Link className="btn btn--sm" href={`/admin/posts/${p.id}/`}>Edit</Link>
                </div>
              </div>
            ))}
            {rows.length === 0 && <p className="t-muted mt-sm">No posts yet.</p>}
          </div>
        </div>
      </section>
    </>
  )
}
