const { test, expect } = require('@playwright/test');

test('a missing photo shows a labelled placeholder, not a broken icon', async ({ page }) => {
  await page.route('**/assets/g/orig-ig-193725-*.webp', r => r.abort());
  await page.goto('/');
  await expect(page.locator('.card').first()).toBeVisible();
  await expect(page.locator('#card-p-orig-ig-193725 .broken')).toHaveText('Photo unavailable');
  // the rest of the grid is unharmed
  expect(await page.locator('.card').count()).toBe(24);
  expect(await page.locator('.broken').count()).toBe(1);
});

test('every card still opens when its cover image is missing', async ({ page }) => {
  await page.route('**/assets/g/**', r => r.abort());
  await page.goto('/');
  await expect(page.locator('.card').first()).toBeVisible();
  await page.locator('.card').first().click();
  await expect(page.locator('#viewer')).toHaveJSProperty('open', true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#viewer')).toHaveJSProperty('open', false);
});

test('if the data file fails to load the page says so and keeps the phone number', async ({ page }) => {
  await page.route('**/data/site.js', r => r.abort());
  const fatal = [];
  page.on('pageerror', e => fatal.push(e.message));
  await page.goto('/');
  await expect(page.locator('#data-failed')).toContainText('could not load');
  await expect(page.locator('#data-failed')).toContainText('949');
  // static content is still there, and nothing threw
  await expect(page.locator('footer')).toContainText('117 Avenida Granada');
  // the header "Call" link is hidden under 880px, so assert a visible one exists
  const visibleTel = await page.locator('a[href^="tel:"]:visible').count();
  expect(visibleTel, 'no visible click-to-call link').toBeGreaterThan(0);
  expect(fatal).toEqual([]);
});

test('an unknown hash is ignored instead of breaking the page', async ({ page }) => {
  const fatal = [];
  page.on('pageerror', e => fatal.push(e.message));
  for (const h of ['#work/does-not-exist', '#piece-nonsense', '#work/', '#%%%', '#piece-', '#/../../etc']) {
    await page.goto('/' + h);
    await expect(page.locator('.card').first()).toBeVisible();
    await expect(page.locator('#viewer')).toHaveJSProperty('open', false);
  }
  expect(fatal).toEqual([]);
});

test('a deep link opens the right project, and survives a refresh', async ({ page }) => {
  await page.goto('/#work/set-chas-skel-scorp');
  await expect(page.locator('#viewer')).toHaveJSProperty('open', true);
  await expect(page.locator('#v-rail .v-slide')).toHaveCount(4);
  await expect(page.locator('#v-title')).toHaveText('Skeleton and scorpion');

  await page.reload();
  await expect(page.locator('#viewer')).toHaveJSProperty('open', true);
  await expect(page.locator('#v-counter')).toHaveText('1 / 4');
});

test('old #piece- links from the previous gallery still work', async ({ page }) => {
  // a photo that is now the 3rd frame inside a grouped project
  await page.goto('/#piece-orig-ig-193809');
  await expect(page.locator('#viewer')).toHaveJSProperty('open', true);
  await expect(page.locator('#v-title')).toHaveText('Goddess full-back bodysuit');
  const at = await page.evaluate(() =>
    window.SITE.projects.find(p => p.id === 'set-goddess-bodysuit')
      .photos.findIndex(x => x.f === 'orig-ig-193809.jpg') + 1);
  await expect(page.locator('#v-counter')).toHaveText(`${at} / 4`);
});

test('a deep link to the back-piece set opens it with all four photos', async ({ page }) => {
  await page.goto('/#work/set-goddess-bodysuit');
  await expect(page.locator('#viewer')).toHaveJSProperty('open', true);
  await expect(page.locator('#v-rail .v-slide')).toHaveCount(4);
  await page.keyboard.press('Escape');
  await expect(page.locator('#card-set-goddess-bodysuit')).toBeVisible();
  await expect(page.locator('#card-set-goddess-bodysuit .card-shot.is-veiled')).toHaveCount(0);
});

test('closing a deep-linked viewer leaves the page usable', async ({ page }) => {
  await page.goto('/#work/set-mary-back');
  await expect(page.locator('#viewer')).toHaveJSProperty('open', true);
  await page.locator('#v-close').click();
  await expect(page.locator('#viewer')).toHaveJSProperty('open', false);
  await expect(page.locator('html')).not.toHaveClass(/viewer-open/);
  // and the gallery still responds
  await page.locator('#style-filters button', { hasText: /^Paintings$/ }).click();
  await expect(page.locator('#tally')).toContainText('Showing');
});

test('the page renders with no console errors and no failed first-party requests', async ({ page }) => {
  const errs = [], failed = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('requestfailed', r => failed.push(r.url()));
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#more').click();
  await page.waitForLoadState('networkidle');

  expect(errs).toEqual([]);
  // The OpenStreetMap embed is the one third-party request. It is blocked by
  // egress policy in CI sandboxes, so only our own assets are asserted here —
  // the test below covers what a visitor sees when the map does not load.
  const ours = failed.filter(u => new URL(u).origin === new URL(page.url()).origin);
  expect(ours).toEqual([]);
});

test('directions still work when the map embed is blocked', async ({ page }) => {
  await page.route('**://www.openstreetmap.org/**', r => r.abort());
  await page.goto('/');
  await expect(page.locator('#find')).toBeVisible();
  // address, hours, a call link and a directions link are all plain markup,
  // so a dead map never costs a visitor the shop's location
  await expect(page.locator('#find address')).toContainText('117 Avenida Granada');
  await expect(page.locator('#find address')).toContainText('92672');
  await expect(page.locator('#hours-list li')).toHaveCount(7);
  const directions = page.locator('#find a[href*="google.com/maps"]');
  await expect(directions.first()).toBeVisible();
  expect(await directions.first().getAttribute('href')).toContain('Avenida+Granada');
  expect(await page.locator('#find a[href^="tel:"]:visible').count()).toBeGreaterThan(0);
});

test('there is no horizontal overflow at any width', async ({ page }) => {
  for (const w of [320, 360, 390, 414, 600, 768, 820, 1024, 1280, 1536]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('/');
    await expect(page.locator('.card').first()).toBeVisible();
    const m = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    }));
    expect(m.sw, `overflow at ${w}px`).toBeLessThanOrEqual(m.cw + 1);

    // and with the viewer open
    await page.locator('.card').first().click();
    await expect(page.locator('#viewer')).toHaveJSProperty('open', true);
    const m2 = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    }));
    expect(m2.sw, `overflow with viewer open at ${w}px`).toBeLessThanOrEqual(m2.cw + 1);
  }
});

test('landscape phone and tablet orientations still fit', async ({ page }) => {
  for (const [w, h] of [[844, 390], [932, 430], [1180, 820]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');            // clear the hash so the next goto really re-runs
    await page.goto('/#work/set-james-dragon-sleeve');
    await expect(page.locator('#viewer')).toHaveJSProperty('open', true);
    const fits = await page.evaluate(() => {
      const d = document.getElementById('viewer').getBoundingClientRect();
      return d.height <= window.innerHeight + 1 && d.width <= window.innerWidth + 1;
    });
    expect(fits, `viewer overflows the ${w}x${h} viewport`).toBe(true);
    const img = await page.locator('#v-rail .v-slide img').first().boundingBox();
    expect(img.height, `image collapsed at ${w}x${h}`).toBeGreaterThan(40);
  }
});
