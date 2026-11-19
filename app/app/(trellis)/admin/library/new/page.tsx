import type { Metadata } from 'next'
import { AUDIENCES, getLibraryForEditing as getLibrary } from '@/lib/library'
import { ResourceForm } from '@/vendor/collab-library/src/index.ts'
import { createResource } from '../actions'
import { hostProducts } from '../products'
import { errorOf } from '../notice'

export const metadata: Metadata = { title: 'New resource · Library · Admin' }
export const dynamic = 'force-dynamic'

export default async function NewResource({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const [data, products] = await Promise.all([getLibrary(), hostProducts()])
  return (
    <div className="stack">
      <div className="stack hw-page-head">
        <p className="t-sm"><a className="hw-back" href="/admin/library/">← The Library</a></p>
        <h1 className="t-h2">A new resource</h1>
        <p className="t-body u-text-secondary hw-measure">It starts as a draft. Publish it when it is ready to be seen.</p>
      </div>
      <ResourceForm action={createResource} data={data} products={products} audiences={AUDIENCES} error={errorOf(sp)} />
    </div>
  )
}
