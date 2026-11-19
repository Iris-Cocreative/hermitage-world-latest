import { requireStaff } from '@/lib/auth'
import { AdminTabs } from './tabs'

/**
 * The library's editor, for the Hermitage team (staff and admin). The first
 * admin pages on Trellis; the rest of /admin moves here page by page.
 */
export default async function LibraryAdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaff('/admin/library/')
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
