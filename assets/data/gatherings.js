/* ==========================================================================
   Gatherings — the one source for the week's rhythm.
   --------------------------------------------------------------------------
   Edit the GATHERINGS list; the home calendar, /gatherings/, /calendar/ and
   the event page all render from it. This stands in for the CMS or calendar
   feed the production site will use, and its fields are shaped like one.

   Times are written in the HOST's time zone (tz) and shown to each visitor
   in their own. `confirmed: false` puts a "time to confirm" mark beside it.

   A gathering reads as "Happening now" from its start until its END, not
   just until it starts (the old site marked events past the moment they
   began, which turned away anyone arriving late).
   ========================================================================== */
(function () {
  'use strict';

  var INDY = 'America/Indiana/Indianapolis';

  var IIC = 'Indiana Interchurch Center, 1100 W. 42nd Street, Suite 350, Indianapolis';

  // From the Hermitage Weekly (Oct 26 – Nov 1, 2026), as Samuel asked on Oct 26.
  // Every gathering is weekly; there are no monthly events right now. Tai Chi
  // is held back until its details are worked out. `mode` is online,
  // in-person or hybrid (online and in person at once).
  var GATHERINGS = [
    {
      id: 'office-hours',
      title: 'Office Hours with Samuel',
      summary: 'Samuel’s open online office: questions about the Hermitage, and conversation about meditation and spirituality.',
      body: [
        'Want to know more about the Hermitage? Samuel Robinson, the Hermitage’s Program Director, keeps an open online office every week for questions and for conversation about meditation and spirituality.',
        'All are welcome. You can also write to Samuel@HermitageIndy.org or call 317-545-0742.'
      ],
      repeat: { every: 'week', day: 2 },          // 0 Sunday … 6 Saturday
      time: '18:00', minutes: 60, tz: INDY, confirmed: true,
      mode: 'online', place: 'Zoom',
      host: 'Samuel Robinson',
      kind: 'gathering',
      action: 'Join on Zoom'
    },
    {
      id: 'wisdom-circle',
      title: 'Wisdom Circle',
      summary: 'Inspired by Friar Justin’s Energy Circle: sacred texts read together in presence, compassion and deep listening.',
      body: [
        'Wisdom Circle is an online gathering inspired by Fr. Justin’s Energy Circle, where participants enter a shared field of presence, compassion and deep listening as they engage sacred texts from Christian as well as other traditions: not to analyze them, but to be inwardly transformed by them.',
        'Through reflection, silence and heartfelt conversation, the group cultivates clarity, courage and love that naturally extend into the world. The current book is Success: Full Thinking by Fr. Justin Belitz.'
      ],
      repeat: { every: 'week', day: 2 },
      time: '20:15', minutes: 60, tz: INDY, confirmed: true,
      mode: 'online', place: 'Zoom',
      host: 'The Hermitage',
      kind: 'gathering',
      action: 'Join on Zoom'
    },
    {
      id: 'energy-circle',
      title: 'Energy Circle',
      summary: 'Share your success stories and take part in a guided meditation, in person at the Hermitage’s new home.',
      body: [
        'Come share your success stories and take part in a guided meditation. All are welcome, and no reservations are needed.',
        'The Energy Circle now meets at the Hermitage’s new home on 42nd Street.'
      ],
      repeat: { every: 'week', day: 3 },
      time: '19:00', minutes: 60, tz: INDY, confirmed: true,
      mode: 'in-person', place: IIC,
      host: 'The Hermitage',
      kind: 'gathering',
      action: 'Come in person'
    },
    {
      id: 'oneness-celebration',
      title: 'Oneness Celebration',
      summary: 'A welcoming gathering in the Christian tradition, celebrating our connection with God, one another and all creation. A potluck lunch follows.',
      body: [
        'Join us for our Oneness Celebration, a welcoming gathering inspired by the Christian tradition, where we celebrate our connection with God, one another and all creation. Through the remembrance of Jesus’ Last Supper, we come together in a spirit of love and unity, recognizing the Divine presence that connects us all.',
        'Followed by a potluck lunch.'
      ],
      repeat: { every: 'week', day: 0 },
      time: '10:00', minutes: 60, tz: INDY, confirmed: false,   // the Weekly says "10:00 am – 11:00 pm"
      mode: 'in-person', place: IIC,
      host: 'The Hermitage',
      kind: 'gathering',
      action: 'Come in person'
    },
    {
      id: 'contemplative-unity',
      title: 'Contemplative Unity',
      summary: 'Silent meditation, lightly guided: step out of the noise of the world into sacred stillness. In Indianapolis and on Zoom.',
      body: [
        'You are invited to step out of the noise of the world and enter into the sacred stillness of silent meditation, and connect deeply to the Divine Presence within.',
        'Contemplative Unity is a lightly guided meditation. Join us in the room in Indianapolis or on Zoom.'
      ],
      repeat: { every: 'week', day: 0 },
      time: '12:30', minutes: 60, tz: INDY, confirmed: true,
      mode: 'hybrid', place: IIC + ', and on Zoom',
      host: 'The Hermitage',
      kind: 'gathering',
      action: 'Sit with us'
    },
    {
      id: 'way-between',
      title: 'The Way Between',
      summary: 'For those walking the path of spirituality and shared discovery. It begins after the Sunday silent meditation.',
      body: [
        'A weekly gathering for those walking the path of spirituality and shared discovery. Rooted in contemplative practice and open-hearted dialogue, we explore the sacred space between tradition and emergence.',
        'We begin after Sunday’s silent meditation. All are welcome to rest, reflect and awaken together in the Presence that unites us. Join us in the room in Indianapolis or on Zoom.'
      ],
      repeat: { every: 'week', day: 0 },
      time: '13:30', minutes: 60, tz: INDY, confirmed: true,
      mode: 'hybrid', place: IIC + ', and on Zoom',
      host: 'The Hermitage',
      kind: 'gathering',
      action: 'Join us'
    },
    {
      id: 'train-your-mind',
      title: 'Train Your Mind: Meditation Foundations',
      summary: 'A rotating class in two phases of four sessions: modern science and ancient contemplative wisdom.',
      body: ['The next cohort’s dates will be announced here.'],
      repeat: { every: 'tbd' },
      note: 'Next cohort to be announced',
      tz: INDY, confirmed: false,
      mode: 'online', place: 'Online and in Indianapolis',
      host: 'Samuel Robinson',
      kind: 'program',
      href: 'programs/train-your-mind/',
      action: 'Learn more'
    }
  ];

  /* ------------------------------------------------------------ time math */
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // the offset (ms) of a time zone from UTC at a given instant
  function tzOffset(date, tz) {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(date).reduce(function (o, p) { o[p.type] = p.value; return o; }, {});
    var asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
    return asUTC - date.getTime();
  }
  // a wall-clock time in a zone -> the real instant
  function zoned(y, m, d, hh, mm, tz) {
    var guess = Date.UTC(y, m, d, hh, mm);
    var t = guess - tzOffset(new Date(guess), tz);
    return new Date(guess - tzOffset(new Date(t), tz));
  }
  // today's calendar date in a zone
  function dateIn(tz, at) {
    var p = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' })
      .formatToParts(at).reduce(function (o, x) { o[x.type] = x.value; return o; }, {});
    return { y: +p.year, m: +p.month - 1, d: +p.day };
  }

  // the next (or current) occurrence that has not yet ENDED
  function next(g, now) {
    now = now || new Date();
    if (!g.repeat || g.repeat.every !== 'week' || !g.time) return null;
    var hm = g.time.split(':').map(Number);
    var today = dateIn(g.tz, now);
    for (var i = -1; i < 8; i++) {
      var probe = new Date(Date.UTC(today.y, today.m, today.d + i, 12));
      if (probe.getUTCDay() !== g.repeat.day) continue;
      var start = zoned(probe.getUTCFullYear(), probe.getUTCMonth(), probe.getUTCDate(), hm[0], hm[1], g.tz);
      var end = new Date(start.getTime() + g.minutes * 60000);
      if (end > now) return { start: start, end: end, live: start <= now };
    }
    return null;
  }

  function occurrences(g, from, to) {
    var out = [], cursor = new Date(from.getTime() - 86400000);
    while (true) {
      var o = next(g, cursor);
      if (!o || o.start > to) break;
      if (o.start >= from) out.push(o);
      cursor = new Date(o.end.getTime() + 60000);
    }
    return out;
  }

  /* ----------------------------------------------------------- formatting */
  var viewerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  function fmt(date, opts) { return new Intl.DateTimeFormat(undefined, opts).format(date); }
  function fmtTime(d) { return fmt(d, { hour: 'numeric', minute: '2-digit' }); }
  function fmtZone(d) {
    var p = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(d).find(function (x) { return x.type === 'timeZoneName'; });
    return p ? p.value : '';
  }
  function whenText(g, o) {
    if (!o) return g.note || '';
    return fmt(o.start, { weekday: 'long' }) + 's · ' + fmtTime(o.start) + '–' + fmtTime(o.end) + ' ' + fmtZone(o.start);
  }
  function hostTimeText(g) {
    if (!g.time) return '';
    var hm = g.time.split(':').map(Number);
    var d = new Date(Date.UTC(2026, 0, 1, hm[0], hm[1]));
    return DAYS[g.repeat.day] + 's at ' + fmt(d, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }) + ' Indianapolis time';
  }
  function labelFor(g, o) {
    if (o) return DAYS[g.repeat.day].toUpperCase() + 'S';
    return { month: 'Monthly', tbd: 'To come' }[g.repeat.every] || '';
  }

  /* --------------------------------------------------------- add to calendar */
  function ics(g) {
    var o = next(g);
    if (!o) return null;
    var stamp = function (d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    var lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hermitage World//Gatherings//EN', 'BEGIN:VEVENT',
      'UID:' + g.id + '@hermitageworld.org',
      'DTSTAMP:' + stamp(new Date()),
      'DTSTART:' + stamp(o.start), 'DTEND:' + stamp(o.end),
      'RRULE:FREQ=WEEKLY',
      'SUMMARY:' + g.title, 'DESCRIPTION:' + g.summary.replace(/[,;]/g, '\\$&'),
      'LOCATION:' + g.place.replace(/[,;]/g, '\\$&'),
      'END:VEVENT', 'END:VCALENDAR'
    ];
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines.join('\r\n'));
  }

  /* ------------------------------------------------------------ rendering */
  var H = window.HW || { url: function (p) { return p; }, icon: function () { return ''; }, esc: function (s) { return s; } };
  var esc = H.esc;
  function eventHref(g) { return H.url(g.href || ('gatherings/event/?id=' + g.id)); }
  function draft(g) { return g.confirmed ? '' : ' <span class="draft-mark">time to confirm</span>'; }
  function modeTag(g) {
    if (g.mode === 'hybrid') return '<span class="tag">' + H.icon('online') + H.icon('location') + 'Online and in person</span>';
    var online = g.mode === 'online';
    return '<span class="tag">' + H.icon(online ? 'online' : 'location') + (online ? 'Online' : 'In person') + '</span>';
  }
  // a hybrid gathering belongs under both the Online and the In person filters
  function matches(g, filter) {
    if (filter === 'all' || g.kind === filter || g.mode === filter) return true;
    return g.mode === 'hybrid' && (filter === 'online' || filter === 'in-person');
  }

  function sorted(list) {
    var now = new Date();
    return list.map(function (g) { return { g: g, o: next(g, now) }; }).sort(function (a, b) {
      if (a.o && b.o) return a.o.start - b.o.start;
      return a.o ? -1 : b.o ? 1 : 0;
    });
  }

  // the home page's hairline board
  function renderBoard(el) {
    var limit = +el.getAttribute('data-limit') || 99;
    var items = sorted(GATHERINGS.filter(function (g) { return g.kind === 'gathering'; })).slice(0, limit);
    el.innerHTML = items.map(function (x) {
      var g = x.g, o = x.o;
      return '<div class="board__row">' +
        '<span class="board__label">' + esc(labelFor(g, o)) + (o ? '<small>' + esc(fmtTime(o.start) + ' ' + fmtZone(o.start)) + ' your time</small>' : '') + '</span>' +
        '<div><h3 class="board__title">' + esc(g.title) + '</h3><p class="board__text">' + esc(g.summary) + '</p>' +
          (o && o.live ? '<p class="board__meta"><span class="live">Happening now, until ' + esc(fmtTime(o.end)) + '</span></p>' : '') + '</div>' +
        '<a class="btn btn--sm board__action' + (o && o.live ? ' btn--solid' : '') + '" href="' + eventHref(g) + '">' + esc(o && o.live ? 'Join now' : g.action) + '</a>' +
      '</div>';
    }).join('');
  }

  // cards for /gatherings/ — data-filter="online|in-person|program|all"
  function renderCards(el) {
    var filter = el.getAttribute('data-filter') || 'all';
    var items = sorted(GATHERINGS.filter(function (g) {
      return matches(g, filter);
    }));
    el.innerHTML = items.map(function (x) {
      var g = x.g, o = x.o;
      var date = o
        ? '<div class="event__date"><span class="event__dow">' + esc(fmt(o.start, { weekday: 'short' })) + '</span><span class="event__day">' + esc(fmt(o.start, { day: 'numeric' })) + '</span></div>'
        : '<div class="event__date"><span class="event__dow">' + esc(labelFor(g, o)) + '</span></div>';
      return '<article class="event' + (o && o.live ? ' is-live' : '') + '">' + date +
        '<div><h3 class="event__title"><a href="' + eventHref(g) + '">' + esc(g.title) + '</a></h3>' +
        '<p class="event__when">' + esc(whenText(g, o)) + draft(g) + '</p>' +
        '<div class="event__meta cluster cluster--tight">' + (o && o.live ? '<span class="live">Happening now</span>' : '') + modeTag(g) +
          '<span class="tag">' + esc(g.host) + '</span></div></div>' +
      '</article>';
    }).join('') || '<p class="t-muted">Nothing here yet.</p>';
  }

  // the upcoming list for /calendar/ — the next N weeks, day by day
  function renderUpcoming(el) {
    var weeks = +el.getAttribute('data-weeks') || 4;
    var filter = el.getAttribute('data-filter') || 'all';
    var from = new Date(), to = new Date(Date.now() + weeks * 7 * 86400000);
    var rows = [];
    GATHERINGS.forEach(function (g) {
      if (!matches(g, filter)) return;
      occurrences(g, from, to).forEach(function (o) { rows.push({ g: g, o: o }); });
    });
    rows.sort(function (a, b) { return a.o.start - b.o.start; });
    var lastDay = '';
    el.innerHTML = rows.map(function (x) {
      var day = fmt(x.o.start, { weekday: 'long', month: 'long', day: 'numeric' });
      var head = day !== lastDay ? '<h3 class="calendar-day">' + esc(day) + '</h3>' : '';
      lastDay = day;
      return head + '<div class="board__row">' +
        '<span class="board__label">' + esc(fmtTime(x.o.start)) + '<small>' + esc(fmtZone(x.o.start)) + '</small></span>' +
        '<div><p class="board__title">' + esc(x.g.title) + '</p><div class="board__meta cluster cluster--tight">' +
          (x.o.live ? '<span class="live">Happening now</span>' : '') + modeTag(x.g) + draft(x.g) + '</div></div>' +
        '<a class="btn btn--sm board__action" href="' + eventHref(x.g) + '">Details</a></div>';
    }).join('') || '<p class="t-muted">Nothing scheduled in this view.</p>';
  }

  // a month grid for /calendar/ — data-offset="0" is this month
  function renderMonth(el) {
    var offset = +el.getAttribute('data-offset') || 0;
    var now = new Date();
    var first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    var last = new Date(first.getFullYear(), first.getMonth() + 1, 0, 23, 59);
    var byDay = {};
    GATHERINGS.forEach(function (g) {
      occurrences(g, first, last).forEach(function (o) {
        var k = o.start.getDate();
        (byDay[k] = byDay[k] || []).push({ g: g, o: o });
      });
    });
    var head = DAYS.map(function (d) { return '<span class="month__dow" aria-hidden="true">' + d.slice(0, 3) + '</span>'; }).join('');
    var cells = '';
    for (var i = 0; i < first.getDay(); i++) cells += '<span class="month__cell month__cell--empty"></span>';
    for (var d = 1; d <= last.getDate(); d++) {
      var isToday = offset === 0 && d === now.getDate();
      var items = (byDay[d] || []).sort(function (a, b) { return a.o.start - b.o.start; });
      cells += '<div class="month__cell' + (isToday ? ' is-today' : '') + '"><span class="month__num">' + d + '</span>' +
        items.map(function (x) {
          return '<a class="month__item" href="' + eventHref(x.g) + '">' + esc(fmtTime(x.o.start)) + ' ' + esc(x.g.title) + '</a>';
        }).join('') + '</div>';
    }
    el.innerHTML = '<div class="month__bar"><button class="icon-btn" type="button" data-month="-1" aria-label="Previous month">' + H.icon('arrow-left') + '</button>' +
      '<h2 class="t-h3" aria-live="polite">' + esc(fmt(first, { month: 'long', year: 'numeric' })) + '</h2>' +
      '<button class="icon-btn" type="button" data-month="1" aria-label="Next month">' + H.icon('arrow-right') + '</button></div>' +
      '<div class="month__grid">' + head + cells + '</div>';
    el.querySelectorAll('[data-month]').forEach(function (b) {
      b.addEventListener('click', function () {
        el.setAttribute('data-offset', offset + (+b.getAttribute('data-month')));
        renderMonth(el);
      });
    });
  }

  // the event detail page: ?id=
  function renderEvent(el) {
    var id = new URLSearchParams(location.search).get('id') || el.getAttribute('data-id');
    var g = GATHERINGS.filter(function (x) { return x.id === id; })[0] || GATHERINGS[0];
    var o = next(g);
    document.title = g.title + ' · Hermitage World';
    el.querySelectorAll('[data-g]').forEach(function (node) {
      var k = node.getAttribute('data-g');
      if (k === 'title') node.textContent = g.title;
      if (k === 'summary') node.textContent = g.summary;
      if (k === 'body') node.innerHTML = g.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
      if (k === 'when') node.innerHTML = esc(whenText(g, o) || g.note) + draft(g);
      if (k === 'host-time') node.textContent = hostTimeText(g) || g.note || '';
      if (k === 'place') node.textContent = g.place;
      if (k === 'host') node.textContent = g.host;
      if (k === 'mode') node.innerHTML = modeTag(g);
      if (k === 'live') node.innerHTML = o && o.live ? '<span class="live">Happening now, until ' + esc(fmtTime(o.end)) + '. You are not late.</span>' : '';
      if (k === 'ics') { var href = ics(g); if (href) { node.href = href; node.setAttribute('download', g.id + '.ics'); } else node.hidden = true; }
      if (k === 'action') node.textContent = o && o.live ? 'Join now' : g.action;
    });
  }

  window.HWGatherings = { list: GATHERINGS, next: next, occurrences: occurrences, viewerTZ: viewerTZ, fmt: fmt };

  function boot() {
    document.querySelectorAll('[data-gatherings]').forEach(function (el) {
      var kind = el.getAttribute('data-gatherings');
      var fn = { board: renderBoard, cards: renderCards, upcoming: renderUpcoming, event: renderEvent, month: renderMonth }[kind];
      if (!fn) return;
      fn(el);
      // keep "happening now" honest without a reload
      setInterval(function () { fn(el); }, 60000);
    });
    // filter chips: [data-gatherings-filter] radios retarget their sibling list
    document.querySelectorAll('[data-gatherings-filter]').forEach(function (group) {
      var target = document.querySelector(group.getAttribute('data-gatherings-filter'));
      group.addEventListener('change', function (e) {
        if (!target || !e.target.value) return;
        target.setAttribute('data-filter', e.target.value);
        ({ cards: renderCards, upcoming: renderUpcoming })[target.getAttribute('data-gatherings')](target);
      });
    });
    document.querySelectorAll('[data-viewer-tz]').forEach(function (n) { n.textContent = viewerTZ.replace(/_/g, ' '); });
  }
  if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
