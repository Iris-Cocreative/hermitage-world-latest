import type { NextConfig } from "next";

/**
 * Hermitage World app.
 *
 * The static site (the repository root) is copied into public/ by
 * scripts/sync-site.mjs before every dev run and build, so one deployment
 * serves both: the pages Samuel and Garry have reviewed, and the app routes
 * (shop, account, posts, admin) built here. The site's URLs end in a slash
 * (about/, gatherings/), so the app's do too.
 */
const nextConfig: NextConfig = {
  trailingSlash: true,
  typedRoutes: false,
  // Two root layouts (the site's main.css pages and the Trellis pages), so a
  // URL that matches nothing gets app/global-not-found.tsx.
  experimental: { globalNotFound: true },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      // Only when no route and no exact public file matched: a folder URL
      // from the static site becomes its index.html, as GitHub Pages serves it.
      fallback: [
        { source: "/", destination: "/index.html" },
        { source: "/:path*", destination: "/:path*/index.html" },
      ],
    };
  },
};

export default nextConfig;
