import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the Supabase session on every matched request and forwards the
 * rotated cookies to the browser (the @supabase/ssr pattern, as Collab OS
 * runs it). Two guards from that app's 2026-08-07 lockout: a browser with
 * no auth cookie skips Supabase entirely, and a dead refresh token is
 * cleared so it fails once instead of forever.
 */
function isAuthCookie(name: string) {
  return name.startsWith('sb-') && name.includes('-auth-token')
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (!request.cookies.getAll().some((c) => isAuthCookie(c.name))) return response

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  // Nothing may run between creating the client and getUser(): that is the
  // call that refreshes the session.
  const { error } = await supabase.auth.getUser()

  if (error && (error.code === 'refresh_token_not_found' || error.code === 'refresh_token_already_used' || /refresh token/i.test(error.message))) {
    for (const c of request.cookies.getAll()) {
      if (isAuthCookie(c.name)) response.cookies.set(c.name, '', { maxAge: 0, path: '/' })
    }
  }

  return response
}
