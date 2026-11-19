import type { Metadata } from 'next'
import { POST_KIND_LABEL, POST_KINDS } from '@/lib/format'
import { Notice } from '@/components/notice'
import { createPost } from '../actions'

export const metadata: Metadata = { title: 'New post · Admin' }

export default async function NewPost({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  return (
    <>
      <section className="page-head" data-room="dark">
        <div className="container"><h1>New post</h1><p className="t-lede">A title and a kind to begin. The writing comes on the next page. It starts as a draft.</p></div>
      </section>
      <section className="section section--tight" data-room="plaster">
        <form className="container container--narrow stack" action={createPost}>
          {sp.error && <Notice tone="warn">{String(sp.error)}</Notice>}
          <div className="form-grid">
            <div className="field field--wide"><label className="field__label" htmlFor="npo-title">Title</label><input className="input" id="npo-title" name="title" required autoFocus /></div>
            <div className="field"><label className="field__label" htmlFor="npo-kind">Kind</label>
              <select className="select" id="npo-kind" name="kind" defaultValue="post">{POST_KINDS.map((k) => <option key={k} value={k}>{POST_KIND_LABEL[k]}</option>)}</select></div>
          </div>
          <div className="form-actions"><button className="btn btn--solid" type="submit">Create draft</button></div>
        </form>
      </section>
    </>
  )
}
