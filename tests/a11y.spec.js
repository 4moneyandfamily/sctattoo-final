const { test, expect } = require('@playwright/test');

// --- contrast maths (WCAG 2.1 relative luminance) -------------------------
function lum(rgb) {
  const c = rgb.map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
const parse = s => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.card').first()).toBeVisible();
});

test('landmarks and a single h1', async ({ page }) => {
  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  // every section is labelled by its own heading
  for (const id of ['gallery', 'crew', 'book', 'find', 'aftercare']) {
    const by = await page.locator(`#${id}`).getAttribute('aria-labelledby');
    expect(by, id).toBeTruthy();
    await expect(page.locator(`#${by}`)).toHaveCount(1);
  }
});

test('heading order never skips a level', async ({ page }) => {
  const levels = await page.$$eval('h1,h2,h3,h4,h5,h6', els => els.map(e => +e.tagName[1]));
  let prev = levels[0];
  expect(prev).toBe(1);
  for (const l of levels.slice(1)) {
    expect(l - prev, `jumped from h${prev} to h${l}`).toBeLessThanOrEqual(1);
    prev = l;
  }
});

test('every gallery image has meaningful alt text', async ({ page }) => {
  const alts = await page.$$eval('#grid img', els => els.map(e => e.getAttribute('alt')));
  expect(alts.length).toBeGreaterThan(0);
  for (const a of alts) {
    expect(a).not.toBeNull();
    // an empty alt would only be correct on a blurred cover, and none is in use
    if (a !== '') expect(a.length).toBeGreaterThan(10);
  }
  // decorative svgs must be hidden from the accessibility tree
  const svgs = await page.$$eval('#grid svg', els => els.map(e => e.getAttribute('aria-hidden')));
  for (const h of svgs) expect(h).toBe('true');
});

test('every control is reachable by keyboard and labelled', async ({ page }) => {
  const unlabelled = await page.$$eval(
    'button, a[href], input, select, textarea',
    els => els.filter(e => {
      if (e.type === 'hidden') return false;            // not a control
      if (e.closest('[hidden]') || e.closest('.hidden')) return false;
      if (e.tabIndex < 0) return false;
      const text = (e.textContent || '').trim();
      const label = e.getAttribute('aria-label') || e.getAttribute('title') || '';
      const assoc = e.id ? document.querySelector(`label[for="${e.id}"]`) : null;
      const wrapped = e.closest('label');
      return !text && !label && !assoc && !wrapped && !e.getAttribute('aria-labelledby');
    }).map(e => e.tagName + (e.id ? '#' + e.id : '') + '.' + e.className)
  );
  expect(unlabelled).toEqual([]);
});

test('the skip link is the first focus stop and reaches the gallery', async ({ page }) => {
  await page.keyboard.press('Tab');
  const cls = await page.evaluate(() => document.activeElement.className);
  expect(cls).toContain('skip');
  await expect(page.locator('.skip')).toBeVisible();
  expect(await page.locator('.skip').getAttribute('href')).toBe('#gallery');
});

test('focus is always visible, never suppressed', async ({ page }) => {
  await page.locator('#more').focus();
  const ring = await page.locator('#more').evaluate(el => {
    const s = getComputedStyle(el);
    return { w: s.outlineWidth, style: s.outlineStyle, color: s.outlineColor };
  });
  expect(ring.style).not.toBe('none');
  expect(parseFloat(ring.w)).toBeGreaterThanOrEqual(2);
});

test('touch targets are at least 44px', async ({ page }) => {
  const sel = '.filters button, .btn, .dock a, .quick a, #v-close, summary, .card';
  const small = await page.$$eval(sel, els => els
    .filter(e => e.offsetParent !== null)
    .map(e => ({ id: e.id || e.className, h: e.getBoundingClientRect().height, w: e.getBoundingClientRect().width }))
    .filter(r => r.h < 44 || r.w < 44));
  expect(small).toEqual([]);
});

test('body, caption and footer text all clear WCAG AA contrast', async ({ page }) => {
  const samples = await page.$$eval(
    // Everything that carries type, including every gilded surface: the
    // headings, the active filter chip, the photo-count badge and the open
    // pill all put dark type on gold or gold type on black, and gold is the
    // easiest colour in the palette to brighten into failing.
    'body, .muted, .card-cap span, .card-cap b, .filter-label, .legal, .foot-head, footer a,'
    + ' .eyebrow, .form-note, .v-by, h2, .script, .filters button, .count, .pill, legend,'
    + ' .hours-now, .hours-list li, .btn, .dock a, .artist .handle, .artist .seework,'
    + ' .v-title, .v-counter, .steps-how h3, .steps-how p, .lede, address, ol.care li, summary',
    els => els.slice(0, 90).map(e => {
      // walk up for the first non-transparent background
      let bg = 'rgba(0, 0, 0, 0)', n = e;
      while (n && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
        bg = getComputedStyle(n).backgroundColor; n = n.parentElement;
      }
      const s = getComputedStyle(e);
      return { sel: e.className || e.tagName, fg: s.color, bg,
               size: parseFloat(s.fontSize), weight: s.fontWeight };
    }));
  const fails = [];
  for (const s of samples) {
    const r = ratio(parse(s.fg), parse(s.bg));
    const large = s.size >= 24 || (s.size >= 18.66 && +s.weight >= 700);
    const need = large ? 3 : 4.5;
    if (r < need) fails.push(`${s.sel}: ${r.toFixed(2)} < ${need} (${s.fg} on ${s.bg}, ${s.size}px)`);
  }
  expect(fails).toEqual([]);
});

