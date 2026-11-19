import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Not found · Hermitage World' }

/**
 * The 404 for a URL that matches nothing: the app has two root layouts (the
 * site's and Trellis's), so this one brings its own document. It wears the
 * site's main.css and site.js, like the static pages around it.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Marcellus&family=Alegreya+Sans:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Alegreya:ital@0;1&display=swap" />
        <link rel="stylesheet" href="/assets/css/main.css" />
        <script src="/assets/js/site.js" />
      </head>
      <body>
        <hw-header dangerouslySetInnerHTML={{ __html: '' }} suppressHydrationWarning />
        <main id="main">
          <section className="section" data-room="dark">
            <div className="container container--narrow stack stack--lg">
              <h1 className="t-h2">This door leads nowhere, yet.</h1>
              <p className="t-lede">The page you were looking for isn&rsquo;t here. The map behind the sun button lists every room of the site.</p>
              <div className="cluster">
                <a className="btn btn--solid" href="/">Home</a>
                <a className="btn" href="/library/">The Library</a>
              </div>
            </div>
          </section>
        </main>
        <hw-footer dangerouslySetInnerHTML={{ __html: '' }} suppressHydrationWarning />
      </body>
    </html>
  )
}
