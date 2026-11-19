import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { money } from '@/lib/format'
import type { HostProduct } from '@/vendor/collab-library/src/index.ts'

/** The shop's products, for the resource form's "Product in the store". */
export async function hostProducts(): Promise<HostProduct[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('id, slug, title, subtitle, price_cents, currency, status').order('sort')
  return (data ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.subtitle ? `${p.title} (${p.subtitle})` : p.title,
    price: money(p.price_cents, p.currency),
    status: p.status,
  }))
}
