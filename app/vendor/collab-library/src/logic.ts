/**
 * Collab Library: the pure parts. No DOM, no database, no React, so they run
 * the same on the server, in the browser and under `node --test`.
 */
import type { AccessState, LibraryData, Resource, ResourceType } from './types.ts'

/** What the viewer can do with a resource now. */
export function accessOf(r: Pick<Resource, 'product_id' | 'product_slug' | 'price_cents' | 'on_sale' | 'owned' | 'url' | 'body'>): AccessState {
  if (r.product_id) {
    if (r.owned) return 'yours'
    // The host hides a product that isn't on sale (no slug comes back), or says so.
    if (!r.product_slug || !r.on_sale) return 'soon'
    return (r.price_cents ?? 0) > 0 ? 'for-sale' : 'free'
  }
  if (r.url || r.body.trim()) return 'open'
  return 'soon'
}

/** What holds this resource (part-of, then what holds that), nearest first. */
export function holdersOf(r: Resource, data: Pick<LibraryData, 'relations' | 'resources'>): Resource[] {
  const byId = new Map(data.resources.map((x) => [x.id, x]))
  const out: Resource[] = []
  let ring = [r.id]
  while (ring.length) {
    const next: string[] = []
    for (const id of ring) {
      for (const rel of data.relations) {
        if (rel.kind !== 'part-of' || rel.from_id !== id) continue
        const h = byId.get(rel.to_id)
        if (h && h !== r && !out.includes(h)) { out.push(h); next.push(h.id) }
      }
    }
    ring = next
  }
  return out
}

/**
 * What the viewer can do with a resource, and the resource that offer comes
 * through. One with no product of its own takes it from what holds it: a
 * volume on an album you own is yours, and one on an album for sale is had
 * by buying the album.
 */
export function accessVia(r: Resource, data: Pick<LibraryData, 'relations' | 'resources'>): { access: AccessState; via?: Resource } {
  if (r.product_id) return { access: accessOf(r) }
  const holders = holdersOf(r, data).filter((h) => h.product_id)
  const owned = holders.find((h) => h.owned)
  if (owned) return { access: 'yours', via: owned }
  const own = accessOf(r)
  if (own === 'open') return { access: own }
  for (const h of holders) {
    const a = accessOf(h)
    if (a === 'free' || a === 'for-sale') return { access: a, via: h }
  }
  return { access: own }
}

export const ACCESS_LABEL: Record<AccessState, string> = {
  yours: 'Yours',
  free: 'Free',
  'for-sale': 'For sale',
  open: 'Open',
  soon: 'Coming',
}

/** Folds case and accents, so "Hooponopono" finds "Ho’oponopono". */
export function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`]/g, '')
    .toLowerCase()
}

export interface Filters {
  q: string
  types: string[]
  topics: string[]
  access: AccessState[]
}

export const NO_FILTERS: Filters = { q: '', types: [], topics: [], access: [] }

/** The words a resource can be found by. */
export function haystack(r: Resource, data: Pick<LibraryData, 'topics' | 'types'>): string {
  const type = data.types.find((t) => t.key === r.type)
  const topics = r.topics.map((id) => data.topics.find((t) => t.id === id)?.name ?? '')
  const people = r.credits.map((c) => `${c.person.name} ${c.person.short_name}`)
  return fold([r.title, r.subtitle, r.blurb, type?.label ?? '', type?.plural ?? '', ...topics, ...people].join(' '))
}

/**
 * Every word of the query must appear somewhere (in any order); within a
 * facet any chosen value matches, and facets combine with AND.
 */
export function matches(r: Resource, f: Filters, hay: string, access: AccessState = accessOf(r)): boolean {
  if (f.types.length && !f.types.includes(r.type)) return false
  if (f.topics.length && !f.topics.some((id) => r.topics.includes(id))) return false
  if (f.access.length && !f.access.includes(access)) return false
  const words = fold(f.q).split(/\s+/).filter(Boolean)
  return words.every((w) => hay.includes(w))
}

/** Title hits first, then the rest in the editors' order. */
export function rank(list: Resource[], q: string): Resource[] {
  const words = fold(q).split(/\s+/).filter(Boolean)
  if (!words.length) return list
  const score = (r: Resource) => words.filter((w) => fold(r.title).includes(w)).length
  return [...list].sort((a, b) => score(b) - score(a) || a.sort - b.sort)
}

/** The enabled types that hold at least one of these resources, in the editors' order. */
export function shelves(types: ResourceType[], list: Resource[]): { type: ResourceType; items: Resource[] }[] {
  return types
    .filter((t) => t.enabled)
    .sort((a, b) => a.sort - b.sort)
    .map((type) => ({ type, items: list.filter((r) => r.type === type.key).sort((a, b) => a.sort - b.sort) }))
    .filter((s) => s.items.length > 0)
}

export interface Related {
  label: string
  items: Resource[]
}

/** A resource's relations, read from both ends and grouped by their label. */
export function relatedOf(r: Resource, data: Pick<LibraryData, 'relations' | 'kinds' | 'resources'>): Related[] {
  const byId = new Map(data.resources.map((x) => [x.id, x]))
  const groups = new Map<string, { sort: number; items: Resource[] }>()
  const add = (label: string, sort: number, other: Resource | undefined) => {
    if (!other) return
    const g = groups.get(label) ?? { sort, items: [] }
    if (!g.items.includes(other)) g.items.push(other)
    groups.set(label, g)
  }
  for (const rel of data.relations) {
    const kind = data.kinds.find((k) => k.key === rel.kind)
    if (!kind) continue
    if (rel.from_id === r.id) add(kind.out_label, kind.sort, byId.get(rel.to_id))
    else if (rel.to_id === r.id) add(kind.in_label, kind.sort + 0.5, byId.get(rel.from_id))
  }
  return [...groups.entries()]
    .sort((a, b) => a[1].sort - b[1].sort)
    .map(([label, g]) => ({ label, items: g.items }))
}

/** "Friar Justin, Mary Wild (harp)" */
export function creditLine(r: Pick<Resource, 'credits'>, short = false): string {
  return r.credits
    .map((c) => (short && c.person.short_name ? c.person.short_name : c.person.name) + (c.credit ? ` (${c.credit})` : ''))
    .join(', ')
}

/** A stable number from a string, for drawings that should look the same every visit. */
export function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Bar heights (0–1) for a resource's waveform: seeded by its slug, so it never changes. */
export function waveOf(slug: string, n = 24): number[] {
  let x = hash(slug) || 1
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    x >>>= 0
    const env = Math.sin(((i + 0.5) / n) * Math.PI) // louder in the middle
    out.push(Math.round((0.25 + 0.75 * env * ((x % 1000) / 1000)) * 4) / 4)
  }
  return out
}

/** "1 h 5 min", "12 min" */
export function duration(minutes: number | null): string {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`
}
