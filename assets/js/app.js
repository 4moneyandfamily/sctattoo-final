/* San Clemente Tattoo — all of the site's behaviour.
 *
 * Data comes from data/site.js (window.SITE), which is the only place gallery
 * or shop facts are defined. Nothing here invents content: every caption,
 * credit, hour and phone number is read straight out of that file.
 */
(function () {
  'use strict';

  var SITE = window.SITE;
  var $ = function (id) { return document.getElementById(id); };

  /* ---- preview deployments must not compete with the real domain --------- */
  var CANON = 'sanclementetattoo.com';
  if (location.hostname && location.hostname !== CANON && location.hostname !== 'www.' + CANON) {
    var m = document.createElement('meta');
    m.name = 'robots';
    m.content = 'noindex, nofollow';
    document.head.appendChild(m);
  }

  /* ---- if the data file failed to load, say so instead of showing nothing  */
  if (!SITE || !Array.isArray(SITE.projects)) {
    var g = $('grid');
    if (g) {
      g.innerHTML = '';
      var warn = document.createElement('p');
      warn.className = 'empty';
      warn.id = 'data-failed';
      warn.setAttribute('role', 'alert');
      warn.textContent = 'The gallery could not load. Call the shop at (949) 498-8487 — we are still open.';
      g.parentNode.insertBefore(warn, g);
    }
    return;
  }

  var WIDTHS = [360, 540, 720, 1080];
  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  var artistName = function (id) {
    for (var i = 0; i < SITE.artists.length; i++) if (SITE.artists[i].id === id) return SITE.artists[i].name;
    return '';
  };

  /* Same rule tools/build-images.mjs uses, so srcset never points at a file
     that was skipped for being an upscale. */
  function variants(photo) {
    var av = WIDTHS.filter(function (w) { return w <= photo.w; });
    return av.length ? av : [photo.w];
  }
  function base(photo) { return 'assets/g/' + photo.f.replace(/\.jpg$/, ''); }
  function srcset(photo) {
    return variants(photo).map(function (w) { return base(photo) + '-' + w + '.webp ' + w + 'w'; }).join(', ');
  }
  function fallbackSrc(photo) {
    var v = variants(photo);
    return base(photo) + '-' + v[v.length - 1] + '.webp';
  }
  /* Alt text describes the work. Credit is in the caption next to the card, so
     repeating it in alt would just be noise for a screen reader. */
  function altFor(photo, project) {
    var who = project && project.artistId ? ' by ' + artistName(project.artistId) : '';
    return photo.cap + ' — tattoo' + who + ' at San Clemente Tattoo';
  }

  /* ====================================================================== */
  /* Open / closed                                                          */
  /* ====================================================================== */
  function hm(s) { var p = s.split(':'); return (+p[0]) * 60 + (+p[1]); }

  function status() {
    var now = new Date();
    var f = new Intl.DateTimeFormat('en-US', {
      timeZone: SITE.hours.timezone, weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    });
    var parts = {};
    f.formatToParts(now).forEach(function (p) { parts[p.type] = p.value; });
    var mins = (+parts.hour) * 60 + (+parts.minute);
    var row = null;
    SITE.hours.weekly.forEach(function (d) { if (d.day === parts.weekday) row = d; });
    return {
      day: parts.weekday,
      row: row,
      open: !!row && mins >= hm(row.open) && mins < hm(row.close),
      clock: new Intl.DateTimeFormat('en-US', { timeZone: SITE.hours.timezone, hour: 'numeric', minute: '2-digit' }).format(now)
    };
  }

  function paintStatus() {
    var s = status();
    var pill = $('status-pill'), when = $('status-when'), book = $('book-status');
    if (pill) {
      pill.textContent = s.open ? 'Open now' : 'Closed';
      pill.classList.toggle('open', s.open);
      pill.classList.toggle('shut', !s.open);
    }
    if (when) when.textContent = s.open ? 'Until 8 pm Pacific' : 'Noon to 8 pm Pacific · now ' + s.clock + ' Pacific';
    if (book) {
      book.textContent = s.open
        ? 'The shop is open. Walk in, or send a request if you want a held time.'
        : 'The shop is closed right now. Send a request and we will answer when we open, or call during hours.';
    }
    var list = $('hours-list');
    if (list) list.querySelectorAll('li').forEach(function (li) {
      li.setAttribute('data-today', String(li.getAttribute('data-day') === s.day));
    });
  }

  /* ====================================================================== */
  /* Gallery                                                               */
  /* ====================================================================== */
  var PAGE = 24;
  var styleFilter = 'All';
  var artistFilter = 'All';
  var shown = PAGE;
  var matches = [];
  var revealed = Object.create(null);   // project id -> sensitive cover lifted

  function computeMatches() {
    matches = SITE.projects.filter(function (p) {
      return (styleFilter === 'All' || p.style === styleFilter)
        && (artistFilter === 'All' || p.artistId === artistFilter);
    });
  }

  function cardHTML(p, i, eager) {
    var cover = p.photos[0];
    var n = p.photos.length;
    var veiled = p.sensitive && !revealed[p.id];
    var label = veiled
      ? 'Show ' + p.title + ' — contains nudity'
      : p.title + (n > 1 ? ', ' + n + ' photos' : '') + '. Open photo viewer';
    return '<button class="card" type="button" data-i="' + i + '" id="card-' + esc(p.id) + '"' +
      ' aria-label="' + esc(label) + '">' +
      '<span class="card-shot' + (veiled ? ' is-veiled' : '') + '">' +
      '<img src="' + esc(fallbackSrc(cover)) + '" srcset="' + esc(srcset(cover)) + '"' +
      ' sizes="(min-width:1280px) 295px, (min-width:1100px) 23vw, (min-width:700px) 31vw, 45vw"' +
      ' width="' + cover.w + '" height="' + cover.h + '"' +
      ' alt="' + (veiled ? '' : esc(altFor(cover, p))) + '"' +
      ' loading="' + (eager ? 'eager' : 'lazy') + '" decoding="async"' +
      ' fetchpriority="' + (eager ? 'high' : 'auto') + '">' +
      (veiled ? '<span class="veil"><b>Nudity</b><span>Tap to view</span></span>' : '') +
      (n > 1 && !veiled
        ? '<span class="count"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/></svg>' + n + '</span>'
        : '') +
      '</span>' +
      '<span class="card-cap"><b>' + esc(p.title) + '</b>' +
      '<span>' + esc(p.style) + (p.artistId ? ' · ' + esc(artistName(p.artistId)) : '') + '</span></span>' +
      '</button>';
  }

  function paintGrid() {
    computeMatches();
    var grid = $('grid'), empty = $('grid-empty'), more = $('more'), tally = $('tally');
    if (!grid) return;
    var slice = matches.slice(0, shown);
    grid.innerHTML = slice.map(function (p, i) { return cardHTML(p, i, i < 4); }).join('');
    if (empty) empty.classList.toggle('hidden', matches.length > 0);
    if (more) {
      var left = matches.length - slice.length;
      more.classList.toggle('hidden', left <= 0);
      more.textContent = 'Show ' + Math.min(PAGE, left) + ' more';
    }
    if (tally) {
      tally.textContent = matches.length
        ? 'Showing ' + slice.length + ' of ' + matches.length + (matches.length === 1 ? ' piece' : ' pieces')
        : '';
    }
  }

  /* A photo that 404s gets a labelled placeholder instead of a broken icon. */
  document.addEventListener('error', function (e) {
    var el = e.target;
    if (!el || el.tagName !== 'IMG' || el.dataset.failed) return;
    el.dataset.failed = '1';
    var holder = el.closest('.card-shot') || el.parentNode;
    if (!holder) return;
    el.remove();
    var ph = document.createElement('span');
    ph.className = 'broken';
    ph.textContent = 'Photo unavailable';
    holder.appendChild(ph);
  }, true);

  function onGridClick(e) {
    var btn = e.target.closest('.card');
    if (!btn) return;
    var p = matches[+btn.dataset.i];
    if (!p) return;
    if (p.sensitive && !revealed[p.id]) {   // first tap lifts the cover only
      revealed[p.id] = true;
      paintGrid();
      var again = $('card-' + p.id);
      if (again) again.focus();
      return;
    }
    openViewer(p, 0, btn);
  }

  /* ====================================================================== */
  /* Viewer                                                                */
  /* ====================================================================== */
  var dlg = $('viewer');
  var rail = $('v-rail');
  var current = null;     // project on screen
  var index = 0;
  var opener = null;      // element to hand focus back to
  var pushedState = false;
  var scrollY = 0;

  function reduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function openViewer(project, start, trigger) {
    if (!dlg || !project) return;
    current = project;
    index = Math.min(Math.max(start | 0, 0), project.photos.length - 1);
    opener = trigger || null;
    var single = project.photos.length < 2;

    $('v-title').textContent = project.title;
    $('v-by').textContent = project.style + (project.artistId ? ' · ' + artistName(project.artistId) : '');
    dlg.classList.toggle('v-single', single);

    rail.innerHTML = project.photos.map(function (ph, i) {
      return '<div class="v-slide" data-i="' + i + '" role="group" aria-roledescription="slide"' +
        ' aria-label="Photo ' + (i + 1) + ' of ' + project.photos.length + '">' +
        '<img src="' + esc(fallbackSrc(ph)) + '" srcset="' + esc(srcset(ph)) + '"' +
        ' sizes="(min-width:58rem) 56rem, 96vw"' +
        ' width="' + ph.w + '" height="' + ph.h + '"' +
        ' alt="' + esc(altFor(ph, project)) + '"' +
        ' loading="' + (i === index ? 'eager' : 'lazy') + '" decoding="async">' +
        '</div>';
    }).join('');

    $('v-dots').innerHTML = single ? '' : project.photos.map(function (ph, i) {
      return '<li><button type="button" data-i="' + i + '" aria-current="' + (i === index) + '"' +
        ' aria-label="Photo ' + (i + 1) + '">' +
        '<img src="' + esc(base(ph) + '-' + variants(ph)[0] + '.webp') + '" width="40" height="40" alt="" loading="lazy"></button></li>';
    }).join('');

    /* The page scrolls smoothly, so a card tapped while a jump is still
       animating would leave us saving a mid-flight offset and restoring the
       wrong position on close. An instant scroll to the current position
       cancels the animation first. */
    try { window.scrollTo({ top: window.scrollY, left: window.scrollX, behavior: 'instant' }); }
    catch (_) { window.scrollTo(window.scrollX, window.scrollY); }
    scrollY = window.scrollY;
    document.documentElement.classList.add('viewer-open');
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');

    goTo(index, false);
    paintMeta();
    $('v-close').focus();

    // Give the phone's back gesture something to pop, so back closes the
    // viewer instead of leaving the page. If we got here from a deep link the
    // hash is already ours, so pushing again would need two taps to leave.
    pushedState = false;
    if (location.hash !== '#work/' + project.id) {
      try {
        history.pushState({ viewer: project.id }, '', '#work/' + project.id);
        pushedState = true;
      } catch (_) { pushedState = false; }
    }
  }

  function closeViewer() {
    if (!dlg || !dlg.open) return;
    if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
  }

  function afterClose() {
    document.documentElement.classList.remove('viewer-open');
    window.scrollTo(0, scrollY);
    rail.innerHTML = '';
    $('v-dots').innerHTML = '';
    var back = opener;
    current = null; opener = null;
    if (back && document.contains(back)) back.focus();
    if (pushedState) {
      pushedState = false;
      if (history.state && history.state.viewer) history.back();
      else try { history.replaceState(null, '', location.pathname + location.search); } catch (_) {}
    }
  }

  /* While we are driving the rail ourselves, ignore its scroll events —
     otherwise the debounced handler reads a half-finished position and
     rewrites the counter to the wrong slide. */
  var syncUntil = 0;

  function goTo(i, animate) {
    if (!current) return;
    var from = index;
    index = (i + current.photos.length) % current.photos.length;
    var slide = rail.children[index];
    if (!slide) return;
    /* Animate only a single step. Sliding across nine photos is both a blur to
       look at and unreliable inside a mandatory snap container, so a jump of
       more than one goes straight there. */
    var oneStep = Math.abs(index - from) === 1;
    var smooth = animate !== false && oneStep && !reduced();
    syncUntil = Date.now() + (smooth ? 700 : 250);
    var left = slide.offsetLeft - rail.offsetLeft;
    if (rail.scrollTo) rail.scrollTo({ left: left, behavior: smooth ? 'smooth' : 'auto' });
    else rail.scrollLeft = left;
    paintMeta();
  }

  function paintMeta() {
    if (!current) return;
    var ph = current.photos[index];
    $('v-counter').textContent = (index + 1) + ' / ' + current.photos.length;
    $('v-cap').textContent = ph ? ph.cap : '';
    $('v-prev').disabled = current.photos.length < 2;
    $('v-next').disabled = current.photos.length < 2;
    var dots = $('v-dots').querySelectorAll('button');
    for (var i = 0; i < dots.length; i++) dots[i].setAttribute('aria-current', String(i === index));
  }

  /* Keep the counter honest when someone swipes instead of tapping. */
  var settle;
  if (rail) rail.addEventListener('scroll', function () {
    clearTimeout(settle);
    settle = setTimeout(function () {
      if (!current || Date.now() < syncUntil) return;
      var mid = rail.scrollLeft + rail.clientWidth / 2;
      var best = 0, bestD = Infinity;
      for (var i = 0; i < rail.children.length; i++) {
        var c = rail.children[i];
        var d = Math.abs(c.offsetLeft - rail.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < bestD) { bestD = d; best = i; }
      }
      if (best !== index) { index = best; paintMeta(); }
    }, 90);
  }, { passive: true });

  /* ====================================================================== */
  /* Static sections                                                        */
  /* ====================================================================== */
  function chips(host, items, currentLabel, onPick) {
    host.innerHTML = items.map(function (v) {
      return '<li><button type="button" aria-pressed="' + (v === currentLabel) + '">' + esc(v) + '</button></li>';
    }).join('');
    host.querySelectorAll('button').forEach(function (b, i) {
      b.addEventListener('click', function () { onPick(items[i]); });
    });
  }

  function paintChips() {
    chips($('style-filters'), ['All'].concat(SITE.styles), styleFilter, function (v) {
      styleFilter = v; shown = PAGE; paintChips(); paintGrid();
    });
    var names = SITE.artists.map(function (a) { return a.name; });
    var label = artistFilter === 'All' ? 'All' : artistName(artistFilter);
    chips($('artist-filters'), ['All'].concat(names), label, function (v) {
      if (v === 'All') artistFilter = 'All';
      else SITE.artists.forEach(function (a) { if (a.name === v) artistFilter = a.id; });
      shown = PAGE; paintChips(); paintGrid();
    });
  }

  function paintStatic() {
    $('crew-grid').innerHTML = SITE.artists.map(function (a) {
      return '<button class="artist" type="button" data-artist="' + esc(a.id) + '">' +
        '<h3>' + esc(a.name) + '</h3>' +
        '<span class="handle">@' + esc(a.handle) + (a.role === 'Owner' ? ' · Owner' : '') + '</span>' +
        '<p>' + esc(a.bio) + '</p>' +
        '<span class="seework">See their work &rarr;</span></button>';
    }).join('');
    $('crew-grid').querySelectorAll('.artist').forEach(function (b) {
      b.addEventListener('click', function () {
        artistFilter = b.dataset.artist;
        styleFilter = 'All';
        shown = PAGE;
        paintChips(); paintGrid();
        $('gallery').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
        var h = $('gallery').querySelector('h2');
        if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
      });
    });

    $('footer-ig').innerHTML =
      '<li><a href="' + esc(SITE.shop.instagram) + '">@' + esc(SITE.shop.instagramHandle) + '</a> · the shop</li>' +
      SITE.artists.map(function (a) {
        return '<li><a href="' + esc(a.instagram) + '">@' + esc(a.handle) + '</a> · ' + esc(a.name) + '</li>';
      }).join('');

    $('artist').innerHTML = '<option value="">No preference</option>' +
      SITE.artists.map(function (a) { return '<option value="' + esc(a.name) + '">' + esc(a.name) + '</option>'; }).join('');

    $('faq-list').innerHTML = SITE.faq.map(function (qa) {
      return '<details><summary>' + esc(qa[0]) + '</summary><p>' + esc(qa[1]) + '</p></details>';
    }).join('');

    $('hours-list').innerHTML = SITE.hours.weekly.map(function (d) {
      return '<li data-day="' + esc(d.day) + '"><span>' + esc(d.day) + '</span><span>Noon &ndash; 8 pm</span></li>';
    }).join('');

    var strip = $('shop-strip');
    if (strip) strip.innerHTML = SITE.shopPhotos.map(function (ph) {
      return '<img src="' + esc(fallbackSrc(ph)) + '" srcset="' + esc(srcset(ph)) + '" sizes="160px"' +
        ' width="' + ph.w + '" height="' + ph.h + '" alt="' + esc(ph.cap) + '" loading="lazy" decoding="async">';
    }).join('');
  }

  /* ====================================================================== */
  /* Booking form                                                           */
  /* ====================================================================== */
  var form = $('booking-form');
  var openedAt = Date.now();

  /* Dry run: log the inquiry, show what would have been sent, post nothing.
     On by default anywhere that is not the live domain, so local and preview
     testing can never drop a fake booking in the shop's inbox. */
  function isDryRun() {
    var q = new URLSearchParams(location.search);
    if (q.get('dryrun') === '1') return true;
    if (q.get('dryrun') === '0') return false;
    return location.hostname !== CANON && location.hostname !== 'www.' + CANON;
  }

  /* A form that silently stops working is worse than no form. Every failure is
     reported: loud console error, an optional beacon to SITE.forms.alert, and a
     visible error state that hands the visitor the phone number. */
  function reportFailure(detail) {
    var payload = {
      at: new Date().toISOString(), where: location.href,
      kind: 'booking-form-failure', detail: String(detail)
    };
    console.error('[booking] submission failed — inquiry NOT delivered', payload);
    var url = SITE.forms && SITE.forms.alert;
    if (url && navigator.sendBeacon) {
      try { navigator.sendBeacon(url, new Blob([JSON.stringify(payload)], { type: 'application/json' })); } catch (_) {}
    }
  }

  /* Catches the wiring being broken by a future edit, which is how these
     forms usually die. */
  function auditForm() {
    if (!form) return;
    var bad = [];
    if (form.getAttribute('name') !== 'booking') bad.push('name="booking" missing');
    if (form.getAttribute('data-netlify') !== 'true') bad.push('data-netlify="true" missing');
    if (!form.querySelector('input[name="form-name"][value="booking"]')) bad.push('hidden form-name input missing');
    if (form.getAttribute('method') !== 'POST') bad.push('method is not POST');
    if (bad.length) console.error('[booking] form wiring is broken, submissions will be lost:', bad.join('; '));
  }

  function showResult(cls, html) {
    var box = $('form-result');
    box.hidden = false;
    box.className = 'result ' + cls;
    box.innerHTML = html;
    box.focus();
  }

  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    $('form-error').textContent = '';

    if (!form.checkValidity()) {
      // Query the controls, not ':invalid' on its own — a <fieldset> wrapping an
      // invalid control is itself :invalid, and a fieldset cannot take focus.
      var first = form.querySelector('input:invalid, select:invalid, textarea:invalid');
      $('form-error').textContent = 'Check the highlighted fields and send again.';
      if (first) {
        first.focus({ preventScroll: true });
        first.scrollIntoView({ block: 'center' });   // instant: they need to see it now
      }
      return;
    }
    if (form.elements['bot-field'] && form.elements['bot-field'].value) return;  // honeypot
    if (Date.now() - openedAt < 3000) {                                          // time trap
      $('form-error').textContent = 'Give that one more second, then send again.';
      return;
    }

    var fd = new FormData(form);
    var btn = $('send');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    var restore = function () { btn.disabled = false; btn.textContent = 'Send booking request'; };

    if (isDryRun()) {
      var dump = {};
      fd.forEach(function (v, k) {
        if (k === 'bot-field' || k === 'form-name') return;
        dump[k] = (v && v.name) ? '[file: ' + v.name + ']' : v;
      });
      console.info('[booking] DRY RUN — nothing was sent to the shop:', dump);
      showResult('dry',
        '<p><strong>Dry run.</strong> Nothing was sent to the shop. The filled-in request is in the browser console.</p>' +
        '<p>This page is not the live site, so booking requests are logged instead of delivered.</p>');
      restore();
      return;
    }

    // Netlify Forms: multipart keeps the optional reference photo attached.
    fetch(location.pathname, { method: 'POST', body: fd })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        showResult('ok',
          '<p><strong>Request sent.</strong> The shop answers during open hours, noon to 8 pm Pacific.</p>' +
          '<p>In a hurry? Call <a href="' + esc(SITE.shop.phoneHref) + '">' + esc(SITE.shop.phone) + '</a>.</p>');
        form.reset();
        openedAt = Date.now();
      })
      .catch(function (err) {
        reportFailure(err && err.message);
        var body = [
          'Idea: ' + (fd.get('idea') || ''), 'Artist: ' + (fd.get('artist') || 'No preference'),
          'Size: ' + (fd.get('size') || ''), 'Placement: ' + (fd.get('placement') || ''),
          'Cover-up: ' + (fd.get('coverup') ? 'Yes' : 'No'), 'Name: ' + (fd.get('name') || ''),
          'Phone: ' + (fd.get('phone') || ''), 'Email: ' + (fd.get('email') || ''),
          '18 or older: ' + (fd.get('age18') ? 'Yes' : 'No')
        ].join('\n');
        var mailto = 'mailto:' + SITE.shop.email +
          '?subject=' + encodeURIComponent('Booking request — ' + (fd.get('name') || '')) +
          '&body=' + encodeURIComponent(body);
        showResult('bad',
          '<p><strong>That did not go through.</strong> Your request was not delivered, so please use one of these instead:</p>' +
          '<p><a href="' + esc(SITE.shop.phoneHref) + '">Call ' + esc(SITE.shop.phone) + '</a>' +
          ' &nbsp;·&nbsp; <a href="' + esc(mailto) + '">Send it as an email</a> (opens with your details filled in).</p>');
      })
      .then(restore, restore);
  });

  /* ====================================================================== */
  /* Wiring                                                                 */
  /* ====================================================================== */
  var grid = $('grid');
  if (grid) grid.addEventListener('click', onGridClick);

  var more = $('more');
  if (more) more.addEventListener('click', function () {
    var firstNew = shown;
    shown += PAGE;
    paintGrid();
    var card = grid.querySelectorAll('.card')[firstNew];
    if (card) card.focus();
  });

  if (dlg) {
    $('v-close').addEventListener('click', closeViewer);
    $('v-prev').addEventListener('click', function () { goTo(index - 1, true); });
    $('v-next').addEventListener('click', function () { goTo(index + 1, true); });
    $('v-dots').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) goTo(+b.dataset.i, true);
    });
    dlg.addEventListener('close', afterClose);
    // Clicking the backdrop closes, but a drag that starts on a photo must not.
    dlg.addEventListener('pointerdown', function (e) { if (e.target === dlg) closeViewer(); });
    dlg.addEventListener('keydown', function (e) {
      if (!current) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1, true); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1, true); }
      else if (e.key === 'Home') { e.preventDefault(); goTo(0, true); }
      else if (e.key === 'End') { e.preventDefault(); goTo(current.photos.length - 1, true); }
      // Escape is handled natively by <dialog>, which fires cancel then close.
    });
  }

  window.addEventListener('popstate', function () {
    if (dlg && dlg.open) { pushedState = false; closeViewer(); }
    else route();
  });

  /* Deep links. #work/<project-id> is the current form; #piece-<photo-id> is
     kept working because it is what the old gallery put in people's history.
     Anything unrecognised is ignored rather than throwing. */
  function findByHash(hash) {
    var raw = String(hash || '').replace(/^#/, '');
    var h;
    // decodeURIComponent throws URIError on a malformed escape such as "#%%%",
    // and a hash is whatever someone chooses to paste in the address bar.
    try { h = decodeURIComponent(raw); } catch (_) { h = raw; }
    if (!h) return null;
    var i, j;
    if (h.indexOf('work/') === 0) {
      var id = h.slice(5);
      for (i = 0; i < SITE.projects.length; i++) if (SITE.projects[i].id === id) return { p: SITE.projects[i], at: 0 };
      return null;
    }
    if (h.indexOf('piece-') === 0) {
      var file = h.slice(6) + '.jpg';
      for (i = 0; i < SITE.projects.length; i++) {
        for (j = 0; j < SITE.projects[i].photos.length; j++) {
          if (SITE.projects[i].photos[j].f === file) return { p: SITE.projects[i], at: j };
        }
      }
    }
    return null;
  }

  function route() {
    var hit = findByHash(location.hash);
    if (!hit) return;
    if (hit.p.sensitive) revealed[hit.p.id] = true;
    styleFilter = 'All'; artistFilter = 'All';
    var at = SITE.projects.indexOf(hit.p);
    shown = Math.max(PAGE, Math.ceil((at + 1) / PAGE) * PAGE);
    paintChips(); paintGrid();
    openViewer(hit.p, hit.at, $('card-' + hit.p.id));
  }

  paintStatus();
  paintStatic();
  paintChips();
  paintGrid();
  auditForm();
  setInterval(paintStatus, 60000);
  route();
})();
