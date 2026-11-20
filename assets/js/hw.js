/* ==========================================================================
   Hermitage World · the site runtime, on Trellis
   --------------------------------------------------------------------------
   Loaded in <head> (not deferred) on every Trellis page, so the custom
   elements are defined before the parser reaches them and render in place.
   It replaces assets/js/site.js page by page; site.js stays only for pages
   not yet moved (and the frozen archive).

   What lives here:
     SITE           the sitemap. The bar, the map, the footer and "current
                    page" all read it, so a page is added or renamed in ONE
                    place. (app/scripts/sync-site.mjs lifts it for the app.)
     <hw-mark>      the sun mark as inline SVG (breathes gently when visible)
     <hw-bar>       the bar and the site map (a Trellis tray). variant="overlay"
                    floats it over the page's opening until [data-bar-until]
                    has scrolled past. data-account="none|member|staff" (the
                    app sets it) adds the account links.
     <hw-letter>    the weekly-letter strip above the footer
     <hw-foot>      the footer, with the site's link columns
     behaviors      reveal once on arrival, demo forms, [data-open] dialogs
   window.HW keeps site.js's interface (SITE, url, asset, icon, esc,
   markSVG), so assets/data/*.js render the same way under either runtime.

   Writes variables and attributes, never styles (Trellis: inline styles set
   variables only). The parts are styled in assets/css/chrome.css.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------ the sitemap
     `status` marks pages that exist only as a plan (phase two, candidate). */
  var SITE = {
    name: 'Hermitage World',
    tagline: 'An interfaith center for meditation and spirituality. In Indianapolis and everywhere.',
    primary: [
      { label: 'Meditation', href: 'meditation/' },
      { label: 'Gatherings', href: 'gatherings/' },
      { label: 'Programs', href: 'programs/' },
      { label: 'Library', href: 'library/' },
      { label: 'Friar Justin', href: 'friar-justin/' },
      { label: 'Community', href: 'community/' }
    ],
    map: [
      { label: 'Meditation', href: 'meditation/', children: [
        { label: 'Meditation Library', href: 'meditation/library/' }
      ]},
      { label: 'Gatherings', href: 'gatherings/', children: [
        { label: 'Calendar', href: 'calendar/' },
        { label: 'In Person · Indianapolis', href: 'in-person/' },
        { label: 'A gathering', href: 'gatherings/event/?id=contemplative-unity' }
      ]},
      { label: 'Programs', href: 'programs/', children: [
        { label: 'Train Your Mind', href: 'programs/train-your-mind/' },
        { label: 'Success: Full Living', href: 'programs/success-full-living/' },
        { label: 'A Day of Deep Peace', href: 'programs/day-of-deep-peace/' },
        { label: 'The Silva Method', href: 'programs/silva-method/' }
      ]},
      { label: 'Friar Justin', href: 'friar-justin/', children: [
        { label: 'The Library', href: 'friar-justin/library/' },
        { label: 'Books & Media', href: 'friar-justin/books-and-media/' },
        { label: 'Soul Guide', href: 'friar-justin/soul-guide/', status: 'Candidate' }
      ]},
      { label: 'Community', href: 'community/', children: [
        { label: 'Teachers & Guides', href: 'community/teachers/' },
        { label: 'Stories', href: 'community/stories/' },
        { label: 'Membership', href: 'community/membership/', status: 'Phase two' }
      ]},
      { label: 'About', href: 'about/', children: [
        { label: 'FAQs', href: 'about/faq/' },
        { label: 'Give', href: 'give/' },
        { label: 'Contact', href: 'contact/' },
        { label: 'Newsletter', href: 'newsletter/' }
      ]}
    ],
    footer: [
      { title: 'Practice', links: [
        { label: 'Meditation', href: 'meditation/' },
        { label: 'Gatherings', href: 'gatherings/' },
        { label: 'Programs', href: 'programs/' },
        { label: 'Calendar', href: 'calendar/' }
      ]},
      { title: 'Lineage', links: [
        { label: 'Friar Justin', href: 'friar-justin/' },
        { label: 'The Library', href: 'friar-justin/library/' },
        { label: 'Books & Media', href: 'friar-justin/books-and-media/' },
        { label: 'About', href: 'about/' }
      ]},
      { title: 'Belong', links: [
        { label: 'Community', href: 'community/' },
        { label: 'Ways to Give', href: 'give/' },
        { label: 'Newsletter', href: 'newsletter/' },
        { label: 'Contact', href: 'contact/' },
        { label: 'Formerly hermitageindy.org', href: 'https://hermitageindy.org', external: true }
      ]}
    ]
  };

  /* -------------------------------------------------------------- paths
     The site may live at a sub-path (GitHub Pages), at a domain's root (the
     app), or be opened from disk, so every link is resolved from this
     script's own location (assets/js/hw.js → the site's root). */
  var script = document.currentScript;
  var ROOT = new URL('../../', script ? script.src : location.href);
  var FILE = location.protocol === 'file:';

  function url(path) {
    if (/^https?:/.test(path)) return path;
    var u = new URL(path, ROOT);
    if (FILE && /\/$/.test(u.pathname)) u.pathname += 'index.html';
    return u.href;
  }
  function asset(path) { return new URL('assets/' + path, ROOT).href; }
  function here() {
    var p = location.pathname.replace(/index\.html$/, '');
    var r = ROOT.pathname;
    return p.indexOf(r) === 0 ? p.slice(r.length) : p.replace(/^\//, '');
  }
  function icon(name, extra) {
    return '<svg class="icon' + (extra ? ' ' + extra : '') + '" aria-hidden="true"><use href="' + asset('img/icons.svg') + '#' + name + '"/></svg>';
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var CURRENT = here();
  function isCurrent(href) { return href.split('?')[0] === CURRENT; }
  function inSection(href) { return href !== '' && CURRENT.indexOf(href) === 0; }
  function current(href) {
    return isCurrent(href) ? ' aria-current="page"' : (inSection(href) ? ' aria-current="true"' : '');
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('hw-js');

  /* ----------------------------------------------------------------- mark
     Geometry from Munia's mark (Figma 282:1342): one disc, eight satellites,
     each a touch different in size for an organic, hand-set feel. */
  var MARK = {
    vb: '0 0 74 72.063',
    core: [37.39, 35.84, 18.79],
    sats: [
      [37.0, 5.23, 5.23], [58.89, 14.14, 5.91], [67.99, 36.03, 5.91], [58.5, 57.73, 5.81],
      [37.0, 66.44, 5.62], [15.5, 57.34, 5.42], [6.39, 35.84, 6.39], [15.3, 14.14, 5.23]
    ]
  };
  function markSVG(label, cls) {
    var c = MARK.core;
    var s = '<svg class="' + (cls || 'hw-mark') + '" viewBox="' + MARK.vb + '" ' +
      (label ? 'role="img" aria-label="' + esc(label) + '"' : 'aria-hidden="true"') + '>' +
      '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '"/>';
    MARK.sats.forEach(function (p) { s += '<circle data-sat cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '"/>'; });
    return s + '</svg>';
  }

  /* One rAF for every mark on the page; idles when none is visible. */
  var breathing = new Set();
  var rafId = 0;
  function breathe(t) {
    rafId = 0;
    if (!breathing.size || document.hidden) return;
    var s = t / 1000;
    breathing.forEach(function (svg) {
      svg.__sats.forEach(function (el, i) {
        var base = MARK.sats[i][2];
        var k = 0.93 + 0.07 * (0.5 + 0.5 * Math.sin(s * (0.8 + 0.11 * i) + i * 2.4));
        el.setAttribute('r', (base * k).toFixed(3));
      });
    });
    rafId = requestAnimationFrame(breathe);
  }
  var markIO = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) breathing.add(e.target); else breathing.delete(e.target);
    });
    if (breathing.size && !rafId) rafId = requestAnimationFrame(breathe);
  }) : null;
  document.addEventListener('visibilitychange', function () { if (!document.hidden && breathing.size && !rafId) rafId = requestAnimationFrame(breathe); });

  function animateMark(svg) {
    if (reduced || !markIO || !svg) return;
    svg.__sats = Array.prototype.slice.call(svg.querySelectorAll('[data-sat]'));
    markIO.observe(svg);
  }

  /* ------------------------------------------------------- custom elements */
  function define(name, render) {
    if (customElements.get(name)) return;
    customElements.define(name, class extends HTMLElement {
      connectedCallback() {
        if (this.__done) return;
        this.__done = true;
        render(this);
      }
    });
  }

  define('hw-mark', function (el) {
    el.innerHTML = markSVG(el.getAttribute('label'), 'hw-mark' + (el.hasAttribute('large') ? ' hw-mark-lg' : ''));
    if (!el.hasAttribute('still')) animateMark(el.firstChild);
  });

  function brand(size) {
    return '<a class="hw-brand" href="' + url('') + '" aria-label="Hermitage World, home">' +
      markSVG(null, 'hw-mark' + (size === 'lg' ? ' hw-mark-lg' : '')) +
      '<span class="hw-brand-name">Hermitage<br>World</span></a>';
  }

  // A dark band is a Trellis scope with a mood (Trellis 0.10, D96).
  var DARK = ' data-product="hermitage" data-theme="dark"';

  define('hw-bar', function (el) {
    var overlay = el.getAttribute('variant') === 'overlay';
    var account = el.getAttribute('data-account'); // none | member | staff, from the app
    var nav = SITE.primary.map(function (l) {
      return '<a class="button cc-ghost hw-nav-link" href="' + url(l.href) + '"' + current(l.href) + '><span class="button-label">' + esc(l.label) + '</span></a>';
    }).join('');
    var mine = '';
    if (account) {
      mine = account === 'none'
        ? '<a class="button cc-ghost hw-nav-link" href="' + url('sign-in/') + '"><span class="button-label">Sign in</span></a>'
        : '<a class="button cc-ghost hw-nav-link" href="' + url('account/') + '"' + current('account/') + '><span class="button-label">Your library</span></a>';
    }

    var map = SITE.map.map(function (g) {
      return '<div class="stack hw-map-group"><a class="t-h5" href="' + url(g.href) + '"' + current(g.href) + '>' + esc(g.label) + '</a>' +
        '<ul class="list cc-dense">' + g.children.map(function (c) {
          return '<li class="list-item"><a class="list-link t-body" href="' + url(c.href) + '"' + (isCurrent(c.href) ? ' aria-current="page"' : '') + '>' + esc(c.label) + '</a>' +
            (c.status ? '<span class="list-end"><span class="tag cc-sm"><span class="tag-label">' + esc(c.status) + '</span></span></span>' : '') + '</li>';
        }).join('') + '</ul></div>';
    }).join('');
    var appGroup = account ? '<div class="stack hw-map-group"><a class="t-h5" href="' + url('library/') + '">Library</a><ul class="list cc-dense">' +
      '<li class="list-item"><a class="list-link t-body" href="' + url('shop/') + '">Shop</a></li>' +
      '<li class="list-item"><a class="list-link t-body" href="' + url('posts/') + '">Posts</a></li>' +
      (account === 'none'
        ? '<li class="list-item"><a class="list-link t-body" href="' + url('sign-in/') + '">Sign in</a></li>'
        : '<li class="list-item"><a class="list-link t-body" href="' + url('account/') + '">Your library</a></li>') +
      (account === 'staff' ? '<li class="list-item"><a class="list-link t-body" href="' + url('admin/') + '">Admin</a></li>' : '') +
      '</ul></div>' : '';

    el.innerHTML =
      '<a class="hw-skip button cc-primary" href="#main"><span class="button-label">Skip to content</span></a>' +
      '<header class="hw-bar' + (overlay ? ' hw-bar-overlay' : '') + '"' + DARK + '>' +
        '<div class="frame hw-bar-row">' + brand() +
          '<nav class="hw-nav" aria-label="Primary">' + nav + mine + '</nav>' +
          '<div class="hw-bar-end">' +
            '<a class="button hw-bar-contact" href="' + url('contact/') + '"><span class="button-label">Contact</span></a>' +
            '<button class="button icon-button" type="button" data-open="hw-map" aria-haspopup="dialog" aria-label="Open the map of the site">' + icon('sun') + '</button>' +
          '</div>' +
        '</div>' +
      '</header>' +
      '<dialog class="modal cc-tray cc-right hw-map" id="hw-map" aria-labelledby="hw-map-title"' + DARK + '>' +
        '<div class="modal-inner">' +
          '<div class="modal-header">' +
            '<h2 class="t-h4" id="hw-map-title">The whole map</h2>' +
            '<button class="button icon-button cc-ghost cc-md" type="button" data-close aria-label="Close the map">' + icon('close') + '</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<nav class="stack hw-map-groups" aria-label="Site map">' +
              '<div class="stack hw-map-group"><a class="t-h5" href="' + url('') + '"' + (CURRENT === '' ? ' aria-current="page"' : '') + '>Home</a></div>' +
              map + appGroup +
            '</nav>' +
          '</div>' +
        '</div>' +
      '</dialog>';

    animateMark(el.querySelector('.hw-brand svg'));

    if (overlay) {
      var bar = el.querySelector('.hw-bar');
      // Looked up when scrolling, not now: the bar renders at the top of
      // <body>, before the parser has reached the element it waits for.
      var until = null;
      var onScroll = function () {
        until = until || document.querySelector('[data-bar-until]');
        var limit = until ? until.offsetTop + until.offsetHeight - bar.offsetHeight : 40;
        bar.toggleAttribute('data-solid', window.scrollY > limit);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      ready(onScroll);
    }
  });

  define('hw-letter', function (el) {
    var id = 'hw-letter-' + Math.random().toString(36).slice(2, 7);
    el.innerHTML =
      '<section class="section cc-band hw-deep hw-letter"' + DARK + ' aria-labelledby="' + id + '">' +
        '<form class="frame hw-letter-form" action="#" method="post" data-demo-form data-done="Welcome. Check your inbox.">' +
          '<h2 class="t-h4" id="' + id + '">Receive the weekly letter</h2>' +
          '<div class="hw-letter-field"><div class="field"><label class="field-label u-sr-only" for="' + id + '-n">Name</label>' +
            '<input class="input" id="' + id + '-n" name="name" type="text" placeholder="Name" autocomplete="given-name"></div></div>' +
          '<div class="hw-letter-field"><div class="field"><label class="field-label u-sr-only" for="' + id + '-e">Email</label>' +
            '<input class="input" id="' + id + '-e" name="email" type="email" placeholder="Email" autocomplete="email" required></div></div>' +
          '<button class="button cc-primary" type="submit"><span class="button-label">Join 3,300+ seekers</span></button>' +
        '</form>' +
      '</section>';
  });

  define('hw-foot', function (el) {
    var cols = SITE.footer.map(function (c) {
      return '<div class="stack"><p class="t-label">' + esc(c.title) + '</p>' + c.links.map(function (l) {
        return '<a class="t-body" href="' + url(l.href) + '"' + (l.external ? ' rel="noopener"' : '') + '>' + esc(l.label) + '</a>';
      }).join('') + '</div>';
    }).join('');
    el.innerHTML =
      '<footer class="section cc-band hw-deep hw-foot"' + DARK + '>' +
        '<div class="frame context stack hw-foot-body">' +
          '<div class="split hw-foot-split">' +
            '<div class="stack">' + brand('lg') + '<p class="t-sm u-text-secondary">' + esc(SITE.tagline) + '</p></div>' +
            '<nav class="grid hw-foot-cols" aria-label="Footer">' + cols + '</nav>' +
          '</div>' +
          '<div class="cluster hw-foot-bar t-xs u-text-tertiary">' +
            '<span>© ' + new Date().getFullYear() + ' Hermitage World. All rights reserved.</span>' +
            '<span><a href="' + url('design-system/trellis/') + '">Design system</a> · Created by Iris Cocreative</span>' +
          '</div>' +
        '</div>' +
      '</footer>';
    animateMark(el.querySelector('.hw-brand svg'));
  });

  /* ------------------------------------------------------------ behaviors */
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    /* Reveal once, on arrival. Reduced motion (or no observer) shows all at rest. */
    var items = document.querySelectorAll('[data-reveal]');
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      items.forEach(function (el) { io.observe(el); });
    }

    /* Rail arrows: [data-rail-arrows="id"] holds two buttons (data-dir -1
       and 1) that page the .rail with that id a screenful at a time; it
       snaps to whole items. The rail still scrolls by hand; each end
       disables its arrow, and the pair hides when the rail fits. */
    document.querySelectorAll('[data-rail-arrows]').forEach(function (box) {
      var rail = document.getElementById(box.getAttribute('data-rail-arrows'));
      if (!rail) return;
      var back = box.querySelector('[data-dir="-1"]'), on = box.querySelector('[data-dir="1"]');
      function state() {
        var max = rail.scrollWidth - rail.clientWidth;
        box.hidden = max <= 1;
        back.disabled = rail.scrollLeft <= 4;
        on.disabled = rail.scrollLeft >= max - 4;
      }
      box.addEventListener('click', function (e) {
        var b = e.target.closest('[data-dir]');
        if (b) rail.scrollBy({ left: +b.getAttribute('data-dir') * rail.clientWidth * 0.9, behavior: reduced ? 'auto' : 'smooth' });
      });
      rail.addEventListener('scroll', state, { passive: true });
      if (window.ResizeObserver) new ResizeObserver(state).observe(rail);
      state();
    });

    /* Demo forms: nothing is sent anywhere yet, and the button says so. */
    document.querySelectorAll('[data-demo-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = form.querySelector('[type="submit"]');
        if (!btn) return;
        var label = btn.querySelector('.button-label') || btn;
        label.textContent = form.getAttribute('data-done') || 'Thank you.';
        btn.disabled = true;
      });
    });
  });

  /* Dialogs: [data-open="id"] opens one, [data-close] closes its own, and a
     link inside the map closes it (so an in-page jump lands under it).
     settle.js closes a Trellis modal on a true backdrop click. */
  document.addEventListener('click', function (e) {
    var open = e.target.closest('[data-open]');
    if (open) {
      var d = document.getElementById(open.getAttribute('data-open'));
      if (d && d.showModal) d.showModal();
      return;
    }
    var close = e.target.closest('[data-close]');
    if (close) { var dlg = close.closest('dialog'); if (dlg) dlg.close(); return; }
    var link = e.target.closest('.hw-map a[href]');
    if (link) link.closest('dialog').close();
  });

  window.HW = { SITE: SITE, url: url, asset: asset, icon: icon, esc: esc, markSVG: markSVG };
})();
