import type { Metadata } from 'next'
import { POST_KIND_LABEL, POST_KINDS } from '@/lib/format'
import { Notice } from '../../notice'
import { createPost } from '../actions'

export const metadata: Metadata = { title: 'New post · Admin' }

export default async function NewPost({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  return (
    <div className="stack">
      <div className="stack hw-page-head">
        <p className="t-sm"><a className="hw-back" href="/admin/posts/">← Posts</a></p>
        <h1 className="t-h2">New post</h1>
        <p className="t-body u-text-secondary hw-measure">A title and a kind to begin. The writing comes on the next page. It starts as a draft.</p>
      </div>
      <form className="stack hw-admin-form hw-measure" action={createPost}>
        {sp.error && <Notice tone="warn">{String(sp.error)}</Notice>}
        <div className="field">
          <label className="field-label t-sm" htmlFor="npo-title">Title</label>
          <input className="input" id="npo-title" name="title" required autoFocus />
        </div>
        <div className="cols hw-admin-cols">
          <div className="field">
            <label className="field-label t-sm" htmlFor="npo-kind">Kind</label>
            <select className="input" id="npo-kind" name="kind" defaultValue="post">{POST_KINDS.map((k) => <option key={k} value={k}>{POST_KIND_LABEL[k]}</option>)}</select>
          </div>
        </div>
        <div className="cluster">
          <button className="button cc-primary" type="submit"><span className="button-label">Create draft</span></button>
        </div>
      </form>
    </div>
  )
}
