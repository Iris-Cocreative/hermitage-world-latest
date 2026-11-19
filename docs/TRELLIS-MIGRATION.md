# Moving the static site onto Trellis: the class map

Every class and pattern the pages use today, and what replaces it on Trellis. The how-to for moving a page (its skeleton, the Site Editor markers, the checks) is `docs/TRELLIS-PAGE-MOVE.md`. The Hermitage's own components are in `assets/css/site.css`; see every one of them, light and dark, at `design-system/trellis/` (over http). Trellis's own classes and variables are listed in its README, "Public API" (`../trellis/README.md`, pinned copy `assets/vendor/trellis/`).

## Standing rules for whoever moves a page

- **Keep every word exactly.** Copy, headings, alt text, `aria-label`s and every `draft-mark` (now `hw-draft-mark`) stay as they are. Never invent or "improve" copy, never drop a draft mark, never fill a `pending` frame with a guess. This is the honesty rule (`CLAUDE.md`): only markup and classes change.
- **Keep every `id` and anchor**, so links from other pages and from outside still land.
- **Relative paths only** (`../` per level). The site moves to a custom domain; `404.html` is the one exception.
- **Trellis first.** Invoke the `trellis` skill before writing CSS or markup. Use primitives and tokens; no raw values; inline styles set variables only (`style="--photo-opacity: .4"`, never `style="opacity: .4"`).
- **Shared files are not yours to change**: `site.css`, `chrome.css`, `hermitage.css`, `hw.js`, `assets/vendor/`. A part your page needs that isn't here goes in the section's own page CSS (`hw-` prefixed) and is reported as a candidate for `site.css`.
- Run `node ../trellis/tools/check.js <your page folder>`: nothing raw, nothing restyled, no bare modifiers, no inline styles that aren't variables.

## Rooms → scopes

`data-room` no longer colors anything. A section's ground is a Trellis band and, when dark, a Trellis scope with a mood.

| Old | New |
|---|---|
| `data-room="dark"` | `<section class="section cc-band" data-product="hermitage" data-theme="dark">` |
| `data-room="deep"` | the same, plus `hw-deep` (chrome.css: the sunken ground) |
| `data-room="plaster"` | `<section class="section cc-band" data-product="hermitage" data-theme="light">` (the page's own ground; the scope also keeps it light if the page is ever dark) |
| `data-room="stone"` | `<section class="section cc-band">` with no scope: a band takes the sunken ground |
| `data-room="photo"` | the dark scope plus `hw-backdrop`, with `.hw-room-photo` as its first child (below) |

- A band that is a scope paints its own ground to the screen's edges (`site.css` sets its `--band-bg` to the scope's `--surface`).
- The page is `<main class="frame context">`; sections sit in it. A band's ground, a room photo and line art reach the screen's edges; the words stay in the frame.
- `section--seam` (a neutral hairline between two rooms): drop it; the grounds now differ.
- `section--flush-top` (no top padding, to continue the section before): move the content into the previous section instead. A band's padding has no variable (`TRELLIS-LEDGER.md`).

## Layout

