import { requireStaff } from '@/lib/auth'
import { NavLink } from '@/components/nav-link'

/** Everything under /admin is for the Hermitage team (profiles.role staff or admin). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaff('/admin/')
  return (
    <>
      <div data-room="deep">
        <nav className="container cluster admin-nav" aria-label="Admin">
          <NavLink href="/admin/">Overview</NavLink>
          <NavLink href="/admin/products/">Products</NavLink>
          <NavLink href="/admin/posts/">Posts</NavLink>
          <NavLink href="/admin/orders/">Orders</NavLink>
          <a href="/admin/library/">Library</a>
        </nav>
      </div>
      {children}
    </>
  )
}
