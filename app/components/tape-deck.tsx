import { createClient } from '@/lib/supabase/server'
import type { LibraryData, Resource } from '@/vendor/collab-library/src/types.ts'

type Track = { fileId: string; title: string; side: 'A' | 'B' }

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** The resources that are part of this one (an album's volumes, a volume's meditations), in the editors' order. */
function partsOf(r: Resource, data: LibraryData) {
  const ids = new Set(data.relations.filter((x) => x.kind === 'part-of' && x.to_id === r.id).map((x) => x.from_id))
  return data.resources.filter((x) => ids.has(x.id)).sort((a, b) => a.sort - b.sort)
}

/**
 * What the viewer can play from this resource, as tape-deck tracks: the
 * audio files of every product they own in it. A meditation they own plays
 * alone; a volume plays the meditations on it they own; an album they own
 * plays its own files, and an album's volumes are its two sides.
 */
async function tracksFor(r: Resource, data: LibraryData): Promise<Track[]> {
  const owned: { r: Resource; side: 'A' | 'B' }[] = []
  if (r.owned && r.product_id) owned.push({ r, side: 'A' })
  else {
    partsOf(r, data).forEach((part, i) => {
      const side = r.type === 'album' && i > 0 ? 'B' : 'A'
      if (part.owned && part.product_id) owned.push({ r: part, side })
      else partsOf(part, data).forEach((x) => x.owned && x.product_id && owned.push({ r: x, side }))
    })
  }
  if (!owned.length) return []
  const supabase = await createClient()
  const { data: files } = await supabase
    .from('product_files')
    .select('id, product_id, label, sort')
    .eq('kind', 'audio')
    .in('product_id', owned.map((o) => o.r.product_id!))
    .order('sort')
  const tracks: Track[] = []
  for (const o of owned) {
    for (const f of (files ?? []).filter((x) => x.product_id === o.r.product_id)) {
      tracks.push({ fileId: f.id, title: owned.length > 1 || !f.label ? o.r.title : f.label, side: o.side })
    }
  }
  return tracks
}

/**
 * The tape deck (<hw-tape-deck>, assets/js/tape-deck.js) for a resource the
 * viewer owns something in, or nothing. Each track streams through
 * /api/media/<id>/, which checks the entitlement.
 */
export async function TapeDeck({ r, data }: { r: Resource; data: LibraryData }) {
  const tracks = await tracksFor(r, data)
  if (!tracks.length) return null
  const vol = typeof r.meta.vol === 'number' ? `Vol. ${r.meta.vol}` : r.subtitle
  const html = tracks
    .map((t) => `<audio src="/api/media/${t.fileId}/" title="${esc(t.title)}" data-side="${t.side}" preload="none"></audio>`)
    .join('')
  return (
    <section className="stack" aria-label="Play">
      <hw-tape-deck label={r.title} note={vol || undefined} dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
    </section>
  )
}
