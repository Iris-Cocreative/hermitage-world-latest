import type { Database } from '@/lib/supabase/database.types'

type ProductFile = Database['public']['Tables']['product_files']['Row']

function duration(s: number | null) {
  if (!s) return ''
  const m = Math.floor(s / 60), r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

/**
 * The files of a product someone owns. Every link goes through
 * /api/media/<id>/, which checks the entitlement and hands the browser a
 * short-lived signed URL; nothing in the private bucket is linked directly.
 */
export function ProductFiles({ files }: { files: ProductFile[] }) {
  return (
    <div className="library-item__files">
      {files.map((f) => (
        <div key={f.id} className="media-tile">
          <a className="icon-btn media-tile__play" href={`/api/media/${f.id}/`} aria-label={`Open ${f.label}`}>
            <svg className="icon" aria-hidden="true"><use href="/assets/img/icons.svg#play" /></svg>
          </a>
          <div>
            <div className="media-tile__title">{f.label}</div>
            <div className="media-tile__meta">{[f.kind, duration(f.duration_seconds)].filter(Boolean).join(' · ')}</div>
            {f.kind === 'audio' && <audio className="audio" controls preload="none" src={`/api/media/${f.id}/`} />}
          </div>
          <div className="media-tile__side">
            <a className="btn btn--sm" href={`/api/media/${f.id}/?download=1`}>Download</a>
          </div>
        </div>
      ))}
    </div>
  )
}