test('reduced motion switches off smooth scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('.card').first()).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  await page.locator('#artist-filters button', { hasText: /^James Whelan$/ }).click();
  await page.locator('#card-set-james-dragon-sleeve').click();
  expect(await page.locator('#v-rail').evaluate(el => getComputedStyle(el).scrollBehavior)).toBe('auto');
  // and navigation still works without animation
  await page.locator('#v-next').click();
  await expect(page.locator('#v-counter')).toHaveText('2 / 11');
});

test('nothing autoplays and no element animates on load', async ({ page }) => {
  expect(await page.locator('video, audio, [autoplay]').count()).toBe(0);
  const running = await page.evaluate(() =>
    document.getAnimations().filter(a => a.playState === 'running').length);
  expect(running).toBe(0);
});

test('no card is behind a cover, including the back-piece set', async ({ page }) => {
  // The shop asked for the nude back-piece set shown like any other card, so
  // nothing on the site is gated. Guards against a cover creeping back in.
  const gated = await page.evaluate(() => window.SITE.projects.filter(p => p.sensitive).map(p => p.id));
  expect(gated).toEqual([]);
  await expect(page.locator('.card-shot.is-veiled')).toHaveCount(0);
  await expect(page.locator('.veil')).toHaveCount(0);

  // the back-piece set opens on the first tap, like everything else
  await page.locator('#style-filters button', { hasText: /^Traditional$/ }).click();
  await page.locator('#card-set-goddess-bodysuit').click();
  await expect(page.locator('#viewer')).toHaveJSProperty('open', true);
  await expect(page.locator('#v-rail .v-slide')).toHaveCount(4);
});

test('the cover mechanism still works if a photo is ever flagged', async ({ page }) => {
  // Nothing uses it today, but README documents `sensitive: true` as the way
  // to gate a future photo, so the mechanism has to stay working.
  await page.addInitScript(() => {
    Object.defineProperty(window, 'SITE', {
      configurable: true,
      set(v) {
        delete window.SITE;
        window.SITE = v;
        const p = v.projects.find(x => x.id === 'set-goddess-bodysuit');
        if (p) p.sensitive = true;
      },
      get() { return undefined; },
    });
  });
  await page.goto('/');
  await page.locator('#style-filters button', { hasText: /^Traditional$/ }).click();

  const card = page.locator('#card-set-goddess-bodysuit');
  await expect(card.locator('.card-shot.is-veiled')).toHaveCount(1);
  await expect(card.locator('.veil')).toContainText('Nudity');
  expect(await card.getAttribute('aria-label')).toContain('contains nudity');

  await card.click();                                     // first tap lifts the cover
  await expect(page.locator('#viewer')).toHaveJSProperty('open', false);
  await expect(page.locator('#card-set-goddess-bodysuit .card-shot.is-veiled')).toHaveCount(0);

  await page.locator('#card-set-goddess-bodysuit').click();   // second tap opens it
  await expect(page.locator('#viewer')).toHaveJSProperty('open', true);
});

test('the page uses the shop’s palette and nothing else', async ({ page }) => {
  // Greg named four colours plus white: black, gray, red, gold, white. This
  // pins them, because a palette is the easiest thing in a stylesheet for a
  // later edit to drift away from one convenient hex at a time.
  const tok = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    const names = ['--ink', '--ink-2', '--ink-3', '--gray', '--gray-2', '--gray-text',
                   '--white', '--red', '--red-lt', '--gold', '--gold-lt'];
    return Object.fromEntries(names.map(n => [n, s.getPropertyValue(n).trim()]));
  });
  for (const [n, v] of Object.entries(tok)) {
    expect(v, `${n} is not defined`).toMatch(/^#[0-9A-Fa-f]{6}$/);
  }

  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const hue = (h) => {
    const [r, g, b] = hex(h).map(v => v / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    if (d < 0.04) return 'neutral';                    // black, gray, white
    let deg = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    deg = (deg * 60 + 360) % 360;
    if (deg < 20 || deg > 340) return 'red';
    if (deg >= 35 && deg <= 60) return 'gold';
    return 'off-palette:' + Math.round(deg);
  };
  // the three blacks, two grays and the white must be neutral, not tinted
  for (const n of ['--ink', '--ink-2', '--ink-3', '--gray', '--gray-2', '--gray-text', '--white']) {
    expect(hue(tok[n]), `${n} (${tok[n]}) should be neutral`).toBe('neutral');
  }
  expect(hue(tok['--red']), tok['--red']).toBe('red');
  expect(hue(tok['--red-lt']), tok['--red-lt']).toBe('red');
  expect(hue(tok['--gold']), tok['--gold']).toBe('gold');
  expect(hue(tok['--gold-lt']), tok['--gold-lt']).toBe('gold');

  // and no stylesheet rule may reintroduce a colour from outside it
  const css = await (await page.request.get('/assets/css/app.css')).text();
  const stray = [...css.matchAll(/#[0-9A-Fa-f]{3,6}\b/g)].map(m => m[0].toUpperCase())
    .filter(h => h.length === 7)
    .filter(h => !Object.values(tok).map(v => v.toUpperCase()).includes(h))
    .filter(h => !['#000000', '#FFFFFF', '#000', '#FFF'].includes(h));
  expect(stray, 'hex values outside the palette block').toEqual([]);
});
