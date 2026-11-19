import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']

/** The signed-in person and their profile, or null. Cached per request. */
export const getViewer = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return { user, profile, isStaff: profile?.role === 'staff' || profile?.role === 'admin' }
})

/** Sends a visitor to sign in, remembering where they were going. */
export async function requireViewer(next: string) {
  const viewer = await getViewer()
  if (!viewer) redirect(`/sign-in/?next=${encodeURIComponent(next)}`)
  return viewer
}

export async function requireStaff(next: string) {
  const viewer = await requireViewer(next)
  if (!viewer.isStaff) redirect('/account/?denied=1')
  return viewer
}
