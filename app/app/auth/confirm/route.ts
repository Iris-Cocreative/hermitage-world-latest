import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeNext } from '@/lib/format'
import { requestOrigin } from '@/lib/site'

/**
 * Where a sign-in email lands. Two shapes arrive: token_hash + type (from a
 * customized template) or a PKCE code (Supabase's default templates verify
 * first, then redirect here). Mail scanners that prefetch links burn
 * single-use tokens, so an expired link is the ordinary failure and gets a
 * plain explanation on the sign-in page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = requestOrigin(request)
  const next = safeNext(searchParams.get('next'))
  const fail = (message: string) => {
    const p = new URLSearchParams({ error: message, next })
    if (/expired|invalid|otp/i.test(message)) p.set('code', 'expired_link')
    return NextResponse.redirect(new URL(`/sign-in/?${p}`, origin))
  }

  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const supabase = await createClient()

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    return error ? fail(error.message) : NextResponse.redirect(new URL(next, origin))
  }
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    return error ? fail(error.message) : NextResponse.redirect(new URL(next, origin))
  }
  return fail(searchParams.get('error_description') ?? searchParams.get('error') ?? 'This sign-in link is invalid or has expired')
}
