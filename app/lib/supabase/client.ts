import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

/** The browser's Supabase client: sign-in forms and direct uploads to storage. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
