import Link from 'next/link'
import { getViewer } from '@/lib/auth'
import { NavLink } from '@/components/nav-link'

/** The row under the site header: where the app's own pages live. */
export async function AppNav() {
  const viewer = await getViewer()
  return (
    <nav className="app-nav" aria-label="App">
      <div className="container container--wide app-nav__inner">
        <div className="cluster app-nav__links">
          <NavLink href="/shop/">Shop</NavLink>
          <NavLink href="/posts/">Posts</NavLink>
          {viewer && <NavLink href="/account/">Your library</NavLink>}
          {viewer?.isStaff && <NavLink href="/admin/">Admin</NavLink>}
        </div>
        <div className="cluster">
          {viewer ? (
            <>
              <span className="t-small t-muted">{viewer.profile?.full_name || viewer.user.email}</span>
              <form action="/auth/sign-out/" method="post">
                <button className="btn btn--sm" type="submit">Sign out</button>
              </form>
            </>
          ) : (
            <Link className="btn btn--sm" href="/sign-in/">Sign in</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
