import type { Metadata, Viewport } from 'next'
import { AppNav } from '@/components/app-nav'

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
 * Every app page wears the site's own chrome. main.css and site.js are the
 * static site's files, served from public/ (scripts/sync-site.mjs), so the
 * app and the site are one design system with one header and one footer.
 * site.js is loaded synchronously in <head>, as on every static page, so
 * <hw-header> renders in place with no flash.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS} />
        <link rel="stylesheet" href="/assets/css/main.css" />
        <link rel="stylesheet" href="/assets/css/app.css" />
        <script src="/assets/js/site.js" />
      </head>
      <body>
        <hw-header dangerouslySetInnerHTML={{ __html: '' }} suppressHydrationWarning />
        <main id="main">
          <AppNav />
          {children}
        </main>
        <hw-footer dangerouslySetInnerHTML={{ __html: '' }} suppressHydrationWarning />
      </body>
    </html>
  )
}
