'use client'
import { usePathname } from 'next/navigation'
import { ADMIN_TABS, currentAdminTab } from '@/lib/admin-nav'

// Overview, Products, Posts and Orders are still on the site's main.css (a
// full page load away); the library's three are here. The list is shared
// with the main.css admin (components/admin/admin-nav.tsx).
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
