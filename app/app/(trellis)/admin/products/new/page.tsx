import type { Metadata } from 'next'
import { KIND_LABEL, KINDS } from '@/lib/format'
import { Notice } from '../../notice'
import { createProduct } from '../actions'

export const metadata: Metadata = { title: 'New product · Admin' }

export default async function NewProduct({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  return (
    <div className="stack">
      <div className="stack hw-page-head">
        <p className="t-sm"><a className="hw-back" href="/admin/products/">← Products</a></p>
        <h1 className="t-h2">New product</h1>
        <p className="t-body u-text-secondary hw-measure">A title, a kind and a price to begin. Everything else on the next page. It starts as a draft.</p>
      </div>
      <form className="stack hw-admin-form hw-measure" action={createProduct}>
        {sp.error && <Notice tone="warn">{String(sp.error)}</Notice>}
        <div className="field">
          <label className="field-label t-sm" htmlFor="np-title">Title</label>
          <input className="input" id="np-title" name="title" required autoFocus />
        </div>
        <div className="cols hw-admin-cols">
          <div className="field">
            <label className="field-label t-sm" htmlFor="np-kind">Kind</label>
            <select className="input" id="np-kind" name="kind" defaultValue="track">{KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select>
          </div>
          <div className="field">
            <label className="field-label t-sm" htmlFor="np-price">Price (USD; 0 is free)</label>
            <input className="input" id="np-price" name="price" inputMode="decimal" placeholder="3.99" />
          </div>
        </div>
        <div className="cluster">
          <button className="button cc-primary" type="submit"><span className="button-label">Create draft</span></button>
        </div>
      </form>
    </div>
  )
}
