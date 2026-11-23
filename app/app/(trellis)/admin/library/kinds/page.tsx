import type { Metadata } from 'next'
import { getLibraryForEditing as getLibrary } from '@/lib/library'
import { TypesForm } from '@/vendor/collab-library/src/index.ts'
import { saveKinds } from '../actions'
import { Saved, errorOf } from '../../notice'

export const metadata: Metadata = { title: 'Kinds · Library · Admin' }
export const dynamic = 'force-dynamic'

export default async function Kinds({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const data = await getLibrary()
  return (
    <div className="stack">
      <div className="stack hw-page-head">
        <h1 className="t-h2">Kinds of resource</h1>
      </div>
      <Saved sp={sp} />
      <TypesForm action={saveKinds} data={data} error={errorOf(sp)} />
    </div>
  )
}
