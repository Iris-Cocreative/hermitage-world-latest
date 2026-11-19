import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { POST_KIND_LABEL, longDate } from '@/lib/format'
import { PageHero } from '@/components/page-hero'

export const metadata: Metadata = { title: 'Posts', description: 'Letters, news and teachings from the Hermitage.' }
export const dynamic = 'force-dynamic'

export default async function PostsPage() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('posts')
    .select('id, slug, kind, title, excerpt, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (
    <>
      <PageHero title="From the Hermitage" lede="Letters, news and teachings, free for anyone to read." />
      <section className="section" data-room="plaster">
        <div className="container">
          {(posts ?? []).length === 0 ? (
            <p className="t-muted">Nothing has been published yet.</p>
          ) : (
            <div className="board post-list">
              {(posts ?? []).map((p) => (
                <article key={p.id} className="board__row">
                  <div className="board__label">{POST_KIND_LABEL[p.kind] ?? p.kind}<small>{longDate(p.published_at)}</small></div>
                  <div>
                    <Link className="board__title" href={`/posts/${p.slug}/`}>{p.title}</Link>
                    {p.excerpt && <p className="board__text">{p.excerpt}</p>}
                  </div>
                  <div className="board__action"><Link className="btn btn--sm" href={`/posts/${p.slug}/`}>Read</Link></div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <hw-signup dangerouslySetInnerHTML={{ __html: '' }} suppressHydrationWarning />
    </>
  )
}
