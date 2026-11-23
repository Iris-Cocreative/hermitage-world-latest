# Hermitage World: project instructions

Own repo: `Iris-Cocreative/hermitage-world` (public). GitHub Pages serves `main` at https://iris-cocreative.github.io/hermitage-world/. Push to deploy. `HERMITAGE-WORLD-BUILD.md` is the source of truth for status, decisions and open questions; update it when something changes.

## Working rules

- **Static, no build step, on Trellis.** Plain HTML, CSS and JS. Every page is `folder/index.html` on the skeleton in `docs/TRELLIS-PAGE-MOVE.md`: Trellis `assets/vendor/trellis/core.css` (pinned by `app/scripts/vendor.mjs`), the product layer `assets/css/hermitage.css`, `assets/css/chrome.css`, `assets/css/site.css`, an optional `assets/css/pages/<section>.css`, then `settle.js` (deferred) and `assets/js/hw.js` (in `<head>`, not deferred, so `<hw-bar>`, `<hw-letter>` and `<hw-foot>` render in place). `main.css` and `site.js` remain only for `archive/`, `drafts/`, the old `design-system/` page, the `library/` prototype and the app's `(site)` pages.
- **The one exception is `app/`**: the Next.js app (accounts, shop, library, posts, admin) with its own `CLAUDE.md`-level notes in `app/README.md`. It serves the static site unchanged from `public/` (a copy made by `app/scripts/sync-site.mjs`). Its pages under `app/(site)/` wear the site's `main.css` and `site.js` (styles in `assets/css/app.css`); its pages under `app/(trellis)/` are on Trellis. Never edit `app/public/` or `app/vendor/`.
- **Trellis first.** Before writing or changing any CSS, markup or mockup, use the `trellis` skill: Trellis primitives and tokens, no raw values. The product layer is `assets/css/hermitage.css` (knobs only; check it with `node ../trellis/tests/contract.js assets/css/hermitage.css`); gaps go in `TRELLIS-LEDGER.md`.
- **The library is Collab Library**, its own repository (`../collab-library`). Change it there, commit, then `cd app && npm run vendor`. The Hermitage's side of its contract is `app/supabase/migrations/0003_library_host.sql` and `app/lib/library.ts`.
- **Relative paths only.** The site lives under `/hermitage-world/` today and will move to a custom domain. `hw.js` resolves every generated link from its own URL. The one exception is `404.html`, which needs absolute `/hermitage-world/` paths and must be updated at the domain move.
- **Stamp assets before pushing.** Pages link the site's CSS and JS with `?v=<stamp>` so a deploy never shows with a stale stylesheet from the browser cache (Pages sends max-age=600). After changing anything under `assets/`, run `node tools/stamp-assets.mjs` and commit the pages with it.
- **Design system first.** Never hardcode a color, size or space: Trellis tokens and cells only (`docs/TRELLIS-MIGRATION.md` maps every old class). A dark section is a Trellis scope, `data-product="hermitage" data-theme="dark"` (`hw-deep` for the sunken ground); `data-room` colors nothing. Anything used twice belongs in `site.css` (shown at `design-system/trellis/`); one section's own parts go in `assets/css/pages/<section>.css`. Run `node ../trellis/tools/check.js` on what you changed.
- **Site Editor markers.** Words and photos the team edits carry `data-edit="text|rich|link|image"` (rules in `docs/TRELLIS-PAGE-MOVE.md`: nothing with a class or span inside a marked area, so a marked button has no `.button-label`). Mark new headings, paragraphs, buttons and photos as you add them.
- **Sitemap in one place.** Add or rename pages in `SITE` in `assets/js/hw.js`; the bar, the map and the footer follow, on the static pages and the app's Trellis pages alike. (`site.js` keeps a frozen copy for the old pages.)
- **Content that a CMS will own** lives in `assets/data/*.js` (gatherings, library). Keep the fields CMS-shaped.
- **Honesty.** Never invent facts, quotes, times, prices or names. Unknowns get a `<span class="hw-draft-mark">…</span>`; missing images get an `.hw-pending` frame naming the asset and its source. Quote Friar Justin only from sources (Collab OS docs, his books, the obituary).
- **Brand.** Marcellus (one weight, never bold) for display, Alegreya Sans for body, Alegreya italic only for a person's voice. Gold is the only interactive accent; glass colors (amber, blue, verdigris, madder) are light, never UI. Calm motion; everything respects `prefers-reduced-motion`.
- **American English** in copy and comments.
- After changes, check pages over http at 1440 and 390 wide: no console errors, no horizontal overflow.
- App work: `cd app`, Node from the workspace's `.tools/node` (prepend it to PATH), `npm run db:start` (local Supabase on ports 544xx, Docker) then `npm run dev` (http://127.0.0.1:4100). Schema changes are new files in `app/supabase/migrations/` followed by `npm run db:reset` and `npm run db:types`. Secrets live only in `app/.env.local`.

## Sources

- Figma `lLDFhmwK4zbTuREtOc6sRC`, page **Website** (`71:114`). Newest frames: `282:2`, `282:8`, `282:15` (hero beats) and `282:32` (full homepage).
- Collab OS: https://www.collab-os.com/collaboration/hermatage-world (Surface = the living sitemap with client notes; docs "Meditation", "Justin obituary", "History of the Hermi…").
- `docs/PRODUCT.md`, `docs/BRAND-GUIDELINES.md`.
