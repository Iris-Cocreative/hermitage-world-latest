import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminHome() {
  const supabase = await createClient()
  const count = async (table: 'products' | 'posts' | 'orders' | 'profiles', filter?: [string, string]) => {
    let q = supabase.from(table).select('id', { count: 'exact', head: true })
    if (filter) q = q.eq(filter[0], filter[1])
    return (await q).count ?? 0
  }
  const [active, drafts, published, paid, members] = await Promise.all([
    count('products', ['status', 'active']), count('products', ['status', 'draft']), count('posts', ['status', 'published']), count('orders', ['status', 'paid']), count('profiles'),
  ])
  const stats = [
    { n: active, label: 'products on sale', href: '/admin/products/' },
    { n: drafts, label: 'draft products', href: '/admin/products/' },
    { n: published, label: 'published posts', href: '/admin/posts/' },
    { n: paid, label: 'paid orders', href: '/admin/orders/' },
    { n: members, label: 'people with an account', href: '/admin/orders/' },
  ]
  return (
    <div className="stack">
      <div className="hw-admin-head">
        <div className="stack hw-page-head">
          <h1 className="t-h2">The team&rsquo;s desk</h1>
          <p className="t-body u-text-secondary">Products, posts and orders.</p>
        </div>
        <div className="cluster">
          <a className="button cc-primary" href="/admin/products/new/"><span className="button-label">New product</span></a>
          <a className="button" href="/admin/posts/new/"><span className="button-label">New post</span></a>
        </div>
      </div>
      <div className="grid">
        {stats.map((s) => (
          <a key={s.label} href={s.href} className="card stack hw-admin-stat">
            <span className="t-h2">{s.n}</span>
            <span className="t-sm u-text-secondary">{s.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
