import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { POST_KIND_LABEL, POST_KINDS, POST_STATUSES } from '@/lib/format'
import { coverUrl } from '@/lib/site'
import { Uploader } from '@/components/admin/uploader'
import { Notice } from '../../notice'
import { StatusTag } from '../../status'
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
    <div className="stack u-gap-2">
      <div className="hw-admin-head">
        <div className="stack hw-page-head">
          <p className="t-sm"><a className="hw-back" href="/admin/posts/">← Posts</a></p>
          <h1 className="t-h2">{post.title}</h1>
          <div className="cluster">
            <span className="t-body u-text-secondary">{POST_KIND_LABEL[post.kind]}</span>
            <StatusTag status={post.status} />
          </div>
        </div>
        <div className="cluster">
          <a className="button" href={`/posts/${post.slug}/`}><span className="button-label">{post.status === 'published' ? 'View' : 'Preview (staff only)'}</span></a>
        </div>
      </div>

      {sp.saved && <Notice>Saved.</Notice>}
      {sp.error && <Notice tone="warn">{String(sp.error)}</Notice>}

      <form className="stack hw-admin-form" action={updatePost}>
        <input type="hidden" name="id" value={post.id} />
        <div className="field">
          <label className="field-label t-sm" htmlFor="po-title">Title</label>
          <input className="input" id="po-title" name="title" defaultValue={post.title} required />
        </div>
        <div className="field">
          <label className="field-label t-sm" htmlFor="po-excerpt">Excerpt (one or two sentences, shown in lists)</label>
          <input className="input" id="po-excerpt" name="excerpt" defaultValue={post.excerpt} />
        </div>
        <div className="cols hw-admin-cols">
          <div className="field">
            <label className="field-label t-sm" htmlFor="po-kind">Kind</label>
            <select className="input" id="po-kind" name="kind" defaultValue={post.kind}>{POST_KINDS.map((k) => <option key={k} value={k}>{POST_KIND_LABEL[k]}</option>)}</select>
          </div>
          <div className="field">
            <label className="field-label t-sm" htmlFor="po-status">Status</label>
            <select className="input" id="po-status" name="status" defaultValue={post.status}>{POST_STATUSES.map((s) => <option key={s} value={s}>{s === 'published' ? 'Published' : 'Draft'}</option>)}</select>
          </div>
        </div>
        <div className="cols hw-admin-cols">
          <div className="field">
            <label className="field-label t-sm" htmlFor="po-date">Date</label>
            <input className="input" id="po-date" name="published_at" type="date" defaultValue={dateValue(post.published_at)} />
            <p className="field-hint t-xs">Leave empty to stamp the day it is published.</p>
          </div>
          <div className="field">
            <label className="field-label t-sm" htmlFor="po-slug">Address</label>
            <input className="input" id="po-slug" name="slug" defaultValue={post.slug} />
            <p className="field-hint t-xs">/posts/{post.slug}/</p>
          </div>
        </div>
        <div className="field">
          <label className="field-label t-sm" htmlFor="po-body">Body (Markdown)</label>
          <textarea className="input hw-admin-tall" id="po-body" name="body" rows={20} defaultValue={post.body} />
        </div>
        <div className="cluster">
          <button className="button cc-primary" type="submit"><span className="button-label">Save</span></button>
        </div>
      </form>

      <div className="cols hw-admin-cols">
        <section className="card stack" aria-labelledby="h-cover">
          <h2 className="t-h4" id="h-cover">Cover</h2>
          {cover ? <img className="hw-admin-cover" src={cover} alt="" /> : <p className="t-sm u-text-secondary">No cover yet.</p>}
          <Uploader bucket="covers" prefix={`posts/${post.id}`} accept="image/jpeg,image/png,image/webp" label={cover ? 'Replace cover' : 'Upload a cover'} onUploaded={setPostCover.bind(null, post.id)} />
        </section>
      </div>

      <form action={deletePost} className="stack">
        <input type="hidden" name="id" value={post.id} />
        <p className="t-sm u-text-secondary">Deleting cannot be undone.</p>
        <div className="cluster">
          <button className="button cc-ghost" type="submit"><span className="button-label">Delete post</span></button>
        </div>
      </form>
    </div>
  )
}
