const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const PAYLOAD = `"><img src=x onerror="window.__pwned=1"><script>window.__pwned=1</script>`;

test('a hostile caption is rendered as text, never as markup', async ({ page }) => {
  // The data file is trusted, committed content — but it is edited by hand by
  // whoever maintains the shop, so a stray quote or angle bracket must not be
  // able to break out of an attribute or inject a tag.
  await page.addInitScript((payload) => {
    const patch = () => {
      if (!window.SITE) return false;
      window.SITE.projects[0].title = payload;
      window.SITE.projects[0].photos[0].cap = payload;
      window.SITE.artists[0].name = payload;
      window.SITE.artists[0].bio = payload;
      window.SITE.faq[0] = [payload, payload];
      return true;
    };
    Object.defineProperty(window, 'SITE', {
      configurable: true,
      set(v) { delete window.SITE; window.SITE = v; patch(); },
      get() { return undefined; },
    });
  }, PAYLOAD);

  await page.goto('/');
  await expect(page.locator('.card').first()).toBeVisible();
  await page.locator('.card').first().click();
  await expect(page.locator('#viewer')).toHaveJSProperty('open', true);

  expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
  // no injected element made it into the tree
  expect(await page.locator('img[src="x"]').count()).toBe(0);
  // and the payload is visible as literal text where it was placed
  await expect(page.locator('#v-title')).toHaveText(PAYLOAD);
});

test('a hostile hash cannot inject anything or crash the page', async ({ page }) => {
  const fatal = [];
  page.on('pageerror', e => fatal.push(e.message));
  for (const h of [
    '#work/"><img src=x onerror=alert(1)>',
    '#piece-<script>alert(1)</script>',
    '#work/' + encodeURIComponent(PAYLOAD),
    '#%E0%A4%A',
  ]) {
    await page.goto('/' + h);
    await expect(page.locator('.card').first()).toBeVisible();
    expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
    expect(await page.locator('img[src="x"]').count()).toBe(0);
  }
  expect(fatal).toEqual([]);
});

test('the page needs no inline script or style, so the CSP can forbid both', async ({ page }) => {
  await page.goto('/');
  const html = fs.readFileSync('index.html', 'utf8');
  // no style attributes at all
  expect(html).not.toMatch(/\sstyle="/);
  // the only inline <script> is the ld+json data block, which is not executable
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g)].map(m => m[0]);
  expect(inline).toEqual(['<script type="application/ld+json">']);
  // and at runtime nothing has added one
  const runtime = await page.evaluate(() =>
    [...document.querySelectorAll('script:not([src])')].map(s => s.type));
  expect(runtime).toEqual(['application/ld+json']);
  expect(await page.$$eval('[style]', els => els.length)).toBe(0);
});

test('netlify.toml ships the security headers the CSP story depends on', () => {
  const toml = fs.readFileSync('netlify.toml', 'utf8');
  const csp = toml.match(/Content-Security-Policy = "([^"]+)"/)[1];
  const directives = Object.fromEntries(
    csp.split(';').map(d => d.trim()).filter(Boolean).map(d => {
      const [k, ...v] = d.split(/\s+/);
      return [k, v.join(' ')];
    }));

  expect(directives['default-src']).toBe("'self'");
  expect(directives['script-src']).toBe("'self'");          // no unsafe-inline
  expect(directives['style-src']).toBe("'self'");           // no unsafe-inline
  expect(directives['object-src']).toBe("'none'");
  expect(directives['base-uri']).toBe("'none'");
  expect(directives['frame-ancestors']).toBe("'none'");
  expect(directives['form-action']).toBe("'self'");
  expect(directives['frame-src']).toBe('https://www.openstreetmap.org');
  expect(csp).not.toContain('unsafe-inline');
  expect(csp).not.toContain('unsafe-eval');
  expect(csp).not.toContain('*');

  for (const h of [
    'X-Frame-Options = "DENY"',
    'X-Content-Type-Options = "nosniff"',
    'Referrer-Policy = "strict-origin-when-cross-origin"',
    'Strict-Transport-Security',
    'Permissions-Policy',
    'Cross-Origin-Opener-Policy = "same-origin"',
  ]) {
    expect(toml, h).toContain(h);
  }

  // preview contexts must be noindex
  expect(toml).toContain('context.deploy-preview.headers');
  expect(toml).toContain('context.branch-deploy.headers');
  expect(toml).toMatch(/X-Robots-Tag = "noindex, nofollow"/);
});

test('everything the CSP allows is actually used, and nothing else is requested', async ({ page }) => {
  const origins = new Set();
  page.on('request', r => origins.add(new URL(r.url()).origin));
  await page.goto('/', { waitUntil: 'networkidle' });
  const self = new URL(page.url()).origin;
  const third = [...origins].filter(o => o !== self);
  // the OpenStreetMap frame is the one and only third-party origin
  expect(third.filter(o => o !== 'https://www.openstreetmap.org')).toEqual([]);
});

test('no third-party analytics, trackers or fonts are loaded', async ({ page }) => {
  const urls = [];
  page.on('request', r => urls.push(r.url()));
  await page.goto('/', { waitUntil: 'networkidle' });
  for (const bad of ['google-analytics', 'googletagmanager', 'gtag/js', 'facebook.net',
                     'doubleclick', 'hotjar', 'fonts.googleapis.com', 'fonts.gstatic.com',
                     'cdn.jsdelivr', 'unpkg.com', 'cdnjs']) {
    expect(urls.join(' '), bad).not.toContain(bad);
  }
  // the fonts are ours
  expect(urls.filter(u => u.endsWith('.woff2')).length).toBeGreaterThan(0);
  for (const u of urls.filter(u => u.endsWith('.woff2'))) expect(u).toContain('/assets/fonts/');
});

test('the shipped site pulls in no runtime dependencies at all', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  expect(pkg.dependencies || {}, 'nothing should ship to the browser').toEqual({});
  // and index.html references no remote script or stylesheet
  const html = fs.readFileSync('index.html', 'utf8');
  expect(html).not.toMatch(/<script[^>]+src="https?:/);
  expect(html).not.toMatch(/<link[^>]+href="https?:[^"]*\.css/);
});
