/**
 * Collab Library: reading and writing, through the host's Supabase client.
 *
 * Every call runs as the viewer, so row-level security decides what comes
 * back: visitors get published resources, editors (library_is_editor) get
 * everything. The writes are plain functions; the host wraps each in its own
 * server action, after its own sign-in check, and revalidates its own paths.
 */
import type { Collection, Credit, LibraryData, Person, Relation, RelationKind, Resource, ResourceType, Topic } from './types.ts'

// The host's client, typed loosely: the library's tables aren't in the host's
// generated types until it regenerates them, and the library shouldn't care.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Client = { from: (table: string) => any }

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Collab Library: ${what}: ${res.error.message}`)
  return (res.data ?? []) as T
}

/**
 * Everything the library page needs, in one go. Only what is published,
 * even for an editor (who would otherwise see drafts on the public page);
 * the editor's own pages pass { drafts: true }.
 */
export async function loadLibrary(db: Client, opts: { drafts?: boolean } = {}): Promise<LibraryData> {
  const [types, topics, people, kinds, rows, credits, tags, relations, collections, stops] = await Promise.all([
    db.from('library_types').select('*').order('sort'),
    db.from('library_topics').select('*').order('sort'),
    db.from('library_people').select('id, slug, name, short_name, role').order('sort'),
    db.from('library_relation_kinds').select('*').order('sort'),
    db.from('library_catalog').select('*').order('sort'),
    db.from('library_resource_people').select('resource_id, person_id, credit, sort').order('sort'),
    db.from('library_resource_topics').select('resource_id, topic_id'),
    db.from('library_relations').select('from_id, to_id, kind, sort').order('sort'),
    db.from('library_collections').select('id, slug, title, blurb, by_line, time_line, status, sort').order('sort'),
    db.from('library_collection_items').select('collection_id, resource_id, sort, note').order('sort'),
  ])

  const peopleList = must<Person[]>(people, 'people')
  const personById = new Map(peopleList.map((p) => [p.id, p]))
  const creditsBy = new Map<string, Credit[]>()
  for (const c of must<{ resource_id: string; person_id: string; credit: string }[]>(credits, 'credits')) {
    const person = personById.get(c.person_id)
    if (!person) continue
    const list = creditsBy.get(c.resource_id) ?? []
    list.push({ person, credit: c.credit })
    creditsBy.set(c.resource_id, list)
  }
  const topicsBy = new Map<string, string[]>()
  for (const t of must<{ resource_id: string; topic_id: string }[]>(tags, 'topics of resources')) {
    const list = topicsBy.get(t.resource_id) ?? []
    list.push(t.topic_id)
    topicsBy.set(t.resource_id, list)
  }

  const resources = must<Omit<Resource, 'credits' | 'topics'>[]>(rows, 'catalog')
    .filter((r) => opts.drafts || r.status === 'published')
    .map((r) => ({
    ...r,
    credits: creditsBy.get(r.id) ?? [],
    topics: topicsBy.get(r.id) ?? [],
  }))

  const stopsBy = new Map<string, { resource_id: string; note: string }[]>()
  for (const s of must<{ collection_id: string; resource_id: string; note: string }[]>(stops, 'collection items')) {
    const list = stopsBy.get(s.collection_id) ?? []
    list.push({ resource_id: s.resource_id, note: s.note })
    stopsBy.set(s.collection_id, list)
  }

  const shown = new Set(resources.map((r) => r.id))
  return {
    types: must<ResourceType[]>(types, 'types'),
    topics: must<Topic[]>(topics, 'topics'),
    people: peopleList,
    kinds: must<RelationKind[]>(kinds, 'relation kinds'),
    resources,
    // Relations and stops only between resources that are shown.
    relations: must<Relation[]>(relations, 'relations').filter((x) => shown.has(x.from_id) && shown.has(x.to_id)),
    collections: must<Omit<Collection, 'stops'>[]>(collections, 'collections')
      .filter((c) => opts.drafts || c.status === 'published')
      .map((c) => ({ ...c, stops: (stopsBy.get(c.id) ?? []).filter((s) => shown.has(s.resource_id)) })),
  }
}

// ------------------------------------------------------------------ writes

const SLUG = /^[a-z0-9][a-z0-9-]*$/

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function str(form: FormData, key: string): string {
  const v = form.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

function int(form: FormData, key: string): number | null {
  const v = str(form, key)
  if (!v) return null
  const n = Number(v)
  return Number.isInteger(n) ? n : null
}

/** What the resource form posts, checked. Throws a message an editor can read. */
export function resourceFromForm(form: FormData) {
  const title = str(form, 'title')
  if (!title) throw new Error('A resource needs a title.')
  const slug = str(form, 'slug') || slugify(title)
  if (!SLUG.test(slug)) throw new Error('The address may use lowercase letters, numbers and dashes only.')
  if (!str(form, 'type')) throw new Error('Choose what kind of resource it is.')
  const status = str(form, 'status') || 'draft'
  if (!['draft', 'published', 'archived'].includes(status)) throw new Error('Unknown status.')
  const stage = str(form, 'stage') || null
  if (stage && !['seedling', 'budding', 'evergreen'].includes(stage)) throw new Error('Unknown stage.')
  const url = str(form, 'url') || null
  if (url && !/^(https?:\/\/|\/)/.test(url)) throw new Error('A link starts with https:// or with / for a page on this site.')
  const cover = str(form, 'cover_url') || null
  if (cover && !/^(https?:\/\/|\/)/.test(cover)) throw new Error('A cover image is a full address (https://…) or a path on this site.')
  const minutes = int(form, 'minutes')
  if (minutes !== null && minutes <= 0) throw new Error('Length is in whole minutes.')
  const year = int(form, 'year')
  return {
    row: {
      slug,
      type: str(form, 'type'),
      title,
      subtitle: str(form, 'subtitle'),
      blurb: str(form, 'blurb'),
      body: str(form, 'body'),
      status,
      audience: str(form, 'audience') || 'public',
      stage,
      url,
      product_id: str(form, 'product_id') || null,
      cover_url: cover,
      minutes,
      year,
      featured: form.get('featured') === 'on',
      sort: int(form, 'sort') ?? 0,
    },
    people: form.getAll('person').filter((v): v is string => typeof v === 'string' && v !== ''),
    credits: form.getAll('credit').map((v) => (typeof v === 'string' ? v.trim() : '')),
    topics: form.getAll('topic').filter((v): v is string => typeof v === 'string' && v !== ''),
    relations: (() => {
      const kinds = form.getAll('relation_kind').map((v) => (typeof v === 'string' ? v : ''))
      return form
        .getAll('relation_to')
        .map((v, i) => ({ kind: kinds[i] ?? '', to_id: typeof v === 'string' ? v : '' }))
        .filter((r) => r.kind && r.to_id)
    })(),
  }
}

/** Creates or updates a resource and replaces its credits, topics and relations. Returns its id. */
export async function saveResource(db: Client, id: string | null, form: FormData): Promise<string> {
  const { row, people, credits, topics, relations } = resourceFromForm(form)
  // Someone not yet in the library, typed into the form's "new person" row.
  const newName = str(form, 'new_person')
  if (newName) {
    people.push(await addPerson(db, newName, str(form, 'new_person_role')))
    credits[people.length - 1] = str(form, 'new_person_credit')
  }
  const res = id
    ? await db.from('library_resources').update(row).eq('id', id).select('id').single()
    : await db.from('library_resources').insert(row).select('id').single()
  if (res.error) {
    if (res.error.code === '23505') throw new Error(`Another resource already uses the address "${row.slug}".`)
    throw new Error(res.error.message)
  }
  const rid: string = res.data.id

  // Replace what hangs off it. Small lists, so delete and insert is simplest.
  const steps = [
    db.from('library_resource_people').delete().eq('resource_id', rid),
    db.from('library_resource_topics').delete().eq('resource_id', rid),
    db.from('library_relations').delete().eq('from_id', rid),
  ]
  for (const s of await Promise.all(steps)) if (s.error) throw new Error(s.error.message)

  const seen = new Set<string>()
  const creditRows = people
    .map((person_id, i) => ({ resource_id: rid, person_id, credit: credits[i] ?? '', sort: i }))
    .filter((c) => !seen.has(c.person_id) && seen.add(c.person_id))
  const inserts = [
    creditRows.length ? db.from('library_resource_people').insert(creditRows) : null,
    topics.length ? db.from('library_resource_topics').insert([...new Set(topics)].map((topic_id) => ({ resource_id: rid, topic_id }))) : null,
    relations.length
      ? db.from('library_relations').insert(
          relations.filter((r) => r.to_id !== rid).map((r, i) => ({ from_id: rid, to_id: r.to_id, kind: r.kind, sort: i })),
        )
      : null,
  ].filter(Boolean)
  for (const s of await Promise.all(inserts)) if (s.error) throw new Error(s.error.message)
  return rid
}

export async function deleteResource(db: Client, id: string): Promise<void> {
  const res = await db.from('library_resources').delete().eq('id', id)
  if (res.error) throw new Error(res.error.message)
}

/** Adds a person by name (the admin's "someone new" field). Returns their id. */
export async function addPerson(db: Client, name: string, role = ''): Promise<string> {
  const clean = name.trim()
  if (!clean) throw new Error('A person needs a name.')
  const base = slugify(clean) || 'person'
  for (let n = 1; n < 20; n++) {
    const slug = n === 1 ? base : `${base}-${n}`
    const res = await db.from('library_people').insert({ slug, name: clean, role }).select('id').single()
    if (!res.error) return res.data.id
    if (res.error.code !== '23505') throw new Error(res.error.message)
  }
  throw new Error('Could not find a free address for that person.')
}

/** Saves a path (a collection): its words, and its stops in order with their notes. */
export async function saveCollection(db: Client, id: string | null, form: FormData): Promise<string> {
  const title = str(form, 'title')
  if (!title) throw new Error('A path needs a title.')
  const slug = str(form, 'slug') || slugify(title)
  if (!SLUG.test(slug)) throw new Error('The address may use lowercase letters, numbers and dashes only.')
  const status = str(form, 'status') || 'draft'
  const row = { slug, title, blurb: str(form, 'blurb'), by_line: str(form, 'by_line'), time_line: str(form, 'time_line'), status, sort: int(form, 'sort') ?? 0 }
  const res = id
    ? await db.from('library_collections').update(row).eq('id', id).select('id').single()
    : await db.from('library_collections').insert(row).select('id').single()
  if (res.error) {
    if (res.error.code === '23505') throw new Error(`Another path already uses the address "${slug}".`)
    throw new Error(res.error.message)
  }
  const cid: string = res.data.id
  const del = await db.from('library_collection_items').delete().eq('collection_id', cid)
  if (del.error) throw new Error(del.error.message)
  const ids = form.getAll('stop').filter((v): v is string => typeof v === 'string' && v !== '')
  const notes = form.getAll('note').map((v) => (typeof v === 'string' ? v.trim() : ''))
  const seen = new Set<string>()
  const items = ids
    .map((resource_id, i) => ({ collection_id: cid, resource_id, note: notes[i] ?? '', sort: i }))
    .filter((s) => !seen.has(s.resource_id) && seen.add(s.resource_id))
  if (items.length) {
    const ins = await db.from('library_collection_items').insert(items)
    if (ins.error) throw new Error(ins.error.message)
  }
  return cid
}

export async function deleteCollection(db: Client, id: string): Promise<void> {
  const res = await db.from('library_collections').delete().eq('id', id)
  if (res.error) throw new Error(res.error.message)
}

/** Saves the types: their words, order, shape and whether they are shown. */
export async function saveTypes(db: Client, form: FormData): Promise<void> {
  const keys = form.getAll('key').filter((v): v is string => typeof v === 'string')
  const rows = keys.map((key, i) => ({
    key,
    label: str(form, `label:${key}`) || key,
    plural: str(form, `plural:${key}`) || key,
    action: str(form, `action:${key}`) || 'Open',
    shape: str(form, `shape:${key}`) || 'paper',
    sort: (i + 1) * 10,
    enabled: form.get(`enabled:${key}`) === 'on',
  }))
  const res = await db.from('library_types').upsert(rows)
  if (res.error) throw new Error(res.error.message)
}
