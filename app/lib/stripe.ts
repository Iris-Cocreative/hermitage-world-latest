import 'server-only'
import Stripe from 'stripe'

let client: Stripe | null = null

/** One Stripe client per server process. The key is a restricted key (rk_…), never in code. */
export function stripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set (see .env.example)')
    client = new Stripe(key, { appInfo: { name: 'Hermitage World app', url: 'https://hermitageworld.org' } })
  }
  return client
}
