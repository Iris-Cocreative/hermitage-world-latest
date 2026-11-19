'use client'
import { usePathname } from 'next/navigation'

// Overview, Products, Posts and Orders are still on the site's main.css (a
// full page load away); the library's three are here.
const TABS: [string, string][] = [
  ['/admin/', 'Overview'],
  ['/admin/products/', 'Products'],
  ['/admin/posts/', 'Posts'],
  ['/admin/orders/', 'Orders'],
  ['/admin/library/', 'Library'],
  ['/admin/library/paths/', 'Paths'],
  ['/admin/library/kinds/', 'Kinds'],
]

export function AdminTabs() {
  const path = usePathname()
  // The longest tab that the path starts with is the current one.
  const current = TABS.map(([h]) => h)
    .filter((h) => (h === '/admin/' ? path === h : path.startsWith(h)))
    .sort((a, b) => b.length - a.length)[0]
  return (
    <nav className="tabs" aria-label="Admin">
      {TABS.map(([href, label]) => (
        <a key={href} className="tab" href={href} aria-current={href === current ? 'page' : undefined}>{label}</a>
      ))}
    </nav>
  )
}
