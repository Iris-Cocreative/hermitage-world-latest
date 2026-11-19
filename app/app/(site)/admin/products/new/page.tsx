import type { Metadata } from 'next'
import { KIND_LABEL, KINDS } from '@/lib/format'
import { Notice } from '@/components/notice'
import { createProduct } from '../actions'

export const metadata: Metadata = { title: 'New product · Admin' }

export default async function NewProduct({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  return (
    <>
      <section className="page-head" data-room="dark">
        <div className="container"><h1>New product</h1><p className="t-lede">A title, a kind and a price to begin. Everything else on the next page. It starts as a draft.</p></div>
      </section>
      <section className="section section--tight" data-room="plaster">
        <form className="container container--narrow stack" action={createProduct}>
          {sp.error && <Notice tone="warn">{String(sp.error)}</Notice>}
          <div className="form-grid">
            <div className="field field--wide"><label className="field__label" htmlFor="np-title">Title</label><input className="input" id="np-title" name="title" required autoFocus /></div>
            <div className="field"><label className="field__label" htmlFor="np-kind">Kind</label>
              <select className="select" id="np-kind" name="kind" defaultValue="track">{KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select></div>
            <div className="field"><label className="field__label" htmlFor="np-price">Price (USD; 0 is free)</label><input className="input" id="np-price" name="price" inputMode="decimal" placeholder="3.99" /></div>
          </div>
          <div className="form-actions"><button className="btn btn--solid" type="submit">Create draft</button></div>
        </form>
      </section>
    </>
  )
}
