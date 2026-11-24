/* ==========================================================================
   <hw-tape-deck>: the Hermitage's player, drawn as the tape deck the
   meditations were first played on (James, 2026-11-19: "people play tapes
   instead of just listening to an audio file").

     <hw-tape-deck label="Universal Meditations" note="Vol. 1">
       <audio src="…" title="A Universal Morning Meditation"></audio>
       <audio src="…" title="A Universal Evening Meditation" data-side="B"></audio>
     </hw-tape-deck>

   Each <audio> child is a track (its title, and data-side A or B, A unless
   set). The element plays them in order on one audio element: the reels turn
   while it plays, the tape winds from the left reel to the right as the track
   goes on, the counter keeps time, and the keys rewind and wind on fifteen
   seconds. Light DOM, so Trellis and assets/css/tape-deck.css draw it; the
   only inline styles are variables. Works the same on the static pages and
   inside the app (React renders the element and its <audio> children).
   ========================================================================== */
(function () {
  if (!window.customElements || customElements.get('hw-tape-deck')) return;

  var SKIP = 15;
  var ICON = {
    play: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
    pause: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>',
    back: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 6v12L3 12zM20 6v12l-8-6z" fill="currentColor"/></svg>',
    stop: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h12v12H6z" fill="currentColor"/></svg>',
    on: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 6v12l8-6zM4 6v12l8-6z" fill="currentColor"/></svg>'
  };

  function clock(s) {
    if (!isFinite(s) || s < 0) s = 0;
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  customElements.define('hw-tape-deck', class extends HTMLElement {
    connectedCallback() {
      if (this._built) return;
      // Defined before the page is parsed (the app loads this in <head>), the
      // element connects before its <audio> children arrive: wait for them.
      if (!this.querySelector('audio') && document.readyState === 'loading') {
        var later = this;
        document.addEventListener('DOMContentLoaded', function () { later.connectedCallback(); }, { once: true });
        return;
      }
      this._built = true;
      var self = this;
      this.tracks = Array.prototype.slice.call(this.querySelectorAll('audio')).map(function (a, i, all) {
        var side = (a.getAttribute('data-side') || 'A').toUpperCase();
        var n = all.slice(0, i + 1).filter(function (b) { return (b.getAttribute('data-side') || 'A').toUpperCase() === side; }).length;
        return { src: a.currentSrc || a.getAttribute('src'), title: a.getAttribute('title') || 'Track ' + (i + 1), side: side, mark: side + n };
      });
      if (!this.tracks.length) return;
      var label = this.getAttribute('label') || this.tracks[0].title;
      var note = this.getAttribute('note') || '';
      var uid = 'hwd' + Math.random().toString(36).slice(2, 8);
      var short = label.length > 30 ? label.slice(0, 29).replace(/\s+\S*$/, '') + '…' : label;

      // The cassette, drawn to a real one's proportions (100 × 64 mm).
      var teeth = [0, 60, 120, 180, 240, 300].map(function (a) {
        return '<rect class="hw-cs-tooth" x="-2.5" y="-14" width="5" height="6" rx="1" transform="rotate(' + a + ')"/>';
      }).join('');
      var reel = function (side, cx) {
        return '<circle class="hw-cs-pack" data-reel="' + side + '" cx="' + cx + '" cy="120" r="46" clip-path="url(#' + uid + ')"/>' +
          '<g transform="translate(' + cx + ' 120)"><g class="hw-cs-hub"><circle r="14"/>' + teeth + '<circle class="hw-cs-hole" r="7"/></g></g>';
      };
      var screw = function (x, y) { return '<g class="hw-cs-screw" transform="translate(' + x + ' ' + y + ')"><circle r="6"/><path d="M-3.5 0h7M0 -3.5v7"/></g>'; };
      var cassette =
        '<svg class="hw-deck-cassette" viewBox="0 0 400 254" aria-hidden="true">' +
          '<defs><clipPath id="' + uid + '"><rect x="112" y="88" width="176" height="64" rx="32"/></clipPath></defs>' +
          '<rect class="hw-cs-shell" x="2" y="2" width="396" height="250" rx="14"/>' +
          screw(16, 16) + screw(384, 16) + screw(16, 238) + screw(384, 238) +
          '<rect class="hw-cs-label" x="26" y="20" width="348" height="160" rx="8"/>' +
          '<rect class="hw-cs-band" x="26" y="60" width="348" height="10"/>' +
          '<rect class="hw-cs-band hw-cs-band-thin" x="26" y="74" width="348" height="4"/>' +
          '<text class="hw-cs-title" x="44" y="47" font-size="22">' + esc(short) + '</text>' +
          '<text class="hw-cs-side" x="358" y="49" font-size="28" text-anchor="end" data-side>A</text>' +
          (note ? '<text class="hw-cs-note" x="44" y="170" font-size="13">' + esc(note) + '</text>' : '') +
          '<text class="hw-cs-note" x="358" y="170" font-size="13" text-anchor="end">The Hermitage</text>' +
          '<rect class="hw-cs-window" x="112" y="88" width="176" height="64" rx="32"/>' +
          reel('left', 150) + reel('right', 250) +
          '<rect class="hw-cs-glass" x="112" y="88" width="176" height="64" rx="32"/>' +
          '<path class="hw-cs-foot" d="M92 252 L110 206 H290 L308 252 Z"/>' +
          '<circle class="hw-cs-hole" cx="134" cy="232" r="7"/><circle class="hw-cs-hole" cx="266" cy="232" r="7"/>' +
          '<rect class="hw-cs-hole" x="182" y="226" width="12" height="12" rx="2"/><rect class="hw-cs-hole" x="206" y="226" width="12" height="12" rx="2"/>' +
          '<path class="hw-cs-tape" d="M104 249 H296"/>' +
        '</svg>';

      var key = function (k, icon, text, kind) {
        return '<button class="button cc-lg hw-deck-key' + (kind ? ' ' + kind : '') + '" type="button" data-key="' + k + '">' + icon + '<span class="button-label">' + text + '</span></button>';
      };

      this.innerHTML =
        '<div class="hw-deck" data-product="hermitage" data-theme="dark">' +
          '<div class="hw-deck-door">' + cassette + '</div>' +
          '<div class="hw-deck-panel">' +
            '<div class="hw-deck-display">' +
              '<span class="hw-deck-count" data-at>00:00</span>' +
              '<span class="hw-deck-now t-sm u-truncate" aria-live="polite"></span>' +
              '<span class="hw-deck-left t-sm" data-left>-00:00</span>' +
            '</div>' +
            '<div class="hw-deck-keys">' +
              key('back', ICON.back, 'Rewind') +
              key('play', ICON.play, 'Play', 'cc-primary') +
              key('stop', ICON.stop, 'Stop') +
              key('on', ICON.on, 'Wind on') +
            '</div>' +
          '</div>' +
          '<input class="range hw-deck-seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Position in the track">' +
          (this.tracks.length > 1 ?
            '<div class="hw-deck-jcard">' +
              '<p class="t-label hw-deck-jcard-head">' + esc(label) + (note ? ' · ' + esc(note) : '') + '</p>' +
              '<ol class="list cc-dense hw-deck-tracks">' + this.tracks.map(function (t, i) {
                return '<li class="list-item" data-i="' + i + '">' +
                  '<span class="list-mark t-body hw-deck-mark">' + t.mark + '</span>' +
                  '<div class="list-body"><button class="hw-deck-pick list-title list-link t-body" type="button" data-i="' + i + '">' + esc(t.title) + '</button></div>' +
                  '<span class="list-end t-sm hw-deck-len" data-len></span>' +
                '</li>';
              }).join('') + '</ol>' +
            '</div>' : '') +
        '</div>';

      this.deck = this.querySelector('.hw-deck');
      this.playKey = this.querySelector('[data-key="play"]');
      this.seek = this.querySelector('.hw-deck-seek');
      this.audio = new Audio();
      this.audio.preload = 'metadata';
      this.i = 0;
      this.load(0);

      this.addEventListener('click', function (e) {
        var key = e.target.closest('[data-key]');
        var pick = e.target.closest('.hw-deck-pick');
        if (key) {
          var k = key.getAttribute('data-key');
          if (k === 'play') self.toggle();
          else if (k === 'stop') { self.audio.pause(); self.audio.currentTime = 0; self.draw(); }
          else self.wind(k === 'back' ? -SKIP : SKIP);
        } else if (pick) {
          self.load(+pick.getAttribute('data-i'));
          self.audio.play();
        }
      });
      this.seek.addEventListener('input', function () {
        if (isFinite(self.audio.duration)) self.audio.currentTime = self.audio.duration * self.seek.value / 1000;
      });
      var a = this.audio;
      a.addEventListener('play', function () { self.state(true); });
      a.addEventListener('pause', function () { self.state(false); });
      a.addEventListener('timeupdate', function () { self.draw(); });
      a.addEventListener('loadedmetadata', function () {
        self.draw();
        var len = self.querySelector('.hw-deck-tracks [data-i="' + self.i + '"] [data-len]');
        if (len) len.textContent = clock(a.duration);
      });
      a.addEventListener('ended', function () {
        if (self.i < self.tracks.length - 1) { self.load(self.i + 1); a.play(); }
        else { self.load(0); }
      });
    }

    disconnectedCallback() { if (this.audio) this.audio.pause(); }

    load(i) {
      var t = this.tracks[i];
      this.i = i;
      if (this.audio.getAttribute('src') !== t.src) this.audio.src = t.src;
      this.querySelector('[data-side]').textContent = t.side;
      this.querySelector('.hw-deck-now').textContent = t.title;
      this.querySelectorAll('.hw-deck-tracks .list-item').forEach(function (li) {
        if (+li.getAttribute('data-i') === i) li.setAttribute('aria-current', 'true'); else li.removeAttribute('aria-current');
      });
      if ('mediaSession' in navigator && window.MediaMetadata) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, album: this.getAttribute('label') || '', artist: 'The Hermitage' });
      }
      this.draw();
    }

    toggle() { if (this.audio.paused) this.audio.play(); else this.audio.pause(); }

    wind(by) {
      var a = this.audio, self = this;
      if (!isFinite(a.duration)) return;
      a.currentTime = Math.max(0, Math.min(a.duration, a.currentTime + by));
      this.deck.setAttribute('data-winding', by < 0 ? 'back' : 'on');
      clearTimeout(this._wind);
      this._wind = setTimeout(function () { self.deck.removeAttribute('data-winding'); }, 600);
    }

    state(playing) {
      if (playing) this.deck.setAttribute('data-playing', ''); else this.deck.removeAttribute('data-playing');
      this.playKey.innerHTML = (playing ? ICON.pause : ICON.play) + '<span class="button-label">' + (playing ? 'Pause' : 'Play') + '</span>';
      this.playKey.setAttribute('aria-pressed', playing ? 'true' : 'false');
    }

    draw() {
      var a = this.audio, d = a.duration, at = a.currentTime || 0;
      var p = isFinite(d) && d > 0 ? Math.min(1, at / d) : 0;
      this.deck.style.setProperty('--hw-deck-p', p.toFixed(4));
      this.querySelector('[data-at]').textContent = clock(at);
      this.querySelector('[data-left]').textContent = '-' + clock(isFinite(d) ? d - at : 0);
      // The packs: the left reel holds what's still to play, the right what has played.
      this.deck.style.setProperty('--hw-pack-l', (0.36 + 0.64 * Math.sqrt(1 - p)).toFixed(4));
      this.deck.style.setProperty('--hw-pack-r', (0.36 + 0.64 * Math.sqrt(p)).toFixed(4));
      this.seek.value = Math.round(p * 1000);
      if (window.Trellis && Trellis.range) Trellis.range(this.seek);
      else this.seek.style.setProperty('--range-at', p.toFixed(4));
    }
  });
})();
