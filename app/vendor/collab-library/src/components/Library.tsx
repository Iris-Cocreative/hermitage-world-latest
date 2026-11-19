'use client'
/**
 * The library's reading room: a search, filters, and three ways to look
 * (shelves of shaped objects, the catalog as a list, and paths). A resource
 * opens in a dialog and takes its own address (/library/<slug>/), so Back
 * closes it and a reload lands on its page.
 *
 * Everything the viewer may see arrives as `data`, already filtered by
 * row-level security, so searching and filtering happen here with no round trip.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AccessState, LibraryData, LibraryHost, Resource } from '../types.ts'
import { ACCESS_LABEL, NO_FILTERS, accessOf, haystack, matches, rank, shelves, type Filters } from '../logic.ts'
import { Shape } from './Shape.tsx'
import { Detail, countOf, href } from './Detail.tsx'

type View = 'shelves' | 'list' | 'paths'

export interface LibraryProps {
  data: LibraryData
  host: Omit<LibraryHost, 'productHref' | 'signInHref' | 'money'> & {
    /** Pattern for a product's page, with {slug}: /shop/{slug}/ */
    productPattern: string
    signInPattern: string
    currencyLocale?: string
  }
  /** Rendered markdown bodies by resource id (the host renders on the server). */
  bodies?: Record<string, string>
  /** Labels for each facet of topics: { occasion: 'When' }. */
  facetLabels?: Record<string, string>
  /** What the search box says. */
  placeholder?: string
}

/** Functions can't cross from a server component, so the client rebuilds the host from patterns. */
function clientHost(h: LibraryProps['host']): LibraryHost {
  return {
    ...h,
    productHref: (slug) => h.productPattern.replace('{slug}', slug),
    signInHref: (next) => h.signInPattern.replace('{next}', encodeURIComponent(next)),
    money: (cents, currency) =>
      new Intl.NumberFormat(h.currencyLocale ?? 'en-US', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100),
  }
}

function readUrl(base: string) {
  const u = new URL(window.location.href)
  const rest = u.pathname.startsWith(base) ? u.pathname.slice(base.length).replace(/\/$/, '') : ''
  return {
    slug: rest && !rest.includes('/') ? rest : null,
    topic: u.searchParams.get('topic'),
    path: u.searchParams.get('path'),
    view: (u.searchParams.get('view') as View | null) ?? null,
  }
}

