'use client'
import { useEffect } from 'react'

/**
 * Trellis's runtime, once per page (REACT.md rule 4). The chrome's own
 * behavior (opening the map) lives in the site's hw.js.
 */
export function TrellisRuntime() {
  useEffect(() => {
    // @ts-expect-error settle.js is a plain script (an IIFE that sets window.Trellis), not a module
    import('@/vendor/trellis/settle.js')
  }, [])
  return null
}
