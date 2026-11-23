'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ADMIN_TABS, currentAdminTab } from '@/lib/admin-nav'

/**
 * The admin menu on the pages still on main.css: the same tabs as the
 * library's Trellis admin. The library's pages are a different root layout,
 * so they are plain links (a full page load); the rest are client links.
 */
export function AdminNav() {
  const current = currentAdminTab(usePathname())
  return (
    <nav className="container cluster admin-nav" aria-label="Admin">
      {ADMIN_TABS.map(([href, label]) => {
        const props = { href, 'aria-current': href === current ? ('page' as const) : undefined }
        return href.startsWith('/admin/library/') ? <a key={href} {...props}>{label}</a> : <Link key={href} {...props}>{label}</Link>
      })}
    </nav>
  )
}