export function Library({ data, host: hostIn, bodies = {}, facetLabels = {}, placeholder = 'Search the library' }: LibraryProps) {
  const byId = useMemo(() => new Map(data.resources.map((r) => [r.id, r])), [data.resources])
  const bySlug = useMemo(() => new Map(data.resources.map((r) => [r.slug, r])), [data.resources])
  const host = useMemo(() => clientHost(hostIn), [hostIn])
  const hay = useMemo(() => new Map(data.resources.map((r) => [r.id, haystack(r, data)])), [data])

  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [view, setView] = useState<View>('shelves')
  const [open, setOpen] = useState<Resource | null>(null)
  const [focusPath, setFocusPath] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  // Arriving with ?topic=, ?path= or ?view= sets the room up that way.
  useEffect(() => {
    const u = readUrl(host.base)
    if (u.topic) {
      const t = data.topics.find((x) => x.slug === u.topic)
      if (t) setFilters((f) => ({ ...f, topics: [t.id] }))
    }
    if (u.path) {
      setView('paths')
      setFocusPath(u.path)
    } else if (u.view === 'list' || u.view === 'paths') setView(u.view)
  }, [data.topics, host.base])

  const show = useCallback(
    (r: Resource | null, push = true) => {
      setOpen(r)
      if (!push) return
      if (r) {
        const target = href(host, r.slug)
        if (window.location.pathname === target) return
        // From one resource to the next replaces the entry, so Back returns to the room.
        if (window.history.state?.clib) window.history.replaceState({ clib: r.slug }, '', target)
        else window.history.pushState({ clib: r.slug }, '', target)
      } else if (window.history.state?.clib) {
        window.history.back()
      } else if (window.location.pathname !== host.base) {
        window.history.replaceState(null, '', host.base + window.location.search)
      }
    },
    [host],
  )

  // Back and forward move between resources and the room.
  useEffect(() => {
    const onPop = () => {
      const { slug } = readUrl(host.base)
      setOpen(slug ? (bySlug.get(slug) ?? null) : null)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [bySlug, host.base])

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
    if (open) d.querySelector('.modal-body')?.scrollTo({ top: 0 })
  }, [open])

  // Any link marked data-clib-open opens in place, wherever it is drawn.
  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement).closest<HTMLElement>('[data-clib-open]')
      if (!a) return
      const r = bySlug.get(a.dataset.clibOpen ?? '')
      if (!r) return
      e.preventDefault()
      show(r)
    },
    [bySlug, show],
  )

  const found = useMemo(
    () => rank(data.resources.filter((r) => matches(r, filters, hay.get(r.id) ?? '')), filters.q),
    [data.resources, filters, hay],
  )

  const toggle = <K extends 'types' | 'topics' | 'access'>(key: K, value: Filters[K][number]) =>
    setFilters((f) => {
      const list = f[key] as string[]
      return { ...f, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] }
    })

  const enabledTypes = data.types.filter((t) => t.enabled && data.resources.some((r) => r.type === t.key))
  const facets = [...new Set(data.topics.map((t) => t.facet))]
  const accessSeen = (['free', 'for-sale', 'yours', 'open', 'soon'] as AccessState[]).filter((a) => data.resources.some((r) => accessOf(r) === a))
  const filtering = filters.q !== '' || filters.types.length + filters.topics.length + filters.access.length > 0
  const countIn = (pred: (r: Resource) => boolean) => data.resources.filter(pred).length

  const card = (r: Resource) => (
    <a key={r.id} className="clib-item" href={href(host, r.slug)} data-clib-open={r.slug}>
      <Shape r={r} type={data.types.find((t) => t.key === r.type)} topics={data.topics} access={accessOf(r)} count={countOf(r, data)} />
    </a>
  )

  return (
    <div className="clib" onClick={onClick}>
      <div className="stack clib-desk">
        <div className="field">
          <label className="field-label u-sr-only" htmlFor="clib-q">Search</label>
          <input
            id="clib-q"
            className="input cc-lg"
            type="search"
            placeholder={placeholder}
            autoComplete="off"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
        </div>

        <div className="stack clib-facets">
          <div className="clib-facet" role="group" aria-label="Kind">
            <span className="t-label u-text-secondary clib-facet-label">Kind</span>
            <div className="cluster">
              {enabledTypes.map((t) => (
                <button key={t.key} type="button" className="tag" aria-pressed={filters.types.includes(t.key)} onClick={() => toggle('types', t.key)}>
                  <span className="tag-label">{t.plural}</span>
                  <span className="t-xs u-text-tertiary">{countIn((r) => r.type === t.key)}</span>
                </button>
              ))}
            </div>
          </div>
          {facets.map((facet) => (
            <div key={facet} className="clib-facet" role="group" aria-label={facetLabels[facet] ?? facet}>
              <span className="t-label u-text-secondary clib-facet-label">{facetLabels[facet] ?? facet}</span>
              <div className="cluster">
                {data.topics
                  .filter((t) => t.facet === facet && data.resources.some((r) => r.topics.includes(t.id)))
                  .map((t) => (
                    <button key={t.id} type="button" className="tag" aria-pressed={filters.topics.includes(t.id)} onClick={() => toggle('topics', t.id)}>
                      <span className="tag-label">{t.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
          {accessSeen.length > 1 && (
            <div className="clib-facet" role="group" aria-label="Access">
              <span className="t-label u-text-secondary clib-facet-label">Access</span>
              <div className="cluster">
                {accessSeen.map((a) => (
                  <button key={a} type="button" className="tag" aria-pressed={filters.access.includes(a)} onClick={() => toggle('access', a)}>
                    <span className="tag-label">{ACCESS_LABEL[a]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="clib-bar">
          <div className="tabs cc-seg" role="tablist" aria-label="View">
            {(
              [
                ['shelves', 'Shelves'],
                ['list', 'Catalog'],
                ...(data.collections.length ? [['paths', 'Paths']] : []),
              ] as [View, string][]
            ).map(([v, label]) => (
              <button key={v} type="button" role="tab" className="tab" aria-selected={view === v} onClick={() => setView(v)}>
                {label}
              </button>
            ))}
          </div>
          <p className="t-sm u-text-secondary" aria-live="polite">
            {filtering ? `${found.length} of ${data.resources.length}` : `${data.resources.length} in the library`}
            {filtering && (
              <>
                {' · '}
                <button type="button" className="button cc-ghost cc-sm" onClick={() => setFilters(NO_FILTERS)}>
                  <span className="button-label">Clear</span>
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {found.length === 0 && view !== 'paths' && (
        <div className="card clib-empty">
          <div className="stack">
            <p className="t-h5">Nothing matches that yet.</p>
            <p className="t-body u-text-secondary">Try fewer words, or clear the filters.</p>
            <div className="cluster">
              <button type="button" className="button" onClick={() => setFilters(NO_FILTERS)}><span className="button-label">Clear the filters</span></button>
            </div>
          </div>
        </div>
      )}

      {view === 'shelves' && (
        <div className="stack clib-shelves">
          {shelves(data.types, found).map(({ type, items }) => (
            <section key={type.key} className="clib-shelf" aria-labelledby={`clib-shelf-${type.key}`}>
              <div className="clib-shelf-head">
                <h2 className="t-h4" id={`clib-shelf-${type.key}`}>{type.plural}</h2>
                <span className="t-sm u-text-secondary">{items.length}</span>
              </div>
              <div className="rail clib-rail" tabIndex={0} role="group" aria-label={type.plural}>
                {items.map(card)}
              </div>
              <div className="clib-ledge" aria-hidden="true" />
            </section>
          ))}
        </div>
      )}

      {view === 'list' && found.length > 0 && (
        <ul className="list clib-catalog">
          {found.map((r) => {
            const a = accessOf(r)
            const type = data.types.find((t) => t.key === r.type)
            return (
              <li key={r.id} className="list-item">
                <span className="clib-catalog-type t-label u-text-secondary">{type?.label}</span>
                <div className="list-body">
                  <a className="list-title list-link t-body" href={href(host, r.slug)} data-clib-open={r.slug}>{r.title}</a>
                  {(r.subtitle || r.blurb) && <span className="list-sub t-sm u-clamp">{r.subtitle || r.blurb}</span>}
                </div>
                <span className="list-end">
                  {a === 'for-sale' && r.price_cents != null && <span className="t-sm">{host.money(r.price_cents, r.currency ?? 'usd')}</span>}
                  {a !== 'for-sale' && a !== 'open' && <span className="tag cc-sm" data-access={a}><span className="tag-label">{ACCESS_LABEL[a]}</span></span>}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {view === 'paths' && (
        <div className="grid clib-paths">
          {data.collections
            .filter((c) => !focusPath || c.slug === focusPath)
            .map((c) => (
              <article key={c.id} className="card clib-path">
                <div className="stack">
                  {c.by_line && <p className="t-eyebrow u-text-secondary">{c.by_line}</p>}
                  <h2 className="t-h4">{c.title}</h2>
                  {c.blurb && <p className="t-body">{c.blurb}</p>}
                  {c.time_line && <p className="t-sm u-text-secondary">{c.time_line}</p>}
                  <ol className="list clib-stops">
                    {c.stops.map((s, i) => {
                      const r = byId.get(s.resource_id)
                      if (!r) return null
                      const dim = filtering && !found.includes(r)
                      return (
                        <li key={s.resource_id} className="list-item" data-dim={dim || undefined}>
                          <span className="list-mark t-sm clib-stop-n">{i + 1}</span>
                          <div className="list-body">
                            <a className="list-title list-link t-body" href={href(host, r.slug)} data-clib-open={r.slug}>{r.title}</a>
                            {s.note && <span className="list-sub t-sm">{s.note}</span>}
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              </article>
            ))}
          {focusPath && (
            <div className="cluster">
              <button type="button" className="button cc-ghost" onClick={() => setFocusPath(null)}><span className="button-label">Every path</span></button>
            </div>
          )}
        </div>
      )}

      <dialog
        ref={dialog}
        className="modal clib-modal"
        aria-label={open?.title ?? 'Resource'}
        onClose={() => {
          if (open) show(null)
        }}
      >
        <div className="modal-inner">
          <div className="modal-header">
            <p className="t-label u-text-secondary">{open ? data.types.find((t) => t.key === open.type)?.label : ''}</p>
            <button type="button" className="button icon-button cc-ghost cc-md" aria-label="Close" onClick={() => dialog.current?.close()}>
              <svg className="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <div className="modal-body">{open && <Detail r={open} data={data} host={host} bodyHtml={bodies[open.id]} />}</div>
        </div>
      </dialog>
    </div>
  )
}
