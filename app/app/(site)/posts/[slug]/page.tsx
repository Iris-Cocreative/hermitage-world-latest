import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { POST_KIND_LABEL, longDate } from '@/lib/format'
import { renderMarkdown } from '@/lib/markdown'
import { coverUrl } from '@/lib/site'
import { PageHero } from '@/components/page-hero'

export const dynamic = 'force-dynamic'
type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('posts').select('title, excerpt').eq('slug', slug).maybeSingle()
  return data ? { title: data.title, description: data.excerpt || undefined } : { title: 'Not found' }
}

export default async function PostPage({ params }: { params: Params }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: post } = await supabase.from('posts').select('*, author:profiles(full_name)').eq('slug', slug).maybeSingle()
  if (!post) notFound()
  const cover = coverUrl(post.cover_path)
  const author = (post.author as { full_name: string } | null)?.full_name

  return (
    <>
      <PageHero
        title={post.title}
        lede={post.excerpt || undefined}
        crumbs={[{ href: '/posts/', label: 'Posts' }, { href: `/posts/${post.slug}/`, label: post.title }]}
        media={cover ? <img className="cover" src={cover} alt="" /> : undefined}
      >
        <p className="t-small t-muted">
          {POST_KIND_LABEL[post.kind] ?? post.kind}
          {post.published_at ? ` · ${longDate(post.published_at)}` : ''}
          {author ? ` · ${author}` : ''}
          {post.status !== 'published' ? ' · draft, visible to staff only' : ''}
        </p>
      </PageHero>
      <section className="section" data-room="plaster">
        <div className="container container--narrow">
          <div className="prose post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
        </div>
      </section>
    </>
  )
}
