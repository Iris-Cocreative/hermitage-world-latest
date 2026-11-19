/**
 * The editors' side: the forms for a resource, a path and the types. Server
 * components with no hooks: the host passes its own server action (which
 * checks the editor and calls saveResource / saveCollection / saveTypes), so
 * the forms work before any script loads.
 *
 * Repeating rows (credits, relations, stops) are drawn with a few empty rows
 * at the end; a row left empty is ignored. Plain, and it needs no script.
 */
import type { Collection, LibraryData, Resource, Shape } from '../types.ts'

const SHAPES: Shape[] = ['book', 'article', 'video', 'audio', 'album', 'course', 'practice', 'stack', 'paper']

export interface HostProduct {
  id: string
  slug: string
  title: string
  price: string // already formatted: "$3.99", "Free"
  status: string
}

type Action = (form: FormData) => void | Promise<void>

function Field({ label, hint, children, id }: { label: string; hint?: string; children: React.ReactNode; id: string }) {
  return (
    <div className="field">
      <label className="field-label t-sm" htmlFor={id}>{label}</label>
      {children}
      {hint && <p className="field-hint t-xs">{hint}</p>}
    </div>
  )
}

export function ResourceForm({ action, data, resource, products, audiences, error, blankRows = 2 }: {
  action: Action
  data: LibraryData
  /** Absent for a new resource. */
  resource?: Resource
  products: HostProduct[]
  /** The audiences this host's library_can_see() knows: [['public', 'Everyone'], …] */
  audiences: [string, string][]
  error?: string
  blankRows?: number
}) {
  const r = resource
  const others = data.resources.filter((x) => x.id !== r?.id).sort((a, b) => a.title.localeCompare(b.title))
  const ownRelations = r ? data.relations.filter((x) => x.from_id === r.id) : []
  const facets = [...new Set(data.topics.map((t) => t.facet))]
  const credits = r?.credits ?? []
  const people = [...data.people].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <form action={action} className="stack clib-form">
      {error && (
        <div className="card clib-form-error" role="alert"><p className="t-body">{error}</p></div>
      )}

      <div className="cols clib-form-cols">
        <Field label="Title" id="f-title">
          <input id="f-title" className="input" name="title" required defaultValue={r?.title} />
        </Field>
        <Field label="Address" id="f-slug" hint="The end of its link. Leave empty to make one from the title.">
          <input id="f-slug" className="input" name="slug" defaultValue={r?.slug} pattern="[a-z0-9][a-z0-9\-]*" />
        </Field>
      </div>

      <div className="cols clib-form-cols">
        <Field label="Kind" id="f-type">
          <select id="f-type" className="input" name="type" required defaultValue={r?.type ?? ''}>
            <option value="" disabled>Choose…</option>
            {data.types.map((t) => (
              <option key={t.key} value={t.key}>{t.label}{t.enabled ? '' : ' (hidden)'}</option>
            ))}
          </select>
        </Field>
        <Field label="Status" id="f-status" hint="Only published resources appear in the library.">
          <select id="f-status" className="input" name="status" defaultValue={r?.status ?? 'draft'}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
      </div>

      <Field label="Subtitle" id="f-subtitle">
        <input id="f-subtitle" className="input" name="subtitle" defaultValue={r?.subtitle} />
      </Field>
      <Field label="Description" id="f-blurb" hint="A few sentences. Shown on its card and its page.">
        <textarea id="f-blurb" className="input" name="blurb" rows={4} defaultValue={r?.blurb} />
      </Field>
      <Field label="Text to read in place" id="f-body" hint="Optional, in Markdown. For an article or a practice that lives here rather than at a link.">
        <textarea id="f-body" className="input" name="body" rows={8} defaultValue={r?.body} />
      </Field>

      <fieldset className="stack clib-fieldset">
        <legend className="t-h6">Where it opens</legend>
        <Field label="Product in the store" id="f-product" hint="If it is sold or claimed, the store's price and ownership decide what a visitor sees.">
          <select id="f-product" className="input" name="product_id" defaultValue={r?.product_id ?? ''}>
            <option value="">None: it opens by its link or its text</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.title} · {p.price}{p.status === 'active' ? '' : ` · ${p.status}`}</option>
            ))}
          </select>
        </Field>
        <Field label="Link" id="f-url" hint="https://… for another site, or /path/ for a page here.">
          <input id="f-url" className="input" name="url" defaultValue={r?.url ?? ''} />
        </Field>
        <Field label="Who may see it" id="f-audience">
          <select id="f-audience" className="input" name="audience" defaultValue={r?.audience ?? 'public'}>
            {audiences.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      </fieldset>

      <fieldset className="stack clib-fieldset">
        <legend className="t-h6">People</legend>
        {[...credits.map((c) => ({ id: c.person.id, credit: c.credit })), ...Array.from({ length: blankRows }, () => ({ id: '', credit: '' }))].map((c, i) => (
          <div key={i} className="cols clib-form-cols">
            <Field label={i === 0 ? 'Person' : 'And'} id={`f-person-${i}`}>
              <select id={`f-person-${i}`} className="input" name="person" defaultValue={c.id}>
                <option value="">—</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="As" id={`f-credit-${i}`} hint={i === 0 ? 'Voice, harp, editor… Empty means the author.' : undefined}>
              <input id={`f-credit-${i}`} className="input" name="credit" defaultValue={c.credit} />
            </Field>
          </div>
        ))}
        <div className="cols clib-form-cols">
          <Field label="Someone new" id="f-new-person" hint="Adds them to the library's people.">
            <input id="f-new-person" className="input" name="new_person" placeholder="Their full name" />
          </Field>
          <Field label="As" id="f-new-credit">
            <input id="f-new-credit" className="input" name="new_person_credit" />
          </Field>
        </div>
      </fieldset>

      {facets.map((facet) => (
        <fieldset key={facet} className="stack clib-fieldset">
          <legend className="t-h6">{facet[0].toUpperCase() + facet.slice(1)}</legend>
          <div className="cluster">
            {data.topics.filter((t) => t.facet === facet).map((t) => (
              <label key={t.id} className="clib-check t-sm">
                <input type="checkbox" name="topic" value={t.id} defaultChecked={r?.topics.includes(t.id)} />
                {t.name}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <fieldset className="stack clib-fieldset">
        <legend className="t-h6">Goes with</legend>
        {[...ownRelations.map((x) => `${x.kind}:${x.to_id}`), ...Array.from({ length: blankRows }, () => '')].map((v, i) => {
          const [kind, to] = v ? v.split(':') : ['', '']
          return <RelationRow key={i} i={i} kind={kind} to={to} data={data} others={others} />
        })}
      </fieldset>

      <fieldset className="stack clib-fieldset">
        <legend className="t-h6">Details</legend>
        <div className="cols clib-form-cols-3">
          <Field label="Length (minutes)" id="f-minutes">
            <input id="f-minutes" className="input" name="minutes" inputMode="numeric" defaultValue={r?.minutes ?? ''} />
          </Field>
          <Field label="Year" id="f-year">
            <input id="f-year" className="input" name="year" inputMode="numeric" defaultValue={r?.year ?? ''} />
          </Field>
          <Field label="Order" id="f-sort" hint="Lower comes first.">
            <input id="f-sort" className="input" name="sort" inputMode="numeric" defaultValue={r?.sort ?? 0} />
          </Field>
        </div>
        <div className="cols clib-form-cols">
          <Field label="Cover image" id="f-cover" hint="A full address, or a path on this site.">
            <input id="f-cover" className="input" name="cover_url" defaultValue={r?.cover_url ?? ''} />
          </Field>
          <Field label="Stage" id="f-stage" hint="For writing that is still growing.">
            <select id="f-stage" className="input" name="stage" defaultValue={r?.stage ?? ''}>
              <option value="">—</option>
              <option value="seedling">Seedling: early, still changing</option>
              <option value="budding">Budding: a working draft</option>
              <option value="evergreen">Evergreen: considered and stable</option>
            </select>
          </Field>
        </div>
        <label className="clib-check t-sm">
          <input type="checkbox" name="featured" defaultChecked={r?.featured} /> Feature it at the front of the library
        </label>
      </fieldset>

      <div className="cluster">
        <button className="button cc-primary" type="submit"><span className="button-label">{r ? 'Save' : 'Add to the library'}</span></button>
      </div>
    </form>
  )
}

function RelationRow({ i, kind, to, data, others }: { i: number; kind: string; to: string; data: LibraryData; others: Resource[] }) {
  return (
    <div className="cols clib-form-cols">
      <Field label={i === 0 ? 'It…' : 'And'} id={`f-relk-${i}`}>
        <select id={`f-relk-${i}`} className="input" name="relation_kind" defaultValue={kind || 'companion'}>
          {data.kinds.map((k) => <option key={k.key} value={k.key}>{k.out_label}</option>)}
        </select>
      </Field>
      <Field label="…this" id={`f-relt-${i}`}>
        <select id={`f-relt-${i}`} className="input" name="relation_to" defaultValue={to}>
          <option value="">—</option>
          {others.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
        </select>
      </Field>
    </div>
  )
}

export function CollectionForm({ action, data, collection, error, blankRows = 3 }: {
  action: Action
  data: LibraryData
  collection?: Collection
  error?: string
  blankRows?: number
}) {
  const c = collection
  const all = [...data.resources].sort((a, b) => a.title.localeCompare(b.title))
  const stops = [...(c?.stops ?? []), ...Array.from({ length: blankRows }, () => ({ resource_id: '', note: '' }))]
  return (
    <form action={action} className="stack clib-form">
      {error && <div className="card clib-form-error" role="alert"><p className="t-body">{error}</p></div>}
      <div className="cols clib-form-cols">
        <Field label="Title" id="c-title"><input id="c-title" className="input" name="title" required defaultValue={c?.title} /></Field>
        <Field label="Address" id="c-slug" hint="Leave empty to make one from the title."><input id="c-slug" className="input" name="slug" defaultValue={c?.slug} pattern="[a-z0-9][a-z0-9\-]*" /></Field>
      </div>
      <Field label="What it is for" id="c-blurb"><textarea id="c-blurb" className="input" name="blurb" rows={3} defaultValue={c?.blurb} /></Field>
      <div className="cols clib-form-cols-3">
        <Field label="Suggested by" id="c-by"><input id="c-by" className="input" name="by_line" defaultValue={c?.by_line} /></Field>
        <Field label="How long" id="c-time" hint="6 recordings, then a retreat"><input id="c-time" className="input" name="time_line" defaultValue={c?.time_line} /></Field>
        <Field label="Status" id="c-status">
          <select id="c-status" className="input" name="status" defaultValue={c?.status ?? 'draft'}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
      </div>
      <fieldset className="stack clib-fieldset">
        <legend className="t-h6">The stops, in order</legend>
        {stops.map((s, i) => (
          <div key={i} className="cols clib-form-cols">
            <Field label={`${i + 1}`} id={`c-stop-${i}`}>
              <select id={`c-stop-${i}`} className="input" name="stop" defaultValue={s.resource_id}>
                <option value="">—</option>
                {all.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
              </select>
            </Field>
            <Field label="Why it is here" id={`c-note-${i}`}>
              <input id={`c-note-${i}`} className="input" name="note" defaultValue={s.note} />
            </Field>
          </div>
        ))}
      </fieldset>
      <input type="hidden" name="sort" value={c?.sort ?? 0} />
      <div className="cluster">
        <button className="button cc-primary" type="submit"><span className="button-label">{c ? 'Save the path' : 'Add the path'}</span></button>
      </div>
    </form>
  )
}

export function TypesForm({ action, data, error }: { action: Action; data: LibraryData; error?: string }) {
  const used = (key: string) => data.resources.filter((r) => r.type === key).length
  return (
    <form action={action} className="stack clib-form">
      {error && <div className="card clib-form-error" role="alert"><p className="t-body">{error}</p></div>}
      <p className="t-body u-text-secondary">Each kind keeps its own shelf. Rename them in your own words, choose how each is drawn, and hide the kinds you don’t keep. They are listed in the order the shelves appear.</p>
      <ul className="list cc-group">
        {[...data.types].sort((a, b) => a.sort - b.sort).map((t) => (
          <li key={t.key} className="list-item">
            <input type="hidden" name="key" value={t.key} />
            <div className="list-body">
              <div className="cols clib-form-cols-4">
                <Field label="Name" id={`t-label-${t.key}`}><input id={`t-label-${t.key}`} className="input cc-sm" name={`label:${t.key}`} defaultValue={t.label} /></Field>
                <Field label="Shelf title" id={`t-plural-${t.key}`}><input id={`t-plural-${t.key}`} className="input cc-sm" name={`plural:${t.key}`} defaultValue={t.plural} /></Field>
                <Field label="Button" id={`t-action-${t.key}`}><input id={`t-action-${t.key}`} className="input cc-sm" name={`action:${t.key}`} defaultValue={t.action} /></Field>
                <Field label="Drawn as" id={`t-shape-${t.key}`}>
                  <select id={`t-shape-${t.key}`} className="input cc-sm" name={`shape:${t.key}`} defaultValue={t.shape}>
                    {SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </div>
            <span className="list-end">
              <label className="switch">
                <input type="checkbox" role="switch" name={`enabled:${t.key}`} defaultChecked={t.enabled} className="u-sr-only" />
                <span className="switch-label">{used(t.key) ? `Shown · ${used(t.key)}` : 'Shown'}</span>
              </label>
            </span>
          </li>
        ))}
      </ul>
      <div className="cluster">
        <button className="button cc-primary" type="submit"><span className="button-label">Save the kinds</span></button>
      </div>
    </form>
  )
}
