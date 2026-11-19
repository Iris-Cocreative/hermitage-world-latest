import Link from 'next/link'

type Crumb = { href: string; label: string }

/** The site's inner-page top (a dark room with an arch outline), for the app's public pages. */
export function PageHero({ title, lede, crumbs, media, children }: {
  title: string; lede?: string; crumbs?: Crumb[]; media?: React.ReactNode; children?: React.ReactNode
}) {
  return (
    <section className={`page-hero${media ? ' page-hero--media product-hero' : ''}`} data-room="dark">
      <div className="room-arch" aria-hidden="true"></div>
      <div className="container page-hero__inner">
        <div>
          {crumbs && crumbs.length > 0 && (
            <nav className="breadcrumb" aria-label="Breadcrumb">
              {crumbs.map((c, i) => (
                <span key={c.href}>
                  {i > 0 && <span aria-hidden="true">· </span>}
                  <Link href={c.href}>{c.label}</Link>
                </span>
              ))}
            </nav>
          )}
          <h1>{title}</h1>
          {lede && <p className="t-lede">{lede}</p>}
          {children && <div className="page-hero__actions">{children}</div>}
        </div>
        {media && <div className="page-hero__media">{media}</div>}
      </div>
    </section>
  )
}
