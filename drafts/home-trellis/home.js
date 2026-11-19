/* Hermitage World · the homepage on Trellis · behavior
   Writes variables, never styles (Trellis: inline styles set variables only).
   - the walk: --walk (0..1) on the hero as the temple scene walks you in
   - the bar turns solid after the hero (decision 4)
   - the map opens in a Trellis tray (a native <dialog>)
   - the letter form is a preview and says so
   - things fade up once as they arrive */
(function () {
  'use strict';

  function ss(a, b, x) { var t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); }

  var hero = document.getElementById('hero');
  var bar = document.getElementById('bar');
  var ticking = false;
  function update() {
    ticking = false;
    if (!hero) return;
    var rect = hero.getBoundingClientRect();
    var range = hero.offsetHeight - innerHeight;
    var p = range > 0 ? Math.min(Math.max(-rect.top / range, 0), 1) : 0;
    hero.style.setProperty('--walk', ss(0.15, 0.55, p).toFixed(3));
    var solid = rect.bottom <= bar.offsetHeight;
    if (solid !== bar.hasAttribute('data-solid')) bar.toggleAttribute('data-solid', solid);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();

  // The map. settle.js closes a Trellis modal on a true backdrop click.
  document.addEventListener('click', function (e) {
    var open = e.target.closest('[data-open]');
    if (open) { var d = document.getElementById(open.getAttribute('data-open')); if (d && d.showModal) d.showModal(); return; }
    var close = e.target.closest('[data-close]');
    if (close) { var dlg = close.closest('dialog'); if (dlg) dlg.close(); return; }
    // A link inside the map closes it, so an in-page jump lands under it.
    var link = e.target.closest('dialog a[href]');
    if (link) link.closest('dialog').close();
  });

  // The letter: a preview.
  document.querySelectorAll('form[data-demo]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = form.querySelector('[data-demo-note]');
      if (note) note.textContent = 'Thank you. This is a preview, so nothing was sent.';
    });
  });

  // Reveal once.
  var items = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('is-in'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach(function (el) { io.observe(el); });
})();
