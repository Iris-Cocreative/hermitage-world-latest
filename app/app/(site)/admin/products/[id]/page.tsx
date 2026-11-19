import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FILE_KINDS, KIND_LABEL, KINDS, money, STATUSES } from '@/lib/format'
import { coverUrl } from '@/lib/site'
import { Notice } from '@/components/notice'
import { Uploader } from '@/components/admin/uploader'
import { attachFile, deleteProduct, removeFile, setCover, updateFile, updateProduct } from '../actions'

export const metadata: Metadata = { title: 'Edit product · Admin' }
export const dynamic = 'force-dynamic'

type Params = Promise<{ id: string }>
type Search = Promise<Record<string, string | string[] | undefined>>

function size(bytes: number | null) {
  if (!bytes) return ''
  return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

export default async function EditProduct({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()
  const [{ data: product }, { data: files }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).maybeSingle(),
    supabase.from('product_files').select('*').eq('product_id', id).order('sort'),
  ])
  if (!product) notFound()
  const cover = coverUrl(product.cover_path)

  return (
    <>
      <section className="page-head" data-room="dark">
        <div className="container page-head__row">
          <div>
            <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/admin/products/">Products</Link><span aria-hidden="true">·</span><span>{product.title}</span></nav>
            <h1>{product.title}</h1>
            <p className="t-lede">{KIND_LABEL[product.kind]} · <span className={`tag tag--${product.status}`}>{product.status}</span> · {money(product.price_cents, product.currency)}</p>
          </div>
          <Link className="btn" href={`/shop/${product.slug}/`}>{product.status === 'active' ? 'View in the shop' : 'Preview (staff only)'}</Link>
        </div>
      </section>

      <section className="section section--tight" data-room="plaster">
        <div className="container stack stack--xl">
          {sp.saved && <Notice>Saved.</Notice>}
          {sp.error && <Notice tone="warn">{String(sp.error)}</Notice>}

          <form className="stack" action={updateProduct}>
            <input type="hidden" name="id" value={product.id} />
            <div className="form-grid">
              <div className="field field--wide"><label className="field__label" htmlFor="p-title">Title</label><input className="input" id="p-title" name="title" defaultValue={product.title} required /></div>
              <div className="field field--wide"><label className="field__label" htmlFor="p-subtitle">Subtitle</label><input className="input" id="p-subtitle" name="subtitle" defaultValue={product.subtitle} /></div>
              <div className="field"><label className="field__label" htmlFor="p-kind">Kind</label>
                <select className="select" id="p-kind" name="kind" defaultValue={product.kind}>{KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select></div>
              <div className="field"><label className="field__label" htmlFor="p-status">Status</label>
                <select className="select" id="p-status" name="status" defaultValue={product.status}>{STATUSES.map((s) => <option key={s} value={s}>{s === 'active' ? 'On sale' : s === 'draft' ? 'Draft' : 'Archived'}</option>)}</select>
                <span className="field__help">Only products on sale appear in the shop. Archived ones stay in the libraries of people who own them.</span></div>
              <div className="field"><label className="field__label" htmlFor="p-price">Price (USD; 0 is free)</label><input className="input" id="p-price" name="price" inputMode="decimal" defaultValue={(product.price_cents / 100).toFixed(2)} /></div>
              <div className="field"><label className="field__label" htmlFor="p-slug">Address</label><input className="input" id="p-slug" name="slug" defaultValue={product.slug} /><span className="field__help">/shop/{product.slug}/</span></div>
              <div className="field"><label className="field__label" htmlFor="p-sort">Order in lists</label><input className="input" id="p-sort" name="sort" inputMode="numeric" defaultValue={product.sort} /></div>
              <div className="field field--wide"><label className="field__label" htmlFor="p-description">Description (Markdown)</label><textarea className="textarea" id="p-description" name="description" rows={8} defaultValue={product.description} /></div>
              <details className="field field--wide">
                <summary className="field__label">Details (JSON: voice, people, volume, track, year…)</summary>
                <textarea className="textarea textarea--tall" name="meta" defaultValue={JSON.stringify(product.meta, null, 2)} />
              </details>
            </div>
            <div className="form-actions"><button className="btn btn--solid" type="submit">Save</button></div>
          </form>

          <div className="grid grid--2">
            <div className="card stack">
              <h2 className="t-h4">Cover</h2>
              {cover ? <img className="cover" src={cover} alt="" style={{ maxWidth: '14rem' }} /> : <p className="t-small t-muted">No cover yet.</p>}
              <Uploader bucket="covers" prefix={`products/${product.id}`} accept="image/jpeg,image/png,image/webp" label={cover ? 'Replace cover' : 'Upload a cover'} onUploaded={setCover.bind(null, product.id)} />
            </div>

            <div className="card stack">
              <h2 className="t-h4">Files people receive</h2>
              <p className="t-small t-muted">Audio, video or PDF. They live in a private bucket; buyers reach them through their library.</p>
              <Uploader bucket="media" prefix={`products/${product.id}`} accept="audio/*,video/*,application/pdf" label="Upload files" multiple onUploaded={attachFile.bind(null, product.id)} />
              {(files ?? []).length > 0 && (
                <div className="library-item__files">
                  {(files ?? []).map((f) => (
                    <form key={f.id} className="media-tile" action={updateFile}>
                      <input type="hidden" name="id" value={f.id} />
                      <input type="hidden" name="product_id" value={product.id} />
                      <div className="field"><label className="sr-only" htmlFor={`f-sort-${f.id}`}>Order</label><input className="input" id={`f-sort-${f.id}`} name="sort" defaultValue={f.sort} style={{ width: '4.5rem', paddingInline: '1rem' }} /></div>
                      <div className="stack stack--xs">
                        <label className="sr-only" htmlFor={`f-label-${f.id}`}>Label</label>
                        <input className="input" id={`f-label-${f.id}`} name="label" defaultValue={f.label} />
                        <div className="cluster cluster--tight">
                          <select className="select" name="kind" defaultValue={f.kind} style={{ width: 'auto', minHeight: '2.6rem' }}>{FILE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select>
                          <label className="sr-only" htmlFor={`f-min-${f.id}`}>Length in minutes</label>
                          <input className="input" id={`f-min-${f.id}`} name="minutes" inputMode="decimal" placeholder="min" defaultValue={f.duration_seconds ? (f.duration_seconds / 60).toFixed(1) : ''} style={{ width: '5.5rem', minHeight: '2.6rem', paddingInline: '1rem' }} />
                          <span className="media-tile__meta">{size(f.size_bytes)}</span>
                        </div>
                      </div>
                      <div className="media-tile__side">
                        <button className="btn btn--sm" type="submit">Save</button>
                        <button className="btn btn--sm btn--danger" type="submit" formAction={removeFile}>Remove</button>
                      </div>
                    </form>
                  ))}
                </div>
              )}
            </div>
          </div>

          <form className="cluster" action={deleteProduct}>
            <input type="hidden" name="id" value={product.id} />
            <span className="t-small t-muted">Deleting removes the product and its files for everyone, including people who own it. Archive instead if anyone has bought it.</span>
            <button className="btn btn--sm btn--danger" type="submit">Delete product</button>
          </form>
        </div>
      </section>
    </>
  )
}
