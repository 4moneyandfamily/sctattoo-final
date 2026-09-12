const { test, expect } = require('@playwright/test');

// Status codes for third-party links are checked by tools/check-links.mjs,
// which needs open network access. What is asserted here is the part that is
// actually the site's job: that every contact route is present, well formed,
// and agrees with the business facts.
const PHONE = '9494988487';
const ADDRESS = '117 Avenida Granada';

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('every click-to-call link dials the shop number shown on the page', async ({ page }) => {
  const hrefs = await page.$$eval('a[href^="tel:"]', els => els.map(e => e.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThanOrEqual(4);          // header, hero, find, dock
  for (const h of hrefs) {
    expect(h).toBe('tel:+1' + PHONE);
  }
  // the visible text agrees with the href
  await expect(page.locator('#find address')).toContainText('(949) 498-8487');
  const S = await page.evaluate(() => window.SITE);
  expect(S.shop.phoneHref).toBe('tel:+1' + PHONE);
  expect(S.shop.phone.replace(/\D/g, '')).toBe(PHONE);
});

test('the email link is a valid mailto for the shop address', async ({ page }) => {
  const h = await page.locator('a[href^="mailto:"]').first().getAttribute('href');
  const addr = h.replace('mailto:', '').split('?')[0];
  expect(addr).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i);
  const S = await page.evaluate(() => window.SITE);
  expect(addr).toBe(S.shop.email);
});

test('directions links carry the real street address', async ({ page }) => {
  const hrefs = await page.$$eval('a[href*="google.com/maps"]', els => els.map(e => e.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThanOrEqual(3);          // header, find, dock
  for (const h of hrefs) {
    expect(h).toMatch(/^https:\/\//);
    // query strings encode spaces as '+', which decodeURIComponent leaves alone
    const readable = decodeURIComponent(h).replace(/\+/g, ' ');
    expect(readable).toContain(ADDRESS);
    expect(readable).toContain('92672');
  }
});

test('Instagram links match the handles the page prints', async ({ page }) => {
  const S = await page.evaluate(() => window.SITE);
  await expect(page.locator(`a[href="${S.shop.instagram}"]`).first()).toBeVisible();
  for (const a of S.artists) {
    expect(a.instagram, a.id).toBe(`https://www.instagram.com/${a.handle}/`);
    await expect(page.locator(`#footer-ig a[href="${a.instagram}"]`)).toHaveCount(1);
  }
});

test('every outbound link is https, and none of them can hijack the tab', async ({ page }) => {
  const links = await page.$$eval('a[href]', els => els
    .map(e => ({ href: e.getAttribute('href'), rel: e.getAttribute('rel'), target: e.getAttribute('target') }))
    .filter(l => /^[a-z]+:\/\//i.test(l.href)));
  for (const l of links) {
    expect(l.href, 'insecure outbound link').toMatch(/^https:\/\//);
    // nothing opens in a new tab, so no reverse-tabnabbing surface at all
    expect(l.target, `${l.href} opens a new tab without rel=noopener`).toBeNull();
  }
});

test('no placeholder or unconfirmed copy is visible to a customer', async ({ page }) => {
  const text = await page.locator('body').innerText();
  for (const bad of ['CONFIRM', 'TODO', 'FIXME', 'Lorem', 'lorem ipsum',
                     'FORM_ENDPOINT', 'undefined', 'NaN', 'null', '[object']) {
    expect(text, `"${bad}" is visible on the page`).not.toContain(bad);
  }
});

test('nothing claims a review, rating, award or a price', async ({ page }) => {
  const text = (await page.locator('body').innerText()).toLowerCase();
  for (const claim of ['5 stars', 'five stars', 'award-winning', 'best of', 'voted',
                       'testimonial', 'as seen on', 'guaranteed']) {
    expect(text, `unsupported claim: ${claim}`).not.toContain(claim);
  }
  // no price is published anywhere, per the shop's instruction
  expect(text).not.toMatch(/\$\s?\d/);
});

test('the booking form is reachable from every navigation surface', async ({ page }) => {
  await expect(page.locator('.quick a[href="#book"]')).toHaveCount(1);
  await expect(page.locator('.dock a[href="#book"]')).toHaveCount(1);
  await expect(page.locator('.hero-actions a[href="#book"]')).toHaveCount(1);
  // the dock is phone-only and the header nav is desktop-only, so click
  // whichever surface this viewport actually shows
  await page.locator('a[href="#book"]:visible').first().click();
  await expect(page.locator('#book')).toBeInViewport({ ratio: 0.05 });
});

test('the age rule and deposit wording are present and unambiguous', async ({ page }) => {
  const book = await page.locator('#book').innerText();
  expect(book).toContain('18');
  expect(book.toLowerCase()).toContain('photo id');
  expect(book.toLowerCase()).toContain('no parental exception');
  expect(book.toLowerCase()).toContain('deposit');
  // and the form does not promise the deposit is being taken
  expect(book.toLowerCase()).toContain('does not charge a deposit');
});
