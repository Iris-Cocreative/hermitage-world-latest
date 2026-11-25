import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'
import { GATE_COOKIE, GATE_PATH, gateExempt, gateKey } from '@/lib/gate'

/**
 * Next 16's proxy (formerly middleware): the preview gate first, while
 * SITE_PASSWORD is set, then keeps the Supabase session fresh.
 */
export async function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD
  const { pathname, search } = request.nextUrl
  if (password && !gateExempt(pathname) && request.cookies.get(GATE_COOKIE)?.value !== (await gateKey(password))) {
    const url = request.nextUrl.clone()
    url.pathname = GATE_PATH
    url.search = ''
    url.searchParams.set('next', pathname + search)
    return NextResponse.redirect(url)
  }
  return await updateSession(request)
}

export const config = {
  // Everything except Next's own assets and the static site's files. The
  // static site's pages (.html) are matched, so the gate covers them too.
  matcher: ['/((?!_next/static|_next/image|assets/|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|json|txt|woff2?|mp3|m4a|wav)$).*)'],
}
