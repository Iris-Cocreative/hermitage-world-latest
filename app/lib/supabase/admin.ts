import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * The server's own client, with the secret key. It BYPASSES row-level
 * security, so it is used only where the server itself is the actor:
 * the Stripe webhook, starting a checkout, signing a media URL after an
 * entitlement check, and scripts. Never import it from a client component.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
