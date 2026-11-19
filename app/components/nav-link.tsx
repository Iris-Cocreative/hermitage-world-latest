'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** A link that knows when it is the current page (or section). */
export function NavLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const pathname = usePathname()
  const current = pathname === href || (href !== '/' && pathname.startsWith(href))
  return (
    <Link href={href} className={className} aria-current={current ? 'page' : undefined}>
      {children}
    </Link>
  )
}
