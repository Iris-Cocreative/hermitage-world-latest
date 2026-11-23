'use client'
import { usePathname } from 'next/navigation'
import { ADMIN_TABS, currentAdminTab } from '@/lib/admin-nav'

/** The admin menu, the same on every admin page (the list is lib/admin-nav.ts). */
export function AdminTabs() {
  const current = currentAdminTab(usePathname())
  return (
    <nav className="tabs" aria-label="Admin">
      {ADMIN_TABS.map(([href, label]) => (
        <a key={href} className="tab" href={href} aria-current={href === current ? 'page' : undefined}>{label}</a>
      ))}
    </nav>
  )
}
