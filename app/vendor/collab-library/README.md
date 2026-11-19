# Collab Library

A resource library for Iris Cocreative's client apps: shelves of shaped objects, a catalog, and paths through it, with an editor for the team. Each client installs it into **its own Supabase** (one database per client) and draws it with **Trellis**. Hermitage World is the first client; Holos follows.

It sells nothing itself. A resource may point at one of the host's products, and the host says what that product costs and whether the viewer owns it. So the library and the store are one place to browse: a priced item shows Buy and goes through the host's own checkout.

## What's here

| Path | What it is |
|---|---|
| `migrations/0001_collab_library.sql` | The schema: `library_types`, `library_people`, `library_topics`, `library_resources` (+ their people, topics and relations), `library_collections` (paths) and the `library_catalog` view. Row-level security throughout. Every name starts with `library_`, so it sits in `public` beside the host's tables. |
| `src/types.ts` | The data as the components see it, and `LibraryHost`, the links the library hands to the host. |
| `src/logic.ts` | The pure parts: access state, search (folds case, accents and apostrophes), filters, ranking, shelves, relations read both ways. No DOM, no database. |
| `src/data.ts` | `loadLibrary(db)` reads everything in one go through the host's Supabase client, as the viewer. `saveResource`, `saveCollection`, `saveTypes`, `addPerson`, `deleteResource`, `deleteCollection` write it. |
| `src/components/` | `Library` (client: search, filters, shelves, catalog, paths, the dialog), `Detail` (one resource, server-safe, for the dialog and the resource's own page), `Shape` (a resource drawn as the thing it is). |
| `src/admin/forms.tsx` | `ResourceForm`, `CollectionForm`, `TypesForm`: server components that post to the host's own server actions. They work before any script loads. |
| `src/library.css` | The library's own parts, on Trellis: the shapes, the shelf, the room. Tokens and cells only. |
| `tests/` | `npm test` (Node 24 runs the TypeScript directly). |

## Installing it in a client app

The app pins a copy, as Trellis asks: `vendor/collab-library/` with a `SOURCE.txt` naming the commit, and the schema copied into the app's migrations. Hermitage World's `app/scripts/vendor.mjs` does both (`npm run vendor`).

1. **Schema.** The copied `0001_collab_library.sql`, then the host's own migration after it that replaces the three contract functions (same signatures, `create or replace`):

   | Function | Default | The host says |
   |---|---|---|
   | `library_is_editor()` | nobody | who may write the library (Hermitage: `is_staff()`) |
   | `library_can_see(audience text)` | `public` everyone, `signed_in` anyone signed in, else nobody | who sees a resource of each audience (Holos: members, a holon, a course) |
   | `library_offer(product uuid)` | no products | the product's slug, price, currency, whether it's on sale, whether the viewer owns it. Run as the viewer, so the host's product policies apply |

   The host may also add a foreign key from `library_resources.product_id` to its products table, and set its own types (rename, reshape, switch off; add its own keys).

2. **Styles.** Trellis `core.css`, the product layer, then `src/library.css`. Every rule is in `@layer clib`, declared after `trellis`.

3. **Pages.** A library page loads the data on the server and renders the client component:

   ```tsx
   import { Library, loadLibrary } from '@/vendor/collab-library/src/index.ts'
   const data = await loadLibrary(supabase)
   <Library data={data} host={{ base: '/library/', productPattern: '/shop/{slug}/', signInPattern: '/sign-in/?next={next}', ownedHref: '/account/', signedIn }} bodies={renderedBodies} facetLabels={{ occasion: 'When' }} />
   ```

   A resource's own page (`/library/<slug>/`) renders `<Detail headingLevel={1} />` on the server, so every resource has an address. The admin pages render the forms with the host's server actions, which check the editor and call `saveResource` and the rest.

The host imports TypeScript straight from the vendored `src/` (imports carry their `.ts` extension, so the app's `tsconfig` needs `allowImportingTsExtensions`).

## Rules

- **Trellis first.** Every new part is built from Trellis primitives; the library's own CSS follows the five rules (no raw values; whole cells between blocks; context changes variables; inline styles set variables only). Gaps go in `TRELLIS-LEDGER.md`.
- **Honest states.** A resource whose product isn't on sale reads "Coming", never a price that can't be paid. Nothing in the library invents a duration, a price or a name.
- **Client-agnostic.** No client's words, colors or routes in `src/`. What differs per client is data (types, topics), the contract functions, and the `LibraryHost` links.

Status and decisions: `COLLAB-LIBRARY-BUILD.md`.
