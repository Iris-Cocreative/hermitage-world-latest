import 'server-only'
import { headers } from 'next/headers'

function originFrom(h: { get(name: string): string | null }) {
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? (host && /^(127\.0\.0\.1|localhost)(:|$)/.test(host) ? 'http' : 'https')
  return host ? `${proto}://${host}` : null
}

/** The app's public origin, from the request's own host: for Stripe's return links and emails. */
export async function siteUrl() {
  return originFrom(await headers()) ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:4100'
}

/**
 * The origin a route handler should redirect to. Built from the Host header
 * rather than request.url, which the dev server reports as localhost even
 * when the browser came to 127.0.0.1; a host switch would leave the session
 * cookie behind.
 */
export function requestOrigin(request: Request) {
  return originFrom(request.headers) ?? new URL(request.url).origin
}

/** The public URL of an object in the covers bucket. */
export function coverUrl(path: string | null | undefined) {
  if (!path) return null
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${path}`
}
