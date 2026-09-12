const { test, expect } = require('@playwright/test');

/* Hard budgets, measured on a throttled "Slow 4G" profile in Chromium:
 *   1.6 Mbps down / 750 Kbps up / 150 ms RTT, 4x CPU slowdown.
 * The numbers below are ceilings, not observations — if a change blows one,
 * the suite fails rather than the regression shipping.
 *
 * Sizes are UNCOMPRESSED, because the dev server does not compress. Netlify
 * serves gzip/brotli, so real transfer is roughly a quarter of these figures
 * (measured: app.js 8.8 KB gzipped, site.js 6.3 KB, app.css 5.1 KB).
 */
const BUDGET = {
  initialWeightKB: 1400,   // everything fetched to first render, images included
  lcpMs: 2500,             // "good" threshold
  cls: 0.1,                // "good" threshold
  appJsKB: 32,             // hand-written behaviour, no framework
  dataJsKB: 60,            // the gallery data file (data, not code)
  cssKB: 30,
  requests: 60,
};

const THROTTLE = {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
  latency: 150,
};

test.describe('performance budgets', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP throttling is Chromium-only');

  test('first render stays inside the weight, LCP and CLS budgets on slow 4G', async ({ page, browser }) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', THROTTLE);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    await page.addInitScript(() => {
      window.__lcp = 0; window.__cls = 0;
      new PerformanceObserver(l => {
        for (const e of l.getEntries()) window.__lcp = Math.max(window.__lcp, e.startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(l => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });

    const bytes = new Map();
    page.on('response', async (res) => {
      try {
        const len = +(res.headers()['content-length'] || 0);
        bytes.set(res.url(), len || (await res.body().catch(() => Buffer.alloc(0))).length);
      } catch { /* ignore */ }
    });

    await page.goto('/', { waitUntil: 'load' });
    await page.waitForLoadState('networkidle');
    // settle LCP/CLS
    await page.waitForTimeout(500);

    const total = [...bytes.values()].reduce((a, b) => a + b, 0);
    const lcp = await page.evaluate(() => window.__lcp);
    const cls = await page.evaluate(() => window.__cls);
    const requests = bytes.size;

    const sum = (pred) => [...bytes].filter(([u]) => pred(u)).reduce((a, [, b]) => a + b, 0);
    const appJs = sum(u => u.includes('/assets/js/'));
    const dataJs = sum(u => u.includes('/data/'));
    const css = sum(u => u.endsWith('.css'));

    console.log(`  page weight  ${(total / 1024).toFixed(0)} KB  (budget ${BUDGET.initialWeightKB})`);
    console.log(`  requests     ${requests}          (budget ${BUDGET.requests})`);
    console.log(`  LCP          ${lcp.toFixed(0)} ms       (budget ${BUDGET.lcpMs})`);
    console.log(`  CLS          ${cls.toFixed(4)}        (budget ${BUDGET.cls})`);
    console.log(`  app JS       ${(appJs / 1024).toFixed(1)} KB    (budget ${BUDGET.appJsKB})`);
    console.log(`  data JS      ${(dataJs / 1024).toFixed(1)} KB    (budget ${BUDGET.dataJsKB})`);
    console.log(`  CSS          ${(css / 1024).toFixed(1)} KB    (budget ${BUDGET.cssKB})`);

    expect(total / 1024).toBeLessThan(BUDGET.initialWeightKB);
    expect(requests).toBeLessThan(BUDGET.requests);
    expect(lcp).toBeLessThan(BUDGET.lcpMs);
    expect(cls).toBeLessThan(BUDGET.cls);
    expect(appJs / 1024).toBeLessThan(BUDGET.appJsKB);
    expect(dataJs / 1024).toBeLessThan(BUDGET.dataJsKB);
    expect(css / 1024).toBeLessThan(BUDGET.cssKB);
  });

  test('below-the-fold photos are lazy and above-the-fold are not', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.card').first()).toBeVisible();
    const modes = await page.$$eval('#grid img', els =>
      els.map((e, i) => ({ i, loading: e.loading, priority: e.getAttribute('fetchpriority') })));
    // the first row loads immediately, everything else waits
    for (const m of modes.slice(0, 4)) expect(m.loading, `card ${m.i}`).toBe('eager');
    for (const m of modes.slice(4)) expect(m.loading, `card ${m.i}`).toBe('lazy');
    // the map and the shop strip are lazy too
    expect(await page.locator('#find iframe').getAttribute('loading')).toBe('lazy');
    const strip = await page.$$eval('#shop-strip img', els => els.map(e => e.loading));
    for (const l of strip) expect(l).toBe('lazy');
  });

  test('every photo reserves its box so nothing can jump', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.card').first()).toBeVisible();
    const missing = await page.$$eval('img', els => els
      .filter(e => !e.getAttribute('width') || !e.getAttribute('height'))
      .map(e => e.currentSrc || e.src));
    expect(missing).toEqual([]);
  });

  test('photos are served as responsive WebP, never the full-size master', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.card').first()).toBeVisible();
    const imgs = await page.$$eval('#grid img', els => els.map(e => ({
      src: e.getAttribute('src'), srcset: e.getAttribute('srcset'), sizes: e.getAttribute('sizes'),
      // currentSrc stays empty until the browser actually picks a candidate,
      // which for a lazy image only happens once it nears the viewport
      chosen: e.complete && e.naturalWidth > 0 ? e.currentSrc : null,
    })));
    let resolved = 0;
    for (const i of imgs) {
      expect(i.src, 'must not point at photos/').not.toContain('photos/');
      expect(i.src).toMatch(/^assets\/g\/.*\.webp$/);
      expect(i.srcset).toContain('w');
      expect(i.sizes).toBeTruthy();
      if (i.chosen) {
        expect(i.chosen, 'browser must pick a webp derivative').toMatch(/\.webp$/);
        resolved++;
      }
    }
    expect(resolved, 'no image resolved a source').toBeGreaterThan(0);
  });

  test('the whole grid can be revealed without blowing the weight budget', async ({ page }) => {
    const bytes = new Map();
    page.on('response', async (res) => {
      const len = +(res.headers()['content-length'] || 0);
      bytes.set(res.url(), len || (await res.body().catch(() => Buffer.alloc(0))).length);
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    // click through every page of the grid
    for (let i = 0; i < 10; i++) {
      if (!(await page.locator('#more').isVisible())) break;
      await page.locator('#more').click();
      await page.waitForTimeout(120);
    }
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#more')).toBeHidden();
    const total = [...bytes.values()].reduce((a, b) => a + b, 0) / 1024;
    console.log(`  full gallery weight ${(total / 1024).toFixed(2)} MB across ${bytes.size} requests`);
    // 153 cards fully expanded must still be under 8 MB
    expect(total / 1024).toBeLessThan(8);
  });
});
