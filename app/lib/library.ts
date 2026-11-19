import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { renderMarkdown } from '@/lib/markdown'
import { money } from '@/lib/format'
import { loadLibrary, type LibraryData, type LibraryHost, type LibraryProps } from '@/vendor/collab-library/src/index.ts'

/**
 * The Hermitage as a Collab Library host: where the library hands off to the
 * shop, the account and sign-in. The contract's database side is
 * supabase/migrations/0003_library_host.sql.
 */
export const LIBRARY_BASE = '/library/'

/** The library as a visitor sees it: published only. Cached per request. */
export const getLibrary = cache(async (): Promise<LibraryData> => loadLibrary(await createClient()))

/** The library as the editor works on it: drafts and archived too. */
export const getLibraryForEditing = cache(async (): Promise<LibraryData> => loadLibrary(await createClient(), { drafts: true }))

export const FACET_LABELS = { occasion: 'When' }

/** Who may see a resource: what library_can_see() knows here. Membership comes later. */
export const AUDIENCES: [string, string][] = [
  ['public', 'Everyone'],
  ['signed_in', 'Anyone signed in'],
]

export function libraryHost(signedIn: boolean): LibraryHost {
  return {
    base: LIBRARY_BASE,
    productHref: (slug) => `/shop/${slug}/`,
    ownedHref: '/account/',
    signInHref: (next) => `/sign-in/?next=${encodeURIComponent(next)}`,
    signedIn,
    money,
  }
}

/** The same host for the client component, as plain data. */
export function clientHost(signedIn: boolean): LibraryProps['host'] {
  return {
    base: LIBRARY_BASE,
    productPattern: '/shop/{slug}/',
    signInPattern: '/sign-in/?next={next}',
    ownedHref: '/account/',
    signedIn,
  }
}

/** Markdown bodies rendered on the server (raw HTML off), by resource id. */
export function bodiesOf(data: LibraryData): Record<string, string> {
  return Object.fromEntries(data.resources.filter((r) => r.body.trim()).map((r) => [r.id, renderMarkdown(r.body)]))
}
