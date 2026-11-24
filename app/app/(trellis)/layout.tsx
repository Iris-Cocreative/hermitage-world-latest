import type { Metadata, Viewport } from 'next'
import '@/vendor/trellis/core.css'
import '@/vendor/collab-library/src/library.css'
import { getViewer } from '@/lib/auth'
import { TrellisRuntime } from '@/components/trellis/runtime'

export const metadata: Metadata = {
  title: { default: 'Hermitage World', template: '%s · Hermitage World' },
  description: 'An interfaith center for meditation and spirituality. In Indianapolis and everywhere.',
  icons: { icon: '/assets/img/brand/favicon.svg' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1f1405',
}

const FONTS =
  'https://fonts.googleapis.com/css2?family=Marcellus&family=Alegreya+Sans:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Alegreya:ital@0;1&display=swap'

/**
 * The app's Trellis pages (the library first; the rest of the app and the
 * site follow). A root layout of its own, so a page wears Trellis or the
 * site's main.css, never both: moving between the two is a full page load.
 *
 * Load order: Trellis core.css, the Hermitage product layer and the site's
 * chrome (the static site's own files, served from public/), the Collab
 * Library's parts. Cascade layers keep that order whatever order the files
 * arrive in. The bar, map and footer are the static site's own custom
 * elements (assets/js/hw.js, loaded in <head> so they render in place), so
 * the site and the app share one chrome and one sitemap; data-account adds
 * the account links.
 */
export default async function TrellisLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer()
  const account = viewer ? (viewer.isStaff ? 'staff' : 'member') : 'none'
  return (
    <html lang="en" data-product="hermitage" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS} />
        <link rel="stylesheet" href="/assets/css/hermitage.css" />
        <link rel="stylesheet" href="/assets/css/chrome.css" />
        <link rel="stylesheet" href="/assets/css/tape-deck.css" />
        <script src="/assets/js/hw.js" />
        <script src="/assets/js/tape-deck.js" />
      </head>
      <body>
        <hw-bar data-account={account} dangerouslySetInnerHTML={{ __html: '' }} suppressHydrationWarning />
        <main id="main">{children}</main>
        <hw-foot dangerouslySetInnerHTML={{ __html: '' }} suppressHydrationWarning />
        <TrellisRuntime />
      </body>
    </html>
  )
}
