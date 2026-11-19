import type { Metadata } from 'next'
import { getViewer } from '@/lib/auth'
import { FACET_LABELS, bodiesOf, clientHost, getLibrary } from '@/lib/library'
import { Library } from '@/vendor/collab-library/src/components/Library.tsx'

export const metadata: Metadata = {
  title: 'The Library',
  description: 'Every meditation the Hermitage recorded, Friar Justin’s books and homilies, and the programs that carry his teaching on.',
}
export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const [data, viewer] = await Promise.all([getLibrary(), getViewer()])
  return (
    <div className="frame hw-page">
      <header className="stack hw-page-head">
        <p className="t-eyebrow u-text-secondary">The Library</p>
        <h1 className="t-h1">Forty years of practice, kept open</h1>
        <p className="t-lg u-text-secondary hw-measure">
          Every meditation the Hermitage recorded, Friar Justin’s books and homilies, and the programs that carry his teaching on.
        </p>
      </header>
      <Library
        data={data}
        host={clientHost(!!viewer)}
        bodies={bodiesOf(data)}
        facetLabels={FACET_LABELS}
        placeholder="Search by title, person or occasion"
      />
    </div>
  )
}
