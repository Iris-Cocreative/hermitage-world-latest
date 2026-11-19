'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Uploaded = { name: string; size: number; type: string }

/**
 * Sends a file straight from the browser to Supabase Storage under the
 * staff member's own session (the bucket policies allow staff writes), then
 * tells the server which path landed through the bound action it was given.
 * Large audio and video never pass through the app server this way.
 */
export function Uploader({ bucket, prefix, accept, label, multiple, onUploaded }: {
  bucket: 'covers' | 'media'
  prefix: string
  accept?: string
  label: string
  multiple?: boolean
  onUploaded: (path: string, file: Uploaded) => Promise<void>
}) {
  const router = useRouter()
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target
    const files = Array.from(input.files ?? [])
    if (!files.length) return
    setBusy(true)
    const supabase = createClient()
    let n = 0
    for (const file of files) {
      const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '')
      const path = `${prefix}/${Date.now()}-${safe}`
      setStatus(`Uploading ${file.name}${files.length > 1 ? ` (${n + 1} of ${files.length})` : ''}…`)
      const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type || undefined, upsert: false })
      if (error) {
        setStatus(`${file.name}: ${error.message}`)
        setBusy(false)
        return
      }
      try {
        await onUploaded(path, { name: file.name, size: file.size, type: file.type })
      } catch (err) {
        setStatus(`${file.name} uploaded, but saving it failed: ${err instanceof Error ? err.message : String(err)}`)
        setBusy(false)
        return
      }
      n++
    }
    setStatus(n === 1 ? 'Uploaded.' : `${n} files uploaded.`)
    setBusy(false)
    input.value = ''
    router.refresh()
  }

  return (
    <div className="uploader">
      <label className={`btn btn--sm${busy ? ' is-done' : ''}`}>
        {busy ? 'Working…' : label}
        <input className="sr-only" type="file" accept={accept} multiple={multiple} disabled={busy} onChange={onChange} />
      </label>
      {status && <span className="uploader__status" role="status">{status}</span>}
    </div>
  )
}
