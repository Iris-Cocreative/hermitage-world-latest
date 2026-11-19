# Moving a page onto Trellis

How each page of the static site moves from `main.css` + `site.js` onto Trellis, with the Site Editor's markers added in the same pass. The class-by-class mapping (old class → Trellis primitive or `hw-` component) is `docs/TRELLIS-MIGRATION.md`; the shared components are in `assets/css/site.css`, shown at `design-system/trellis/`.

## The page's skeleton

Paths are relative (`../` per level). A page one level deep:

```html
<!DOCTYPE html>
<html lang="en" data-product="hermitage">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>…unchanged…</title>
<meta name="description" content="…unchanged…">
<meta name="theme-color" content="#1f1405">
<link rel="icon" href="../assets/img/brand/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Marcellus&family=Alegreya+Sans:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Alegreya:ital@0;1&display=swap">
<link rel="stylesheet" href="../assets/vendor/trellis/core.css">
<link rel="stylesheet" href="../assets/css/hermitage.css">
<link rel="stylesheet" href="../assets/css/chrome.css">
<link rel="stylesheet" href="../assets/css/site.css">
<link rel="stylesheet" href="../assets/css/pages/<section>.css">   <!-- only if the section has one -->
<script src="../assets/vendor/trellis/settle.js" defer></script>
<script src="../assets/js/hw.js"></script>
</head>
<body>
<hw-bar></hw-bar>
<main id="main">
  … sections …
</main>
<hw-letter></hw-letter>
<hw-foot></hw-foot>
</body>
</html>
```

- `hw-bar`, `hw-letter`, `hw-foot` replace `hw-header`, `hw-signup`, `hw-footer`. Keep `hw-letter` wherever the old page had `hw-signup`. `hw-mark` stays.
- A data file (`assets/data/gatherings.js`, `library.js`) loads at the end of `<body>`, as before. `window.HW` has the same interface under `hw.js`.
- Sections sit in the field: `<section class="section">` with a `.frame` inside (or `.frame` on `main`), as `design-system/trellis/` shows.

## Rooms

`data-room` no longer colors anything. A dark band is a Trellis scope with a mood: `data-product="hermitage" data-theme="dark"` on the section (add `hw-deep` for the old "deep" room's sunken ground). Light rooms (`plaster`, `stone`) need nothing; `stone` may use `cc-band` with `--band-bg: var(--bg-sunken)` through the section's own class. A `photo` room uses the `hw-` photo component from site.css.

## Site Editor markers

The team edits words and photos at `<site>/edit`. Mark what they would plausibly change; leave navigation, forms, scripted or data-rendered content, and decoration unmarked.

```html
<h2 class="t-h2" data-edit="text">One line</h2>                    text, b strong i em a br
<div class="stack" data-edit="rich"><p>…</p><p>…</p></div>           + p ul ol li
<a class="button cc-primary" data-edit="link" href="…">Words</a>      a button's words and address
<img data-edit="image" src="…" width="…" height="…" alt="…">       a photo or drawing (width and height required)
```

- An area holds only what its kind allows: no classes and no spans inside. Put the class on the marked element. So **a marked button has no `.button-label` span**: its words sit directly in the `<a>` (Trellis centers them; the cap trim is the only loss, noted in `TRELLIS-LEDGER.md`). A `<p class="t-lg">` is marked as `text` on the `p` itself.
- A `draft-mark` span inside a paragraph makes that paragraph unmarkable: leave such a paragraph unmarked (the draft-mark is ours, not the team's), and mark its neighbors.
- Never nest markers; always close the marked element.

## Standing rules

- **Keep every word.** Copy, headings, alt text, ids, anchors and every `draft-mark` stay exactly as they are (the honesty rule: never invent or "improve" copy). Only markup and classes change.
- **Trellis first**: invoke the `trellis` skill before writing any CSS or markup. Primitives and tokens, no raw values; inline styles set variables only.
- **What's shared is not yours to change**: `assets/css/site.css`, `assets/css/chrome.css`, `assets/css/hermitage.css`, `assets/js/hw.js`, `assets/vendor/`. A component your pages need that site.css lacks goes in the section's own `assets/css/pages/<section>.css` (one `@layer hw.page` block, `hw-` prefixed classes), and you report it as a candidate for site.css.
- **Not moved**: `archive/`, `drafts/`, `design-system/` (the old specimen), `library/` (the prototype), `print/`, `scenes/`, `app/`. They keep `main.css` and `site.js`.

## Checks before a page is done

- Over http (`py -m http.server 4300` from the repository root), at 1440 and 390 wide: no console errors, no horizontal overflow (`document.documentElement.scrollWidth - innerWidth <= 0`), and a look at a screenshot.
- `node ../trellis/tools/check.js <your page folder>` and your page CSS: zero raw values, nothing restyled.
- Every marked area holds only what its kind allows (no class or span inside).
