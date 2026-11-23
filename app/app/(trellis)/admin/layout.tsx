import { requireStaff } from '@/lib/auth'
import { AdminTabs } from './tabs'

/**
 * Everything under /admin, for the Hermitage team (profiles.role staff or
 * admin): Overview, products, posts, orders and the library's editor, all on
 * Trellis, under one menu.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaff('/admin/')
  return (
    <>
      <div className="hw-admin-nav hw-deep" data-product="hermitage" data-theme="dark">
        <div className="frame">
          <AdminTabs />
        </div>
      </div>
      <div className="frame hw-page">{children}</div>
    </>
  )
}
