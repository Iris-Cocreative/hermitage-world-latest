import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { Database } from './database.types'

/**
 * Per-request Supabase client that acts as the signed-in person (or as
 * nobody). Row-level security decides what it may read and write.
 *
 * Wrapped in React cache() so every server component and action within one
 * request shares one client: parallel loads each refreshing the same token
 * is how Collab OS locked everyone out on 2026-08-07. The proxy
 * (lib/supabase/proxy.ts) has already refreshed the cookies before a page
 * renders; this client only reads them.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Called from a server component: cookies are read-only there,
            // and the proxy keeps the session fresh anyway.
          }
        },
      },
    },
  )
})
