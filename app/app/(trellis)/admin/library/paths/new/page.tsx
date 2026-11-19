import type { Metadata } from 'next'
import { getLibraryForEditing as getLibrary } from '@/lib/library'
import { CollectionForm } from '@/vendor/collab-library/src/index.ts'
import { createPath } from '../../actions'
import { errorOf } from '../../notice'

export const metadata: Metadata = { title: 'New path · Library · Admin' }
export const dynamic = 'force-dynamic'

export default async function NewPath({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const data = await getLibrary()
  return (
    <div className="stack">
      <div className="stack hw-page-head">
        <p className="t-sm"><a className="hw-back" href="/admin/library/paths/">← Paths</a></p>
        <h1 className="t-h2">A new path</h1>
      </div>
      <CollectionForm action={createPath} data={data} error={errorOf(sp)} blankRows={5} />
    </div>
  )
}
