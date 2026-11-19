import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

/** Next 16's proxy (formerly middleware): keeps the Supabase session fresh. */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // Everything except Next's own assets and the static site's files.
  matcher: ['/((?!_next/static|_next/image|assets/|.*\.(?:html|svg|png|jpg|jpeg|gif|webp|ico|css|js|json|txt|woff2?)$).*)'],
}
