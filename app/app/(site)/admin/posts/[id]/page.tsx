import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { POST_KIND_LABEL, POST_KINDS, POST_STATUSES } from '@/lib/format'
import { coverUrl } from '@/lib/site'
import { Notice } from '@/components/notice'
import { Uploader } from '@/components/admin/uploader'
import { deletePost, setPostCover, updatePost } from '../actions'

export const metadata: Metadata = { title: 'Edit post · Admin' }
export const dynamic = 'force-dynamic'

type Params = Promise<{ id: string }>
type Search = Promise<Record<string, string | string[] | undefined>>

/** yyyy-mm-dd for a date input, in the Hermitage's own time zone. */
function dateValue(iso: string | null) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Indiana/Indianapolis', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
}

export default async function EditPost({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()
  const { data: post } = await supabase.from('posts').select('*').eq('id', id).maybeSingle()
  if (!post) notFound()
  const cover = coverUrl(post.cover_path)

  return (
    <>
      <section className="page-head" data-room="dark">
        <div className="container page-head__row">
          <div>
            <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/admin/posts/">Posts</Link><span aria-hidden="true">·</span><span>{post.title}</span></nav>
            <h1>{post.title}</h1>
            <p className="t-lede">{POST_KIND_LABEL[post.kind]} · <span className={`tag tag--${post.status === 'published' ? 'active' : 'draft'}`}>{post.status}</span></p>
          </div>
          <Link className="btn" href={`/posts/${post.slug}/`}>{post.status === 'published' ? 'View' : 'Preview (staff only)'}</Link>
        </div>
      </section>

      <section className="section section--tight" data-room="plaster">
        <div className="container stack stack--xl">
          {sp.saved && <Notice>Saved.</Notice>}
          {sp.error && <Notice tone="warn">{String(sp.error)}</Notice>}

          <form className="stack" action={updatePost}>
            <input type="hidden" name="id" value={post.id} />
            <div className="form-grid">
              <div className="field field--wide"><label className="field__label" htmlFor="po-title">Title</label><input className="input" id="po-title" name="title" defaultValue={post.title} required /></div>
              <div className="field field--wide"><label className="field__label" htmlFor="po-excerpt">Excerpt (one or two sentences, shown in lists)</label><input className="input" id="po-excerpt" name="excerpt" defaultValue={post.excerpt} /></div>
              <div className="field"><label className="field__label" htmlFor="po-kind">Kind</label>
                <select className="select" id="po-kind" name="kind" defaultValue={post.kind}>{POST_KINDS.map((k) => <option key={k} value={k}>{POST_KIND_LABEL[k]}</option>)}</select></div>
              <div className="field"><label className="field__label" htmlFor="po-status">Status</label>
                <select className="select" id="po-status" name="status" defaultValue={post.status}>{POST_STATUSES.map((s) => <option key={s} value={s}>{s === 'published' ? 'Published' : 'Draft'}</option>)}</select></div>
              <div className="field"><label className="field__label" htmlFor="po-date">Date</label><input className="input" id="po-date" name="published_at" type="date" defaultValue={dateValue(post.published_at)} /><span className="field__help">Leave empty to stamp the day it is published.</span></div>
              <div className="field"><label className="field__label" htmlFor="po-slug">Address</label><input className="input" id="po-slug" name="slug" defaultValue={post.slug} /><span className="field__help">/posts/{post.slug}/</span></div>
              <div className="field field--wide"><label className="field__label" htmlFor="po-body">Body (Markdown)</label><textarea className="textarea textarea--tall" id="po-body" name="body" defaultValue={post.body} /></div>
            </div>
            <div className="form-actions"><button className="btn btn--solid" type="submit">Save</button></div>
          </form>

          <div className="card stack" style={{ maxWidth: '32rem' }}>
            <h2 className="t-h4">Cover</h2>
            {cover ? <img className="cover" src={cover} alt="" style={{ maxWidth: '14rem' }} /> : <p className="t-small t-muted">No cover yet.</p>}
            <Uploader bucket="covers" prefix={`posts/${post.id}`} accept="image/jpeg,image/png,image/webp" label={cover ? 'Replace cover' : 'Upload a cover'} onUploaded={setPostCover.bind(null, post.id)} />
          </div>

          <form className="cluster" action={deletePost}>
            <input type="hidden" name="id" value={post.id} />
            <span className="t-small t-muted">Deleting cannot be undone.</span>
            <button className="btn btn--sm btn--danger" type="submit">Delete post</button>
          </form>
        </div>
      </section>
    </>
  )
}