| Old | New |
|---|---|
| `container`, `container--wide` | remove (`main.frame` is the field) |
| `container--narrow`, `measure` | `hw-measure` (chrome.css: the prose measure) |
| `section` | `section` (Trellis), with `cc-band` for a ground; `section-head` and `section-body` inside |
| `section-head`, `section-head__text` | one `div.section-head.stack`; buttons beside the heading go in a `.cluster` inside it |
| `stack` | `stack` (gap one cell) |
| `stack--xs`, `stack--sm` | `stack` |
| `stack--lg` | `stack` + `style="--stack-gap: var(--sp-2)"` |
| `stack--xl` | `--stack-gap: var(--sp-3)` |
| `stack--2xl` | `--stack-gap: var(--sp-4)` |
| `cluster`, `cluster--tight` | `cluster` (half-cell gap); `style="--cluster-gap: var(--sp-1)"` for a looser row |
| `cluster--between` | `cluster` with the first item wrapped in `.pair` (it takes the spare room). Not for a heading: on a phone `.pair` (`flex: 1 1 0`) squeezes it to a letter per line; put the heading above, in a `.stack`, and the controls under it |
| `grid grid--2`, `grid grid--3`, `grid grid--4` | `cols hw-cols-2`, `cols hw-cols-3`, `cols hw-cols-4` (that many columns while they fit, fewer as the container narrows, one on a phone) |
| `grid` alone | `grid` + `style="--grid-min: calc(var(--u) * 24)"` (fixed tracks; they don't stretch) |
| `split` | `split`; ratios are numbers, not `fr`: `--split-a: .8fr; --split-b: 1.2fr` → `--split-a: 2; --split-b: 3`. One column under 36rem of container |
| `split--top` | nothing (Trellis halves align to the top) |
| `split` centered halves | `align-self: center` has no Trellis class; use `split` as it is (ledger) |
| `center`, `ta-center` | `hw-center` |
| `mt-*`, `mb-*` | remove; space comes from the stack's gap |

## Type

| Old | New |
|---|---|
| bare `h1` | `h1.t-h1` |
| bare `h2`, `t-h2` | `t-h2` |
| bare `h3`, `t-h3` | `t-h5` (old `t-h3` was 2rem; Trellis `t-h3` is far larger) |
| bare `h4`, `t-h4` | `t-h6` |
| `t-lede` | `t-lg u-text-secondary` |
| `t-body` | `t-body` |
| `t-small` | `t-sm` |
| `t-muted` | `u-text-secondary` |
| `t-caps` | `t-label hw-gold` |
| `t-kicker` | `t-eyebrow hw-gold` |
| `t-accent` (gold words) | `hw-gold`; when it is a person's words, `hw-voice` |
| `form-note` | `p.t-sm.u-text-tertiary` |
| `hint` | `field-hint` |
| `sr-only` | `u-sr-only` |
| `a.link` | a bare `a` (core underlines links in text) |
| `prose` | `prose` (Trellis maps bare tags to roles) |

Every block of text carries a type role (`t-*`): Trellis sets size, line and rhythm from it.

## Controls and surfaces (Trellis has them)

| Old | New |
|---|---|
| `btn` | `button` |
| `btn--solid`, `btn--primary` | `button cc-primary` |
| `btn--ink` | `button` |
| `btn--sm`, `btn--lg` | `button cc-sm`, `button cc-lg` |
| `btn--block` | no equivalent: a Trellis button sizes to its words (core sets its width), and stretching it would restyle `.button`. Leave it at its natural width (a gap in `TRELLIS-LEDGER.md`) |
| `icon-btn` | `button icon-button` (+ `cc-ghost`, `cc-sm`); never `icon-button` alone |
| `icon-btn--solid` | `button icon-button cc-primary` |
| `icon` | `icon` (Trellis; size with `--icon-size` on it or an ancestor) |
| `card` | `card` |
| `card--lg` | `card` + `style="--card-pad: var(--sp-3)"` |
| `card--quiet`, `card--raised` | `card` (depth is the ground; nested cards step it themselves) |
| `card` with `style="border-color: var(--accent)"` | `style="--card-border: var(--accent)"` |
| `card--link` + `a.card__title` | `card` with the title's link as `a.hw-card-link` (it covers the card; the edge turns gold on hover) |
| `card__foot` | the last item of the card's `.stack`; where feet must line up across a row, use the hall pattern (`hw-hall`, `hw-hall-body`, `hw-hall-action`) |
| `accordion` (+ `__toggle`, `__title`, `__sub`, `__panel`, `__body`, `__chev`) | `div.prose` > `details` > `summary` + the answer; `data-accordion-group` (one open at a time) → give each `details` the same `name="…"` |
| `board` | `ul.list` |
| `board__row` | `li.list-item.hw-board-row` |
| `board__label` | `p.t-label.hw-gold.hw-row-label` (first in the row) |
| `board__title`, `board__text` | `div.list-body` > `.list-title.t-h6` + `.list-sub.t-sm` |
| `board__meta` | a `.cluster` inside the `list-body` |
| `board__action` | `span.list-end` > `a.button.cc-sm` |
| `field`, `field__label` | `div.field` > `label.field-label.t-label` |
| `input`, `textarea`, `select` | `input.input`, `textarea.input`, `select.input` |
| `chips`, `chip` | `div.cluster` of `button.tag[aria-pressed]`; a form choice (give amounts) keeps its radio inputs, each `label.tag` around a visually hidden radio (`u-sr-only`) |
| `tag` | `span.tag` > `span.tag-label` |
| `tag--accent` | `tag cc-solid` |
| `tag--soon` | `tag cc-outline` |
| `breadcrumb` (`a` + `span[aria-hidden]` + `span`) | `nav[aria-label="Breadcrumb"]` > `ol.crumbs` > `li` > `a`; the last `li` is the page, with `aria-current="page"` |
| `live` | `hw-live` (below) |
| `media-tile` | a Trellis list row (below) |

## The Hermitage's own components (`site.css`)

Each sizes from tokens and cells and works light or dark. Parts that take their height from a width (arch, roundel, art, player) measure their **container**: put each in a `.card`, a `.context`, or a composition here that is one (`hw-person`, `hw-hero-media`).

### Arch: `arch`, `arch--outline`, `arch-window`

`hw-arch` (round head, small foot; height from `--arch-ratio`, height ÷ width, 4:3 by default), `hw-arch-outline` (a gold hairline), `hw-arch-window` (a hairline arch around a thicker inner arch). Old `--arch-a: .78` (width ÷ height) becomes `--arch-ratio: 1.282`.

```html
<div class="context"><div class="hw-arch hw-arch-outline" style="--arch-ratio: 1.282"><img src="…" alt="…"></div></div>
<div class="context"><div class="hw-arch-window"><div class="hw-arch"><img src="…" alt=""></div></div></div>
```

### Roundel: `roundel`

`hw-roundel`: a photo in a circle inside a gold ring. `--roundel-size` caps it (old `--roundel-size: min(43rem, 82vw)` → `calc(var(--u) * 56)`); `--roundel-pos` is the photo's `object-position`.

```html
<div class="context"><div class="hw-roundel"><img src="../assets/img/photo/forest-canopy.jpg" alt="Sunlight through a forest canopy"></div></div>
```

### Art: `art`, `art--value-*`, `art--friar`

`hw-art` + `hw-art-inner-divinity`, `-experience`, `-acceptance`, `-creation`, `-unity` (masks in `--art-color`, the accent by default); `hw-art-friar` (the stained-glass friar in its own glass colors). Value glyphs sit in `hw-glyph` (a ring) or `hw-glyph hw-glyph-square`.

```html
<div class="context"><span class="hw-art hw-art-friar" role="img" aria-label="The friar, from the Hermitage's stained glass"></span></div>
<span class="hw-glyph hw-glyph-square"><span class="hw-art hw-art-experience"></span></span>
```

### Backdrop: `room-photo`, `lineart`, `room-arch`

Give the section `hw-backdrop`; then, as its first children, any of `hw-room-photo` (`--photo-pos`, `--photo-opacity`, `--photo-fade`), `hw-lineart hw-lineart-arches|vaults` (`--lineart-opacity`, `--lineart-pos`, `--lineart-size`), `hw-room-arch` (`--room-arch-top`, `--room-arch-opacity`). Old inline `style="opacity:.5"` on line art becomes `style="--lineart-opacity: .5"`.

```html
<section class="section cc-band hw-backdrop" data-product="hermitage" data-theme="dark">
  <div class="hw-room-photo" style="--photo-pos: 72% center; --photo-opacity: .4" aria-hidden="true"><img src="../assets/img/photo/light-shaft-room.jpg" alt="" loading="lazy"></div>
  …
</section>
```

### Page hero: `page-hero`, `page-hero--media`, `page-hero__inner`, `__media`, `__actions`

A dark band with the room arch; words and media in a `.split` (none without media).

```html
<section class="section cc-band hw-backdrop hw-hero" data-product="hermitage" data-theme="dark">
  <div class="hw-room-arch" aria-hidden="true"></div>
  <div class="split" style="--split-a: 5; --split-b: 4; --split-gap: var(--sp-4)">
    <div class="stack hw-hero-text" data-reveal>
      <nav aria-label="Breadcrumb"><ol class="crumbs"><li><a href="../">About</a></li><li aria-current="page">FAQs</li></ol></nav>
      <h1 class="t-h1">…</h1>
      <p class="t-lg u-text-secondary">…</p>
      <div class="cluster"><a class="button cc-primary" href="…">…</a><a class="button" href="…">…</a></div>
    </div>
    <div class="hw-hero-media" data-reveal><div class="hw-roundel"><img src="…" alt="…"></div></div>
  </div>
</section>
```

### Quote and voice: `quote`, `quote--left`, `quote--sm`, `voice`

`blockquote.hw-quote` (centered; `hw-quote-start` for `quote--left`). Its words are set in the voice, Alegreya italic (the brand's Voice Rule; the old quote used Marcellus). The size is the `p`'s type role: `t-h4`, or `t-h5` for `quote--sm`. `hw-voice` is the voice inside running text.

```html
<blockquote class="hw-quote hw-quote-start">
  <p class="t-h5">“Taking control of the thought process and giving it direction.”</p>
  <cite class="t-body">Friar Justin <small>Success Thinking, ch. III</small></cite>
</blockquote>
```

### Draft mark: `draft-mark`

`hw-draft-mark`: a dashed pill in the warning hue, in text or in a row. `<html class="hw-hide-pending">` hides them all once content is in.

```html
<p class="t-body u-text-secondary">The same principles turned toward the people in our lives. <span class="hw-draft-mark">to confirm</span></p>
```

### Pending: `pending`

`hw-pending`: a frame for an image that hasn't arrived, naming it and its source. Inside `hw-arch` or `hw-roundel` it fills the shape.

```html
<div class="context"><div class="hw-arch hw-arch-outline"><div class="hw-pending"><strong>Portrait</strong>to come</div></div></div>
```

### Note: `note`

`hw-note`: a quiet aside with a gold rule at its start, holding a paragraph.

```html
<div class="hw-note"><p class="t-sm"><strong>Draft guidance.</strong> These four steps are a placeholder …</p></div>
```

### Checklist: `checklist`

```html
<ul class="hw-checklist" role="list"><li class="t-body">Every weekly gathering</li>…</ul>
```

### Values: `values`, `value`, `value__glyph`, `value__glyph--circle|--square`

A Trellis `.rail` (scrolls and snaps, no script; the old prev/next buttons and `data-carousel` go). Every other glyph sits under its words where there is room.

```html
<div class="rail hw-values" tabindex="0" role="group" aria-label="Five lights">
  <article class="hw-value"><span class="hw-glyph"><span class="hw-art hw-art-inner-divinity"></span></span><h3 class="t-h4">Inner<br>Divinity</h3><p class="t-sm">…</p></article>
  <article class="hw-value"><span class="hw-glyph hw-glyph-square"><span class="hw-art hw-art-experience"></span></span><h3 class="t-h4">Experience<br>over Doctrine</h3><p class="t-sm">…</p></article>
  …
</div>
```

### Halls: `halls`, `hall`, `hall__photo`, `hall__go`

Three hallway cards (one column where three won't fit): the arched photo links on, the words sit below, the action at the card's foot. The old accordion under each photo becomes the card's open text, as in the homepage draft.

```html
<div class="cols hw-halls">
  <article class="card hw-hall" data-reveal>
    <div class="stack hw-hall-body">
      <a class="hw-arch hw-hall-photo" href="programs/train-your-mind/" aria-label="Begin: Train Your Mind">
        <img src="assets/img/photo/hall-begin.jpg" alt="" loading="lazy">
        <span class="button icon-button cc-sm hw-hall-go" aria-hidden="true"><svg class="icon"><use href="assets/img/icons.svg#arrow"/></svg></span>
      </a>
      <p class="t-eyebrow hw-gold">Begin</p>
      <h3 class="t-h5">Train Your Mind: Meditation Foundations</h3>
      <p class="t-body u-text-secondary">…</p>
      <div class="cluster hw-hall-action"><a class="button cc-primary" href="programs/train-your-mind/">Start here</a></div>
    </div>
  </article>
  …
</div>
```

### Person: `person`, `person__role`

```html
<article class="stack hw-person" data-reveal>
  <div class="hw-arch hw-arch-outline"><img src="…" alt="…"></div>
  <p class="t-label hw-gold">Program Director</p>
  <h3 class="t-h5">Samuel Robinson</h3>
  <p class="t-body u-text-secondary">…</p>
</article>
```

### Stat: `stat`, `stat__num`, `stat__label`

```html
<div class="cols hw-cols-4">
  <div class="pair hw-stat"><span class="t-h2">22</span><span class="t-sm u-text-secondary">meditation albums on CD and MP3</span></div>
</div>
```

### Timeline: `timeline`, `timeline__item`, `timeline__year`, `is-now`

Each year carries a Trellis dot: a ring for what has been, filled (and softly glowing) for now. The `is-now` class goes; drop `cc-ring` from that item's dot instead.

```html
<ol class="hw-timeline" role="list">
  <li data-reveal><p class="t-h6 hw-gold"><span class="dot cc-ring cc-accent hw-timeline-dot" aria-hidden="true"></span>1979</p><h3 class="t-h5">Alverna Retreat House</h3><p class="t-body u-text-secondary">…</p></li>
  <li data-reveal><p class="t-h6 hw-gold"><span class="dot cc-accent hw-timeline-dot" aria-hidden="true"></span>2026</p><h3 class="t-h5">Hermitage World</h3><p class="t-body u-text-secondary">…</p></li>
</ol>
```

### Pathway: `pathway`, `pathway--list`, `pathway__step`

```html
<ol class="grid hw-pathway" role="list">
  <li class="hw-pathway-step"><h3 class="t-h6">Discover</h3><p class="t-sm u-text-secondary">…</p></li>
</ol>
<ol class="grid hw-pathway hw-pathway-list" role="list">…</ol>
```

### Player: `player`, `player__label`

A frame that says what it will be. Usually a dark scope; the old inline `aspect-ratio: 21/9` becomes `--player-ratio: calc(9 / 21)` (height ÷ width).

```html
<div class="context"><div class="hw-player" data-product="hermitage" data-theme="dark">
  <span class="button icon-button" aria-hidden="true"><svg class="icon"><use href="../../assets/img/icons.svg#play"/></svg></span>
  <p class="hw-player-label t-sm">A story from Australia · coming soon</p>
</div></div>
```

### Media tile: `media-tile` (`assets/data/library.js`)

Fully Trellis: a list row.

```html
<ul class="list">
  <li class="list-item">
    <button class="button icon-button cc-ghost" type="button" aria-disabled="true" title="Recordings arrive with the catalog"><svg class="icon" aria-hidden="true"><use href="…#play"/></svg><span class="u-sr-only">Play … (arrives with the catalog)</span></button>
    <div class="list-body"><p class="list-title t-h6">Healing meditation I</p><p class="list-sub t-sm">Healing meditations · 20 min · Audio</p></div>
    <span class="list-end cluster"><span class="hw-draft-mark">sample</span><span class="tag cc-solid"><span class="tag-label">Free</span></span></span>
  </li>
</ul>
```

### Circle link: `circle-link`, `circle-link__ring`, `--down`, `--sm`

`hw-circle-link` > `hw-ring` + a label; `hw-circle-link-sm`, `hw-circle-link-down`. The down link uses the `#arrow-down` icon (the old one rotated `#arrow-right`).

```html
<a class="hw-circle-link" href="#threshold"><span class="hw-ring"><svg class="icon" aria-hidden="true"><use href="assets/img/icons.svg#arrow"/></svg></span><span class="t-lg">Begin the path</span></a>
<a class="hw-circle-link hw-circle-link-down hw-circle-link-sm" href="#oculus" aria-label="Continue"><span class="hw-ring"><svg class="icon" aria-hidden="true"><use href="assets/img/icons.svg#arrow-down"/></svg></span></a>
```

### Live: `live`

A gold Trellis dot that pulses (still under reduced motion). The old amber glass dot became gold: glass colors are light, never UI.

```html
<span class="hw-live t-sm hw-gold"><span class="dot cc-accent hw-live-dot" aria-hidden="true"></span>Happening now</span>
```

### Event: `event`, `event__date`, `__dow`, `__day`, `__title`, `__when`, `__meta`, `is-live` (`assets/data/gatherings.js`)

```html
<article class="card hw-event">
  <div class="hw-date"><span class="t-label hw-gold">Tue</span><span class="t-h4">24</span></div>
  <div class="stack">
    <h3 class="t-h6"><a class="hw-card-link" href="…">Office Hours with Samuel</a></h3>
    <p class="t-sm u-text-secondary">…</p>
    <div class="cluster hw-event-meta"><span class="tag"><span class="tag-label">Online</span></span></div>
  </div>
</article>
```

`is-live` → `hw-event-live`. A gathering with no next date shows only the label in `hw-date`.

### Reveal: `data-reveal`

Unchanged in the markup. `hw.js` adds `html.hw-js` and `.is-in`; `site.css` fades each up once, and nothing moves under reduced motion.

## Learned in the move (2026-11-19)

- **Shared since the move** (in `site.css`, "Shared by the pages"): `.card.hw-card-lg` (the old `card--lg`), `.hw-hero-after` (content that continues a hero in the same band, the old `section--flush-top`), `.hw-hero-solo` (a hero with no media: `.hw-hero-text` lines up only beside media, and alone in a stack it pushes the words to the right), `.hw-head-main` (the words' `.pair` in a head cluster with an end item, so a heading never crushes on a phone), `.hw-gold-em` (a gold, upright `em` inside a marked heading), `.hw-feature` and `.hw-feature-mark` (the old `.feature`), `.hw-fields` (name and email side by side, wrapping), `.hw-choices` and `.hw-choice` (radio choices drawn as tags; the chosen one solid gold), `.hw-recording` and `.hw-recording-end` (library.js rows), `.hw-rule` (a hairline `hr` outside `.prose`).
- **A stack's gap is inherited.** `.section-body` sets `--stack-gap` to three cells, and an inline gap on a wrapper reaches every `.stack` inside it. Set the gap on the inner stacks (cards, books) that need a tighter one.
- **A rich area in a FAQ answer**: inside `.prose details` a bare `<div data-edit="rich">` is transparent to prose and loses the answer's indent. Give the marked div `class="stack"`.
- **Textareas** ignore `rows`; set `style="--input-rows: 6"`.
- **A quiet ring dot**: `dot cc-ring` alone can come out in a status hue; add `cc-quiet` for a gray one.
- **A FAQ question marked on its `<summary>`**: editing it in place may open and close the answer. Try it once in the Site Editor.

## Not mapped here

Page-only compositions stay with their pages (in `assets/css/pages/<section>.css` when moved): the home threshold, door, oculus, founded, letter card and mission; `library-filter`, `calendar-day`, `month*`, `event-panel`, `soul-ask`, `soul-result`, `ring*`, `feature`, `faq__q`, `give-form`, `book`, `book__cover` (an `hw-arch` with `--arch-ratio: 1.389` inside a stack). The header, drawer, signup strip and footer are `chrome.css` and `hw.js` (`hw-bar`, `hw-letter`, `hw-foot`). The loggia, temple, print and scenes pages keep their own CSS.
