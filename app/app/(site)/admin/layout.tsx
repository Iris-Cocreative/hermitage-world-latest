import { requireStaff } from '@/lib/auth'
import { AdminNav } from '@/components/admin/admin-nav'

/** Everything under /admin is for the Hermitage team (profiles.role staff or admin). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaff('/admin/')
  return (
    <>
      <div data-room="deep">
        <AdminNav />
      </div>
      {children}
    </>
  )
}
