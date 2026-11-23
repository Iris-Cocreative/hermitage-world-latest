import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FILE_KINDS, KIND_LABEL, KINDS, money, STATUSES } from '@/lib/format'
import { coverUrl } from '@/lib/site'
import { Uploader } from '@/components/admin/uploader'
import { Notice } from '../../notice'
import { StatusTag } from '../../status'
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
    <div className="stack u-gap-2">
      <div className="hw-admin-head">
        <div className="stack hw-page-head">
          <p className="t-sm"><a className="hw-back" href="/admin/products/">← Products</a></p>
          <h1 className="t-h2">{product.title}</h1>
          <div className="cluster">
            <span className="t-body u-text-secondary">{KIND_LABEL[product.kind]}</span>
            <StatusTag status={product.status} />
            <span className="t-body u-text-secondary">{money(product.price_cents, product.currency)}</span>
          </div>
        </div>
        <div className="cluster">
          <a className="button" href={`/shop/${product.slug}/`}><span className="button-label">{product.status === 'active' ? 'View in the shop' : 'Preview (staff only)'}</span></a>
        </div>
      </div>

      {sp.saved && <Notice>Saved.</Notice>}
      {sp.error && <Notice tone="warn">{String(sp.error)}</Notice>}

      <form className="stack hw-admin-form" action={updateProduct}>
        <input type="hidden" name="id" value={product.id} />
        <div className="field">
          <label className="field-label t-sm" htmlFor="p-title">Title</label>
          <input className="input" id="p-title" name="title" defaultValue={product.title} required />
        </div>
        <div className="field">
          <label className="field-label t-sm" htmlFor="p-subtitle">Subtitle</label>
          <input className="input" id="p-subtitle" name="subtitle" defaultValue={product.subtitle} />
        </div>
        <div className="cols hw-admin-cols">
          <div className="field">
            <label className="field-label t-sm" htmlFor="p-kind">Kind</label>
            <select className="input" id="p-kind" name="kind" defaultValue={product.kind}>{KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select>
          </div>
          <div className="field">
            <label className="field-label t-sm" htmlFor="p-status">Status</label>
            <select className="input" id="p-status" name="status" defaultValue={product.status}>{STATUSES.map((s) => <option key={s} value={s}>{s === 'active' ? 'On sale' : s === 'draft' ? 'Draft' : 'Archived'}</option>)}</select>
            <p className="field-hint t-xs">Only products on sale appear in the shop. Archived ones stay in the libraries of people who own them.</p>
          </div>
        </div>
        <div className="cols hw-admin-cols-3">
          <div className="field">
            <label className="field-label t-sm" htmlFor="p-price">Price (USD; 0 is free)</label>
            <input className="input" id="p-price" name="price" inputMode="decimal" defaultValue={(product.price_cents / 100).toFixed(2)} />
          </div>
          <div className="field">
            <label className="field-label t-sm" htmlFor="p-slug">Address</label>
            <input className="input" id="p-slug" name="slug" defaultValue={product.slug} />
            <p className="field-hint t-xs">/shop/{product.slug}/</p>
          </div>
          <div className="field">
            <label className="field-label t-sm" htmlFor="p-sort">Order in lists</label>
            <input className="input" id="p-sort" name="sort" inputMode="numeric" defaultValue={product.sort} />
          </div>
        </div>
        <div className="field">
          <label className="field-label t-sm" htmlFor="p-description">Description (Markdown)</label>
          <textarea className="input hw-admin-mid" id="p-description" name="description" rows={8} defaultValue={product.description} />
        </div>
        <div className="prose">
          <details>
            <summary>Details (JSON: voice, people, volume, track, year…)</summary>
            <div className="field">
              <textarea className="input hw-admin-tall" name="meta" rows={12} aria-label="Details (JSON)" defaultValue={JSON.stringify(product.meta, null, 2)} />
            </div>
          </details>
        </div>
        <div className="cluster">
          <button className="button cc-primary" type="submit"><span className="button-label">Save</span></button>
        </div>
      </form>

      <div className="cols hw-admin-cols">
        <section className="card stack" aria-labelledby="h-cover">
          <h2 className="t-h4" id="h-cover">Cover</h2>
          {cover ? <img className="hw-admin-cover" src={cover} alt="" /> : <p className="t-sm u-text-secondary">No cover yet.</p>}
          <Uploader bucket="covers" prefix={`products/${product.id}`} accept="image/jpeg,image/png,image/webp" label={cover ? 'Replace cover' : 'Upload a cover'} onUploaded={setCover.bind(null, product.id)} />
        </section>

        <section className="card stack" aria-labelledby="h-files">
          <h2 className="t-h4" id="h-files">Files people receive</h2>
          <p className="t-sm u-text-secondary">Audio, video or PDF. They live in a private bucket; buyers reach them through their library.</p>
          <Uploader bucket="media" prefix={`products/${product.id}`} accept="audio/*,video/*,application/pdf" label="Upload files" multiple onUploaded={attachFile.bind(null, product.id)} />
          {(files ?? []).length > 0 && (
            <ul className="list cc-group">
              {(files ?? []).map((f) => (
                <li key={f.id} className="list-item">
                  <form className="list-body" action={updateFile}>
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="product_id" value={product.id} />
                    <div className="cluster">
                      <div className="field hw-admin-short">
                        <label className="field-label t-sm u-sr-only" htmlFor={`f-sort-${f.id}`}>Order</label>
                        <input className="input cc-sm" id={`f-sort-${f.id}`} name="sort" inputMode="numeric" defaultValue={f.sort} />
                      </div>
                      <div className="field hw-admin-grow">
                        <label className="field-label t-sm u-sr-only" htmlFor={`f-label-${f.id}`}>Label</label>
                        <input className="input cc-sm" id={`f-label-${f.id}`} name="label" defaultValue={f.label} />
                      </div>
                    </div>
                    <div className="cluster">
                      <div className="field">
                        <label className="field-label t-sm u-sr-only" htmlFor={`f-kind-${f.id}`}>Kind</label>
                        <select className="input cc-sm" id={`f-kind-${f.id}`} name="kind" defaultValue={f.kind}>{FILE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select>
                      </div>
                      <div className="field hw-admin-short">
                        <label className="field-label t-sm u-sr-only" htmlFor={`f-min-${f.id}`}>Length in minutes</label>
                        <input className="input cc-sm" id={`f-min-${f.id}`} name="minutes" inputMode="decimal" placeholder="min" defaultValue={f.duration_seconds ? (f.duration_seconds / 60).toFixed(1) : ''} />
                      </div>
                      {f.size_bytes ? <span className="t-sm u-text-secondary">{size(f.size_bytes)}</span> : null}
                      <button className="button cc-sm" type="submit"><span className="button-label">Save</span></button>
                      <button className="button cc-sm cc-ghost" type="submit" formAction={removeFile}><span className="button-label">Remove</span></button>
                    </div>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <form action={deleteProduct} className="stack">
        <input type="hidden" name="id" value={product.id} />
        <p className="t-sm u-text-secondary">Deleting removes the product and its files for everyone, including people who own it. Archive instead if anyone has bought it.</p>
        <div className="cluster">
          <button className="button cc-ghost" type="submit"><span className="button-label">Delete product</span></button>
        </div>
      </form>
    </div>
  )
}
