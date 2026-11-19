import type { Metadata } from 'next'
import Link from 'next/link'
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
    <>
      <section className="page-head" data-room="dark">
        <div className="container page-head__row">
          <div><h1>The team&rsquo;s desk</h1><p className="t-lede">Products, posts and orders.</p></div>
          <div className="cluster"><Link className="btn btn--solid" href="/admin/products/new/">New product</Link><Link className="btn" href="/admin/posts/new/">New post</Link></div>
        </div>
      </section>
      <section className="section" data-room="plaster">
        <div className="container stat-row">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="stat"><span className="stat__num">{s.n}</span><span className="stat__label">{s.label}</span></Link>
          ))}
        </div>
      </section>
    </>
  )
}
