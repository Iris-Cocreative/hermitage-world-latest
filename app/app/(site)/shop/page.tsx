import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { KIND_LABEL, money } from '@/lib/format'
import { coverUrl } from '@/lib/site'
import { PageHero } from '@/components/page-hero'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Friar Justin’s recorded meditations, the Success books and the Hermitage’s programs.',
}

export const dynamic = 'force-dynamic'

const ORDER = ['album', 'track', 'book', 'bundle', 'video', 'program', 'other'] as const
const GROUP_TITLE: Record<string, { title: string; lede: string }> = {
  album: { title: 'Albums', lede: 'The Hermitage Meditation Series, two volumes to a disc.' },
  track: { title: 'Single recordings', lede: 'Every meditation on its own, as an MP3 you keep.' },
  book: { title: 'Books', lede: 'The Success trilogy and Friar Justin’s other writing.' },
  bundle: { title: 'Sets', lede: '' },
  video: { title: 'Video', lede: '' },
  program: { title: 'Programs', lede: '' },
  other: { title: 'More', lede: '' },
}

export default async function ShopPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, slug, kind, title, subtitle, price_cents, currency, cover_path, meta')
    .eq('status', 'active')
    .order('sort', { ascending: true })

  const groups = ORDER.map((kind) => ({ kind, items: (products ?? []).filter((p) => p.kind === kind) })).filter((g) => g.items.length > 0)

  return (
    <>
      <PageHero
        title="Recordings, books and programs"
        lede="Friar Justin’s meditations and teachings, kept as the Hermitage recorded them. A purchase stays in your library, to listen to or read whenever you need it."
      />

      {groups.length === 0 && (
        <section className="section" data-room="plaster">
          <div className="container container--narrow stack">
            <h2 className="t-h3">The shelves are being stocked.</h2>
            <p className="t-muted">Nothing is on sale yet. The catalog is being prepared, title by title.</p>
          </div>
        </section>
      )}

      {groups.map((g, i) => (
        <section key={g.kind} className="section" data-room={i % 2 === 0 ? 'plaster' : 'dark'}>
          <div className="container">
            <div className="section-head">
              <div className="section-head__text">
                <h2>{GROUP_TITLE[g.kind].title}</h2>
                {GROUP_TITLE[g.kind].lede && <p className="t-lede">{GROUP_TITLE[g.kind].lede}</p>}
              </div>
            </div>
            <div className="grid grid--3">
              {g.items.map((p) => {
                const cover = coverUrl(p.cover_path)
                const by = Array.isArray((p.meta as { by?: string[] })?.by) ? (p.meta as { by: string[] }).by.join(', ') : ''
                return (
                  <article key={p.id} className="card card--link product-card">
                    {cover && <img className="cover" src={cover} alt="" loading="lazy" />}
                    <span className="tag">{KIND_LABEL[p.kind] ?? p.kind}</span>
                    <h3><Link className="card__title" href={`/shop/${p.slug}/`}>{p.title}</Link></h3>
                    {p.subtitle && <p>{p.subtitle}</p>}
                    {by && <p className="t-small">{by}</p>}
                    <div className="price">{money(p.price_cents, p.currency)}</div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      ))}

      <hw-signup dangerouslySetInnerHTML={{ __html: '' }} suppressHydrationWarning />
    </>
  )
}
