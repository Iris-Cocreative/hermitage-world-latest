import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLibraryForEditing as getLibrary } from '@/lib/library'
import { CollectionForm } from '@/vendor/collab-library/src/index.ts'
import { removePath, updatePath } from '../../actions'
import { Saved, errorOf } from '../../notice'

export const metadata: Metadata = { title: 'Edit path · Library · Admin' }
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function EditPath({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const data = await getLibrary()
  const c = data.collections.find((x) => x.id === id)
  if (!c) notFound()
  return (
    <div className="stack">
      <div className="hw-admin-head">
        <div className="stack hw-page-head">
          <p className="t-sm"><a className="hw-back" href="/admin/library/paths/">← Paths</a></p>
          <h1 className="t-h2">{c.title}</h1>
        </div>
        <div className="cluster">
          {c.status === 'published' && <a className="button" href={`/library/?path=${c.slug}`}><span className="button-label">See it</span></a>}
        </div>
      </div>
      <Saved sp={sp} />
      <CollectionForm action={updatePath.bind(null, c.id)} data={data} collection={c} error={errorOf(sp)} />
      <form action={removePath.bind(null, c.id)} className="stack">
        <p className="t-sm u-text-secondary">Deleting the path leaves its resources in the library.</p>
        <div className="cluster">
          <button className="button cc-ghost" type="submit"><span className="button-label">Delete this path</span></button>
        </div>
      </form>
    </div>
  )
}
