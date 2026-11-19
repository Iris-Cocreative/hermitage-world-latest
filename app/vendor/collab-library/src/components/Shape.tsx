/**
 * A resource drawn as the thing it is: a book stands as a spine, an album is a
 * sleeve with its record behind it, a practice is an arch with a breath in it.
 * No hooks, so it renders on the server and inside the client library alike.
 * Sizes and colors live in library.css; the only inline styles are variables.
 */
import type { CSSProperties } from 'react'
import type { AccessState, Resource, ResourceType, Topic } from '../types.ts'
import { ACCESS_LABEL, creditLine, duration, waveOf } from '../logic.ts'

type Vars = CSSProperties & Record<`--${string}`, string | number>

export function hueOf(r: Resource, topics: Topic[]): string | undefined {
  for (const id of r.topics) {
    const t = topics.find((x) => x.id === id)
    if (t?.color) return t.color
  }
  return undefined
}

export function Shape({ r, type, topics, access, count, big = false }: {
  r: Resource
  type: ResourceType | undefined
  topics: Topic[]
  access: AccessState
  /** For a stack: how many things it holds. */
  count?: number
  /** The detail view's larger drawing. */
  big?: boolean
}) {
  const shape = type?.shape ?? 'paper'
  const hue = hueOf(r, topics)
  const style: Vars = {}
  if (hue) style['--clib-hue'] = hue
  // A book's spine is as thick as the book: meta.thick 1–3, from the catalog.
  if (shape === 'book' && typeof r.meta.thick === 'number') style['--clib-thick'] = r.meta.thick
  const by = creditLine(r, true)
  const len = duration(r.minutes)
  const kick = type?.label ?? r.type
  const cover = r.cover_url && ['album', 'video', 'article', 'paper', 'course'].includes(shape) ? r.cover_url : null

  return (
    <span className="clib-obj" data-shape={shape} data-access={access} data-big={big || undefined} style={style}>
      {shape === 'album' && <span className="clib-disc" aria-hidden="true" />}
      <span className="clib-obj-body" aria-hidden="true">
        {access !== 'open' && (
          <span className="clib-obj-tab t-xs">{ACCESS_LABEL[access]}</span>
        )}
        {cover && <img className="clib-obj-cover" src={cover} alt="" loading="lazy" />}
        {shape === 'book' && (
          <>
            <span className="clib-spine-title">{r.title}</span>
            {by && <span className="clib-spine-by">{by}</span>}
          </>
        )}
        {shape === 'album' && !cover && <span className="clib-obj-title t-h6">{r.title}</span>}
        {shape === 'audio' && (
          <>
            <span className="clib-obj-kick t-label">{kick}</span>
            <span className="clib-wave">
              {waveOf(r.slug).map((h, i) => (
                <i key={i} style={{ '--h': h } as Vars} />
              ))}
            </span>
            <span className="clib-obj-meta t-xs">{len || r.subtitle}</span>
          </>
        )}
        {shape === 'video' && (
          <>
            <span className="clib-play" />
            {len && <span className="clib-obj-meta t-xs">{len}</span>}
          </>
        )}
        {shape === 'course' && (
          <>
            <span className="clib-obj-kick t-label">{kick}</span>
            {!cover && <span className="clib-obj-title t-h6">{r.title}</span>}
            <span className="clib-ticks">
              {Array.from({ length: Math.min(8, Math.max(3, Number(r.meta.sessions) || 6)) }, (_, i) => <i key={i} />)}
            </span>
          </>
        )}
        {shape === 'practice' && (
          <>
            <span className="clib-breath"><i /><i /><i /></span>
            {len && <span className="clib-obj-meta t-xs">{len}</span>}
          </>
        )}
        {shape === 'article' && (
          <>
            <span className="clib-obj-kick t-label">{kick}</span>
            {!cover && <span className="clib-obj-title t-h6">{r.title}</span>}
            {!cover && r.blurb && <span className="clib-obj-excerpt t-xs u-clamp">{r.blurb}</span>}
          </>
        )}
        {shape === 'stack' && (
          <>
            <span className="clib-stack-n t-h2">{count ?? ''}</span>
            <span className="clib-obj-title t-h6">{r.title}</span>
          </>
        )}
        {shape === 'paper' && (
          <>
            <span className="clib-obj-kick t-label">{kick}</span>
            {!cover && <span className="clib-obj-title t-h6">{r.title}</span>}
            {!cover && <span className="clib-lines"><i /><i /><i /><i /></span>}
          </>
        )}
      </span>
      {!big && (
        <span className="clib-obj-cap">
          <span className="clib-obj-name t-sm u-clamp">{r.title}</span>
          {(by || r.subtitle) && <span className="clib-obj-by t-xs u-text-secondary u-truncate">{by || r.subtitle}</span>}
        </span>
      )}
    </span>
  )
}
