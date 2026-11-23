import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AUDIENCES, getLibraryForEditing as getLibrary } from '@/lib/library'
import { ResourceForm, accessOf, ACCESS_LABEL } from '@/vendor/collab-library/src/index.ts'
import { removeResource, updateResource } from '../actions'
import { hostProducts } from '../products'
import { Saved, errorOf } from '../../notice'

export const metadata: Metadata = { title: 'Edit · Library · Admin' }
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function EditResource({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const [data, products] = await Promise.all([getLibrary(), hostProducts()])
  const r = data.resources.find((x) => x.id === id)
  if (!r) notFound()
  const product = products.find((p) => p.id === r.product_id)
  const status = r.status === 'published' ? 'Published' : r.status === 'draft' ? 'Draft' : 'Archived'
  return (
    <div className="stack">
      <div className="hw-admin-head">
        <div className="stack hw-page-head">
          <p className="t-sm"><a className="hw-back" href="/admin/library/">← The Library</a></p>
          <h1 className="t-h2">{r.title}</h1>
          <p className="t-body u-text-secondary">
            {status} · a visitor sees: {ACCESS_LABEL[accessOf(r)]}
            {product && product.status !== 'active' ? ' (its product is not on sale yet)' : ''}
          </p>
        </div>
        <div className="cluster">
          {r.status === 'published' && <a className="button" href={`/library/${r.slug}/`}><span className="button-label">See it</span></a>}
          {product && <a className="button" href={`/admin/products/${product.id}/`}><span className="button-label">Edit its product</span></a>}
        </div>
      </div>
      <Saved sp={sp} />
      <ResourceForm action={updateResource.bind(null, r.id)} data={data} resource={r} products={products} audiences={AUDIENCES} error={errorOf(sp)} />
      <form action={removeResource.bind(null, r.id)} className="stack">
        <p className="t-sm u-text-secondary">Deleting removes it from the library and from every path. Its product in the shop stays.</p>
        <div className="cluster">
          <button className="button cc-ghost" type="submit"><span className="button-label">Delete this resource</span></button>
        </div>
      </form>
    </div>
  )
}
