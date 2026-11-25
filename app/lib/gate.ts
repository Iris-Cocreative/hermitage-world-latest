/**
 * The preview gate: one shared password in front of the whole site until
 * launch. It is on only while SITE_PASSWORD is set (Vercel's environment
 * variables); delete that variable at launch and the site is open. Local
 * development leaves it unset.
 *
 * The cookie holds a hash of the password, not the password, so changing
 * the password signs everyone out of the gate.
 */
export const GATE_PATH = '/gate/'
export const GATE_COOKIE = 'hw-gate'

export async function gateKey(password: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`hw-gate:${password}`))
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Paths the gate never stops: the gate itself, and Stripe calling back. */
export function gateExempt(path: string) {
  return path.startsWith(GATE_PATH) || path.startsWith('/api/stripe/')
}
