/**
 * The admin menu, in one place: the tabs every /admin page draws
 * (app/(trellis)/admin/tabs.tsx), in this order.
 */
export const ADMIN_TABS: [href: string, label: string][] = [
  ['/admin/', 'Overview'],
  ['/admin/products/', 'Products'],
  ['/admin/posts/', 'Posts'],
  ['/admin/orders/', 'Orders'],
  ['/admin/library/', 'Library'],
  ['/admin/library/paths/', 'Paths'],
  ['/admin/library/kinds/', 'Kinds'],
]

/** The current tab: the longest one the path starts with (Overview only on /admin/ itself). */
export function currentAdminTab(path: string): string | undefined {
  return ADMIN_TABS.map(([h]) => h)
    .filter((h) => (h === '/admin/' ? path === h : path.startsWith(h)))
    .sort((a, b) => b.length - a.length)[0]
}
