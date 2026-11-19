import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getViewer } from '@/lib/auth'
import { getLibrary, libraryHost, LIBRARY_BASE } from '@/lib/library'
import { renderMarkdown } from '@/lib/markdown'
import { Detail } from '@/vendor/collab-library/src/components/Detail.tsx'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getLibrary()
  const r = data.resources.find((x) => x.slug === slug)
  return r ? { title: r.title, description: r.blurb || r.subtitle || undefined } : { title: 'Not found' }
}

/** A resource's own address: what a search engine, a friend or a reload lands on. */
export default async function ResourcePage({ params }: Props) {
  const { slug } = await params
  const [data, viewer] = await Promise.all([getLibrary(), getViewer()])
  const r = data.resources.find((x) => x.slug === slug)
  if (!r) notFound()
  return (
    <div className="frame hw-page">
      <div className="stack">
        <p className="t-sm"><a className="hw-back" href={LIBRARY_BASE}>← The Library</a></p>
        <Detail r={r} data={data} host={libraryHost(!!viewer)} bodyHtml={r.body.trim() ? renderMarkdown(r.body) : ''} headingLevel={1} />
      </div>
    </div>
  )
}
