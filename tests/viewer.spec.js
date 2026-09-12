const { test, expect } = require('@playwright/test');

const multi = '#card-set-james-dragon-sleeve';   // 10 photos
const openMulti = async (page) => {
  await page.locator('#artist-filters button', { hasText: /^James Whelan$/ }).click();
  await page.locator(multi).click();
  await expect(page.locator('#viewer')).toHaveJSProperty('open', true);
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.card').first()).toBeVisible();
});

test('the viewer only ever shows the selected project', async ({ page }) => {
  await openMulti(page);
  await expect(page.locator('#v-rail .v-slide')).toHaveCount(10);
  await expect(page.locator('#v-counter')).toHaveText('1 / 10');
  await expect(page.locator('#v-title')).toHaveText('Dragon sleeve');
});

test('prev, next and the counter wrap in both directions', async ({ page }) => {
  await openMulti(page);
  await page.locator('#v-next').click();
  await expect(page.locator('#v-counter')).toHaveText('2 / 10');
  await page.locator('#v-prev').click();
  await expect(page.locator('#v-counter')).toHaveText('1 / 10');
  await page.locator('#v-prev').click();                       // wrap backwards
  await expect(page.locator('#v-counter')).toHaveText('10 / 10');
  await page.locator('#v-next').click();                       // wrap forwards
  await expect(page.locator('#v-counter')).toHaveText('1 / 10');
});

test('keyboard navigation works and Escape closes', async ({ page }) => {
  await openMulti(page);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#v-counter')).toHaveText('2 / 10');
  await page.keyboard.press('End');
  await expect(page.locator('#v-counter')).toHaveText('10 / 10');
  await page.keyboard.press('Home');
  await expect(page.locator('#v-counter')).toHaveText('1 / 10');
  await page.keyboard.press('Escape');
  await expect(page.locator('#viewer')).toHaveJSProperty('open', false);
});

test('thumbnails jump to a photo and mark the current one', async ({ page }) => {
  await openMulti(page);
  await page.locator('#v-dots button').nth(4).click();
  await expect(page.locator('#v-counter')).toHaveText('5 / 10');
  await expect(page.locator('#v-dots button').nth(4)).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#v-dots button').nth(0)).toHaveAttribute('aria-current', 'false');
});

test('focus moves into the viewer and returns to the card on close', async ({ page }) => {
  await openMulti(page);
  await expect(page.locator('#v-close')).toBeFocused();
  await page.locator('#v-close').click();
  await expect(page.locator('#viewer')).toHaveJSProperty('open', false);
  await expect(page.locator(multi)).toBeFocused();
});

test('the page cannot scroll behind the viewer, and the position is kept', async ({ page }) => {
  await page.locator('#artist-filters button', { hasText: /^James Whelan$/ }).click();
  await page.locator(multi).scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(0);
  await page.locator(multi).click();
  await expect(page.locator('html')).toHaveClass(/viewer-open/);
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).not.toHaveClass(/viewer-open/);
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - before)).toBeLessThan(4);
});

test('a single-photo project hides the paging controls entirely', async ({ page }) => {
  // must be one of the 24 cards actually rendered, so read the display order
  const solo = await page.evaluate(() =>
    window.galleryOrder().slice(0, 24).find(p => p.photos.length === 1 && !p.sensitive).id);
  await page.locator(`#card-${solo}`).click();
  await expect(page.locator('#viewer')).toHaveClass(/v-single/);
  await expect(page.locator('#v-counter')).toBeHidden();
  await expect(page.locator('#v-next')).toBeHidden();
  await expect(page.locator('#v-dots')).toBeEmpty();
});

test('photos are shown whole, never cropped', async ({ page }) => {
  await openMulti(page);
  const fit = await page.locator('#v-rail .v-slide img').first()
    .evaluate(el => getComputedStyle(el).objectFit);
  expect(fit).toBe('contain');
  // rendered box must not exceed the natural size in either axis
  const box = await page.locator('#v-rail .v-slide img').first().evaluate(el => ({
    rw: el.getBoundingClientRect().width, rh: el.getBoundingClientRect().height,
    nw: el.naturalWidth, nh: el.naturalHeight,
  }));
  expect(box.rw / box.rh).toBeCloseTo(box.nw / box.nh, 1);
});

test('the back button closes the viewer instead of leaving the page', async ({ page }) => {
  await openMulti(page);
  await expect(page).toHaveURL(/#work\/set-james-dragon-sleeve$/);
  await page.goBack();
  await expect(page.locator('#viewer')).toHaveJSProperty('open', false);
  await expect(page.locator('.card').first()).toBeVisible();
});

test('a compositor gesture pages the rail both ways and never scrolls the page', async ({ page, isMobile, browserName }) => {
  test.skip(!isMobile, 'gesture paging is the mobile path');
  test.skip(browserName !== 'chromium', 'needs CDP gesture synthesis');
  await openMulti(page);

  // page.mouse cannot drive native scrolling, so dispatch a real compositor
  // gesture through CDP. gestureSourceType 'touch' is a no-op in headless
  // Chromium (the touch pipeline is not wired up), so this uses the wheel
  // source, which exercises the same scroller, the same mandatory snap and the
  // same scroll handler. Finger-on-glass behaviour still needs a physical
  // device — see "Needs a real device" in AUDIT.md.
  const cdp = await page.context().newCDPSession(page);
  const rail = page.locator('#v-rail');
  const b = await rail.boundingBox();
  const at = { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2) };
  const pageY = await page.evaluate(() => window.scrollY);

  // CDP: positive xDistance scrolls left, so a negative value advances.
  const gesture = async (xDistance) => {
    await cdp.send('Input.synthesizeScrollGesture', {
      ...at, xDistance, yDistance: 0, gestureSourceType: 'mouse', speed: 1200, preventFling: true,
    });
    await page.waitForTimeout(600);
  };

  await gesture(-500);
  const oneSlide = await rail.evaluate(el => el.clientWidth);
  // mandatory snap must land exactly on a slide, never between two
  expect(await rail.evaluate(el => el.scrollLeft)).toBe(oneSlide);
  await expect(page.locator('#v-counter')).toHaveText('2 / 10');
  expect(await page.evaluate(() => window.scrollY)).toBe(pageY);

  await gesture(500);
  expect(await rail.evaluate(el => el.scrollLeft)).toBe(0);
  await expect(page.locator('#v-counter')).toHaveText('1 / 10');
  expect(await page.evaluate(() => window.scrollY)).toBe(pageY);
});

test('the rail scrolls horizontally only, so vertical page scroll survives', async ({ page }) => {
  await openMulti(page);
  const style = await page.locator('#v-rail').evaluate(el => {
    const s = getComputedStyle(el);
    return { x: s.overflowX, y: s.overflowY, touch: s.touchAction, snap: s.scrollSnapType };
  });
  expect(style.x).toBe('auto');
  expect(style.y).toBe('hidden');
  expect(style.touch).toContain('pan-x');
  expect(style.snap).toContain('x');
});
