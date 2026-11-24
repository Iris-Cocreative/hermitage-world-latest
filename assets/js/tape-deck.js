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

      this.innerHTML =
        '<div class="hw-deck">' +
          '<div class="hw-deck-bay">' +
            '<div class="hw-deck-tape">' +
              '<div class="hw-deck-label">' +
                '<span class="hw-deck-side t-label">Side A</span>' +
                '<span class="hw-deck-title t-h6 u-truncate">' + esc(label) + '</span>' +
                (note ? '<span class="hw-deck-note t-xs">' + esc(note) + '</span>' : '') +
              '</div>' +
              '<div class="hw-deck-window" aria-hidden="true">' +
                '<span class="hw-deck-reel" data-reel="left"><i></i></span>' +
                '<span class="hw-deck-reel" data-reel="right"><i></i></span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<p class="hw-deck-now t-body" aria-live="polite"></p>' +
          '<div class="hw-deck-keys">' +
            '<span class="hw-deck-counter t-sm" data-at>00:00</span>' +
            '<div class="cluster hw-deck-transport">' +
              '<button class="button icon-button cc-ghost cc-lg" type="button" data-key="back" aria-label="Rewind ' + SKIP + ' seconds">' + ICON.back + '</button>' +
              '<button class="button icon-button cc-primary cc-lg" type="button" data-key="play" aria-label="Play">' + ICON.play + '</button>' +
              '<button class="button icon-button cc-ghost cc-lg" type="button" data-key="on" aria-label="Wind on ' + SKIP + ' seconds">' + ICON.on + '</button>' +
            '</div>' +
            '<span class="hw-deck-counter t-sm" data-left>-00:00</span>' +
          '</div>' +
          '<input class="range hw-deck-seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Position in the track">' +
          (this.tracks.length > 1 ?
            '<ol class="list cc-dense hw-deck-tracks">' + this.tracks.map(function (t, i) {
              return '<li class="list-item" data-i="' + i + '">' +
                '<span class="list-mark t-body hw-deck-mark">' + t.mark + '</span>' +
                '<div class="list-body"><button class="hw-deck-pick list-title list-link t-body" type="button" data-i="' + i + '">' + esc(t.title) + '</button></div>' +
                '<span class="list-end t-sm u-text-secondary" data-len></span>' +
              '</li>';
            }).join('') + '</ol>' : '') +
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
      this.querySelector('.hw-deck-side').textContent = 'Side ' + t.side;
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
      this.playKey.innerHTML = playing ? ICON.pause : ICON.play;
      this.playKey.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    }

    draw() {
      var a = this.audio, d = a.duration, at = a.currentTime || 0;
      var p = isFinite(d) && d > 0 ? Math.min(1, at / d) : 0;
      this.deck.style.setProperty('--hw-deck-p', p.toFixed(4));
      this.querySelector('[data-at]').textContent = clock(at);
      this.querySelector('[data-left]').textContent = '-' + clock(isFinite(d) ? d - at : 0);
      this.seek.value = Math.round(p * 1000);
      if (window.Trellis && Trellis.range) Trellis.range(this.seek);
      else this.seek.style.setProperty('--range-at', p.toFixed(4));
    }
  });
})();
