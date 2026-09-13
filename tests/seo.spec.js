const { test, expect } = require('@playwright/test');
const CANON = 'https://sanclementetattoo.com/';

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('title, description and canonical point at the real domain', async ({ page }) => {
  const title = await page.title();
  expect(title.length).toBeGreaterThan(20);
  expect(title.length).toBeLessThanOrEqual(70);
  expect(title).toContain('San Clemente Tattoo');

  const desc = await page.locator('meta[name=description]').getAttribute('content');
  expect(desc.length).toBeGreaterThan(70);
  expect(desc.length).toBeLessThanOrEqual(165);
  expect(desc).toContain('117 Avenida Granada');

  expect(await page.locator('link[rel=canonical]').getAttribute('href')).toBe(CANON);
});

test('Open Graph and Twitter tags are complete and absolute', async ({ page }) => {
  const need = {
    'og:type': /.+/, 'og:site_name': /San Clemente Tattoo/, 'og:title': /San Clemente Tattoo/,
    'og:description': /.{50,}/, 'og:url': new RegExp(CANON.replace(/\//g, '\\/')),
    'og:image': /^https:\/\/sanclementetattoo\.com\/assets\/og\.jpg$/,
    'og:image:width': /^1200$/, 'og:image:height': /^630$/, 'og:image:alt': /.{20,}/,
    'og:image:type': /image\/jpeg/, 'og:locale': /en_US/,
  };
  for (const [k, re] of Object.entries(need)) {
    const v = await page.locator(`meta[property="${k}"]`).getAttribute('content');
    expect(v, k).toMatch(re);
  }
  for (const [k, re] of Object.entries({
    'twitter:card': /^summary_large_image$/, 'twitter:title': /San Clemente Tattoo/,
    'twitter:description': /.{50,}/, 'twitter:image': /^https:\/\//, 'twitter:image:alt': /.{20,}/,
  })) {
    const v = await page.locator(`meta[name="${k}"]`).getAttribute('content');
    expect(v, k).toMatch(re);
  }
});

test('the card image actually exists and is a real 1200x630 image', async ({ page, request }) => {
  const res = await request.get('/assets/og.jpg');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image');
  const bytes = (await res.body()).length;
  expect(bytes).toBeGreaterThan(20000);      // not a placeholder
  expect(bytes).toBeLessThan(1024 * 1024);   // under every scraper's limit

  // decode it in the browser and confirm the dimensions the tags promise
  const dim = await page.evaluate(() => new Promise(r => {
    const i = new Image();
    i.onload = () => r({ w: i.naturalWidth, h: i.naturalHeight });
    i.onerror = () => r(null);
    i.src = '/assets/og.jpg';
  }));
  expect(dim).toEqual({ w: 1200, h: 630 });
});

test('the card image decodes at the aspect ratio the tags promise', async ({ page }) => {
  // Scrapers render the image, not the tags. This asserts it decodes and is
  // shaped right; the wording on it was checked by eye (see AUDIT.md).
  await page.goto('/assets/og.jpg');
  const shape = await page.evaluate(() => {
    const img = document.querySelector('img');
    return img ? { w: img.naturalWidth, h: img.naturalHeight } : null;
  });
  expect(shape).not.toBeNull();
  expect(shape.w / shape.h).toBeCloseTo(1200 / 630, 2);
});

test('icons resolve', async ({ request }) => {
  for (const [path, type] of [['/assets/favicon.svg', 'svg'], ['/assets/apple-touch-icon.png', 'png']]) {
    const r = await request.get(path);
    expect(r.status(), path).toBe(200);
    expect(r.headers()['content-type'], path).toContain(type);
  }
});

test('structured data is valid, complete and free of the surname', async ({ page }) => {
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  // base64 for the same reason as in gallery.spec.js
  expect(raw.toLowerCase()).not.toContain(Buffer.from('cmFuY291cnQ=', 'base64').toString());
  const d = JSON.parse(raw);                      // throws if malformed
  expect(d['@type']).toBe('TattooParlor');
  expect(d.name).toBe('San Clemente Tattoo');
  expect(d.telephone).toBe('+1-949-498-8487');
  expect(d.address.streetAddress).toBe('117 Avenida Granada');
  expect(d.address.postalCode).toBe('92672');
  expect(d.founder.name).toBe('Brother Greg');
  expect(d.openingHoursSpecification[0].opens).toBe('12:00');
  expect(d.openingHoursSpecification[0].closes).toBe('19:00');
  expect(d.openingHoursSpecification[0].dayOfWeek).toHaveLength(7);
  expect(d.image).toMatch(/^https:\/\//);
  expect(d.url).toBe(CANON);
  // nothing invented: no ratings, reviews, prices or awards
  for (const k of ['aggregateRating', 'review', 'award', 'priceRange', 'makesOffer']) {
    expect(d[k], `invented ${k}`).toBeUndefined();
  }
});

test('structured data agrees with the page and with the data file', async ({ page }) => {
  const d = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  const S = await page.evaluate(() => window.SITE);
  expect(d.address.streetAddress).toBe(S.shop.street);
  expect(d.geo.latitude).toBe(S.shop.geo.lat);
  expect(d.geo.longitude).toBe(S.shop.geo.lng);
  expect(d.url).toBe(S.shop.canonical);
  expect(d.telephone.replace(/\D/g, '')).toBe('1' + S.shop.phone.replace(/\D/g, ''));
  expect(d.openingHoursSpecification[0].opens).toBe(S.hours.weekly[0].open);
});

test('sitemap and robots are consistent with the canonical domain', async ({ request }) => {
  const sm = await request.get('/sitemap.xml');
  expect(sm.status()).toBe(200);
  const xml = await sm.text();
  expect(xml).toContain(`<loc>${CANON}</loc>`);
  expect(xml).not.toContain('netlify.app');

  const rb = await request.get('/robots.txt');
  expect(rb.status()).toBe(200);
  const txt = await rb.text();
  expect(txt).toContain(`Sitemap: https://sanclementetattoo.com/sitemap.xml`);
  expect(txt).toContain('Disallow: /photos/_originals/');
});

test('a non-canonical host is marked noindex so previews cannot outrank the shop', async ({ page }) => {
  // the suite runs on 127.0.0.1, which is exactly the non-canonical case
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('the page declares its language and viewport', async ({ page }) => {
  expect(await page.locator('html').getAttribute('lang')).toBe('en');
  const vp = await page.locator('meta[name=viewport]').getAttribute('content');
  expect(vp).toContain('width=device-width');
  expect(vp).not.toContain('user-scalable=no');   // never block pinch zoom
  expect(vp).not.toContain('maximum-scale');
});

test('the footer carries a build stamp and the host, so a stale deploy is obvious', async ({ page }) => {
  // This shop has had parallel builds on several hosts and a paused deploy
  // queue that silently pinned the live site to an old version. A stamp on the
  // page is the difference between seeing that in one second and guessing.
  const S = await page.evaluate(() => window.SITE);
  expect(S.build, 'SITE.build is missing').toMatch(/^\d{4}-\d{2}-\d{2}[a-z]?$/);
  const stamp = page.locator('#build-stamp');
  await expect(stamp).toContainText(S.build);
  await expect(stamp).toContainText('127.0.0.1');   // the host it is served from
});

test('the header and redirect rules are host-portable, not Netlify-only', async ({ page }) => {
  // A credit cap on one host must never be the reason the site cannot move.
  const toml = await (await page.request.get('/netlify.toml')).text();
  const headers = await (await page.request.get('/_headers')).text();
  const redirects = await (await page.request.get('/_redirects')).text();

  // the CSP, the security headers and both cache policies travel with the site
  for (const rule of ["default-src 'self'", 'X-Frame-Options', 'X-Content-Type-Options',
                      'Referrer-Policy', 'Permissions-Policy', 'Cross-Origin-Opener-Policy',
                      'Strict-Transport-Security', 'max-age=31536000, immutable',
                      'max-age=0, must-revalidate']) {
    expect(headers, `_headers is missing ${rule}`).toContain(rule);
    expect(toml, `netlify.toml is missing ${rule}`).toContain(rule);
  }
  // the unversioned filenames are all pinned to revalidate in both files
  for (const path of ['/index.html', '/data/site.js', '/assets/css/', '/assets/js/']) {
    expect(headers, `_headers does not cover ${path}`).toContain(path);
    expect(toml, `netlify.toml does not cover ${path}`).toContain(path);
  }
  // and the old page URLs still redirect
  for (const from of ['/home.html', '/contact.html', '/links.html']) {
    expect(redirects, `_redirects is missing ${from}`).toContain(from);
    expect(toml, `netlify.toml is missing ${from}`).toContain(from);
  }
});
