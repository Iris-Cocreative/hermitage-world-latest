import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/auth'
import { KIND_LABEL, money } from '@/lib/format'
import { renderMarkdown } from '@/lib/markdown'
import { coverUrl } from '@/lib/site'
import { PageHero } from '@/components/page-hero'
import { Notice } from '@/components/notice'
import { ProductFiles } from '@/components/product-files'
import { claimFree, startCheckout } from '../actions'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>
type Search = Promise<Record<string, string | string[] | undefined>>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('title, subtitle').eq('slug', slug).maybeSingle()
  return data ? { title: data.title, description: data.subtitle || undefined } : { title: 'Not found' }
}

export default async function ProductPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params
  const sp = await searchParams
  const supabase = await createClient()
  const { data: product } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle()
  if (!product) notFound()

  const viewer = await getViewer()
  const meta = (product.meta ?? {}) as { by?: string[]; vol?: number | null; track?: number | null; year?: number | null; discs?: number | null }

  const [{ data: owned }, { data: tracks }] = await Promise.all([
    viewer
      ? supabase.from('entitlements').select('id').eq('product_id', product.id).eq('user_id', viewer.user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    product.kind === 'album'
      ? supabase.from('products').select('id, slug, title, price_cents, currency, meta').eq('status', 'active').eq('kind', 'track').filter('meta->>album', 'eq', slug).order('sort')
      : Promise.resolve({ data: [] as { id: string; slug: string; title: string; price_cents: number; currency: string; meta: unknown }[] }),
  ])

  const cover = coverUrl(product.cover_path)
  const files = owned ? (await supabase.from('product_files').select('*').eq('product_id', product.id).order('sort')).data ?? [] : []
  const free = product.price_cents === 0
  const facts = [
    meta.by?.length ? meta.by.join(', ') : null,
    meta.vol ? `Vol. ${meta.vol}${meta.track ? ` · Track ${meta.track}` : ''}` : null,
    meta.discs ? `${meta.discs} discs` : null,
    meta.year ? String(meta.year) : null,
  ].filter(Boolean)

  return (
    <>
      <PageHero
        title={product.title}
        lede={product.subtitle || undefined}
        crumbs={[{ href: '/shop/', label: 'Shop' }, { href: `/shop/${product.slug}/`, label: product.title }]}
        media={cover ? <img className="cover" src={cover} alt={`Cover of ${product.title}`} /> : undefined}
      >
        <div className="buy">
          <div className="cluster cluster--tight">
            <span className="tag">{KIND_LABEL[product.kind] ?? product.kind}</span>
            {product.status !== 'active' && <span className="tag tag--draft">{product.status} · only staff can see this page</span>}
          </div>
          {facts.length > 0 && <p className="t-small t-muted">{facts.join(' · ')}</p>}
          <div className="price price--lg">{money(product.price_cents, product.currency)}</div>

          {sp.canceled && <Notice>Your payment was canceled. Nothing was charged.</Notice>}
          {sp.error && <Notice tone="warn">Checkout could not start. Please try again in a moment, or write to us.</Notice>}

          {owned ? (
            <p className="t-small"><Link className="link" href="/account/">In your library</Link></p>
          ) : product.status !== 'active' ? (
            <p className="t-small t-muted">Not on sale yet.</p>
          ) : free ? (
            <form action={claimFree}>
              <input type="hidden" name="product_id" value={product.id} />
              <button className="btn btn--solid btn--lg" type="submit">{viewer ? 'Add to your library' : 'Sign in to add it to your library'}</button>
            </form>
          ) : (
            <form action={startCheckout}>
              <input type="hidden" name="product_id" value={product.id} />
              <button className="btn btn--solid btn--lg" type="submit">Buy · {money(product.price_cents, product.currency)}</button>
              <p className="form-note mt-sm">Secure payment by Stripe. Afterwards the recording is in your library, to stream or download.</p>
            </form>
          )}
        </div>
      </PageHero>

      {owned && files.length > 0 && (
        <section className="section section--tight" data-room="deep">
          <div className="container container--narrow stack">
            <h2 className="t-h3">Listen</h2>
            <ProductFiles files={files} />
          </div>
        </section>
      )}

      <section className="section" data-room="plaster">
        <div className="container container--narrow stack stack--xl">
          {product.description ? (
            <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(product.description) }} />
          ) : (
            <p className="t-muted">A description is on its way.</p>
          )}

          {tracks && tracks.length > 0 && (
            <div className="stack stack--sm">
              <h2 className="t-h3">On this album</h2>
              <div className="board">
                {tracks.map((t) => {
                  const m = (t.meta ?? {}) as { track?: number | null }
                  return (
                    <div key={t.id} className="board__row board__row--compact">
                      <div className="board__label">{m.track ? `Track ${m.track}` : 'Track'}</div>
                      <div><Link className="board__title" href={`/shop/${t.slug}/`}>{t.title}</Link></div>
                      <div className="board__action price">{money(t.price_cents, t.currency)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
