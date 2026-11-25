/**
 * One resource, in full: what it is, who made it, what the viewer can do with
 * it, what it is about and what it goes with. No hooks: the library's dialog
 * shows it, and the host's /library/<slug>/ page renders it on the server, so
 * every resource has an address a search engine and a friend can open.
 *
 * Links to other resources carry data-clib-open, so the client library can
 * open them in place; without the client they are ordinary links.
 */
import type { LibraryData, LibraryHost, Resource } from '../types.ts'
import { accessVia, creditLine, duration, relatedOf } from '../logic.ts'
import { Shape } from './Shape.tsx'

export function href(host: LibraryHost, slug: string) {
  return `${host.base}${slug}/`
}

/** How many resources are part of this one (a series, an album). */
export function countOf(r: Resource, data: LibraryData) {
  return data.relations.filter((x) => x.kind === 'part-of' && x.to_id === r.id).length || undefined
}

function Action({ r, data, host }: { r: Resource; data: LibraryData; host: LibraryHost }) {
  const { access, via } = accessVia(r, data)
  const o = via ?? r // the resource the offer belongs to
  const type = data.types.find((t) => t.key === r.type)
  const outside = !!r.url && /^https?:\/\//.test(r.url)
  const on = via && (
    <p className="t-sm u-text-secondary">{access === 'yours' ? 'With ' : 'On '}<a href={href(host, via.slug)} data-clib-open={via.slug}>{via.title}</a></p>
  )
  switch (access) {
    case 'yours':
      return (
        <div className="card clib-access" data-access={access}>
          <div className="stack">
            <p className="t-h6">It’s in your library</p>
            {on}
            <div className="cluster">
              <a className="button cc-primary" href={r.url ?? host.ownedHref}><span className="button-label">{type?.action ?? 'Open'}</span></a>
            </div>
          </div>
        </div>
      )
    case 'free':
      return (
        <div className="card clib-access" data-access={access}>
          <div className="stack">
            <p className="t-h6">Free</p>
            {on}
            <p className="t-sm u-text-secondary">{host.signedIn ? 'Add it to your library to keep it.' : 'Sign in to add it to your library and keep it.'}</p>
            <div className="cluster">
              <a className="button cc-primary" href={host.productHref(o.product_slug!)}><span className="button-label">Add to your library</span></a>
            </div>
          </div>
        </div>
      )
    case 'for-sale':
      return (
        <div className="card clib-access" data-access={access}>
          <div className="stack">
            <p className="t-h6">{host.money(o.price_cents ?? 0, o.currency ?? 'usd')}</p>
            {on}
            <div className="cluster">
              <a className="button cc-primary" href={host.productHref(o.product_slug!)}><span className="button-label">{via ? `Buy ${via.title}` : 'Buy'}</span></a>
            </div>
          </div>
        </div>
      )
    case 'open':
      if (!r.url) return null // read in place, below
      return (
        <div className="cluster">
          <a className="button cc-primary" href={r.url} {...(outside ? { target: '_blank', rel: 'noopener' } : {})}>
            <span className="button-label">{type?.action ?? 'Open'}</span>
          </a>
          {outside && <span className="t-sm u-text-secondary">Opens {new URL(r.url).hostname.replace(/^www\./, '')}</span>}
        </div>
      )
    case 'soon':
      return (
        <div className="card clib-access" data-access={access}>
          <p className="t-sm u-text-secondary">Not available yet.</p>
        </div>
      )
  }
}

export function Detail({ r, data, host, bodyHtml = '', headingLevel = 2 }: {
  r: Resource
  data: LibraryData
  host: LibraryHost
  /** The body, rendered to safe HTML by the host (its own markdown renderer). */
  bodyHtml?: string
  /** 1 on the resource's own page, 2 inside the library's dialog. */
  headingLevel?: 1 | 2
}) {
  const type = data.types.find((t) => t.key === r.type)
  const H = headingLevel === 1 ? 'h1' : 'h2'
  const facts = [type?.label, r.year ? String(r.year) : '', duration(r.minutes), r.stage ? r.stage[0].toUpperCase() + r.stage.slice(1) : '']
    .filter(Boolean)
    .join(' · ')
  const by = creditLine(r)
  const related = relatedOf(r, data)
  const topics = r.topics.map((id) => data.topics.find((t) => t.id === id)).filter((t) => !!t)
  const paths = data.collections.filter((c) => c.stops.some((s) => s.resource_id === r.id))
  const body = r.body.trim() ? bodyHtml : ''

  return (
    <article className="clib-detail">
      <div className="clib-detail-grid">
      <div className="clib-detail-hero">
        <Shape r={r} type={type} topics={data.topics} access={accessVia(r, data).access} count={countOf(r, data)} big />
      </div>
      <div className="stack clib-detail-main">
        <div className="stack">
          {facts && <p className="t-eyebrow u-text-secondary">{facts}</p>}
          <H className={headingLevel === 1 ? 't-h2' : 't-h3'}>{r.title}</H>
          {r.subtitle && <p className="t-lg u-text-secondary">{r.subtitle}</p>}
          {by && <p className="t-body">{by}</p>}
        </div>
        {r.blurb && <p className="t-lg">{r.blurb}</p>}
        <Action r={r} data={data} host={host} />
        {body && <div className="prose" dangerouslySetInnerHTML={{ __html: body }} />}
        {topics.length > 0 && (
          <div className="cluster" aria-label="About">
            {topics.map((t) => (
              <a key={t.id} className="tag" href={`${host.base}?topic=${t.slug}`}><span className="tag-label">{t.name}</span></a>
            ))}
          </div>
        )}
        {related.map((g) => (
          <section key={g.label} className="stack" aria-label={g.label}>
            <h3 className="t-label u-text-secondary">{g.label}</h3>
            <ul className="list cc-dense">
              {g.items.map((x) => (
                <li key={x.id} className="list-item">
                  <div className="list-body">
                    <a className="list-title list-link t-body" href={href(host, x.slug)} data-clib-open={x.slug}>{x.title}</a>
                    {x.subtitle && <span className="list-sub t-sm">{x.subtitle}</span>}
                  </div>
                  <span className="list-end t-sm u-text-secondary">{data.types.find((t) => t.key === x.type)?.label}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {paths.length > 0 && (
          <section className="stack" aria-label="On a path">
            <h3 className="t-label u-text-secondary">On a path</h3>
            <div className="cluster">
              {paths.map((c) => (
                <a key={c.id} className="tag" href={`${host.base}?path=${c.slug}`}><span className="tag-label">{c.title}</span></a>
              ))}
            </div>
          </section>
        )}
      </div>
      </div>
    </article>
  )
}
