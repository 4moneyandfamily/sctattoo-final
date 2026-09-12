const { test, expect } = require('@playwright/test');

// The gallery data is the contract everything else depends on, so read it the
// same way the page does instead of duplicating expectations here.
async function site(page) {
  return page.evaluate(() => window.SITE);
}

// The wall is curated, so anything order-sensitive must ask for the display
// order rather than assuming data/site.js order.
async function order(page) {
  return page.evaluate(() => window.galleryOrder().map(p => ({
    id: p.id, style: p.style, artistId: p.artistId, title: p.title,
    sensitive: p.sensitive, photos: p.photos,
  })));
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.card').first()).toBeVisible();
});

test('one card per project, paginated, with an accurate tally', async ({ page }) => {
  const S = await site(page);
  await expect(page.locator('.card')).toHaveCount(24);
  await expect(page.locator('#tally')).toHaveText(`Showing 24 of ${S.projects.length} pieces`);
  await expect(page.locator('#more')).toBeVisible();

  await page.locator('#more').click();
  await expect(page.locator('.card')).toHaveCount(48);
  await expect(page.locator('#tally')).toHaveText(`Showing 48 of ${S.projects.length} pieces`);
});

test('no project holds the same photo twice and no photo is in two projects', async ({ page }) => {
  const S = await site(page);
  const seen = new Map();
  for (const p of S.projects) {
    const inProject = new Set();
    for (const ph of p.photos) {
      expect(inProject.has(ph.f), `${ph.f} twice in ${p.id}`).toBe(false);
      inProject.add(ph.f);
      expect(seen.has(ph.f), `${ph.f} in both ${seen.get(ph.f)} and ${p.id}`).toBe(false);
      seen.set(ph.f, p.id);
    }
  }
});

test('every photo carries real dimensions and a caption', async ({ page }) => {
  const S = await site(page);
  for (const p of [...S.projects.flatMap(x => x.photos), ...S.shopPhotos]) {
    expect(p.w, p.f).toBeGreaterThan(0);
    expect(p.h, p.f).toBeGreaterThan(0);
    expect((p.cap || '').length, p.f).toBeGreaterThan(2);
  }
});

test('multi-photo projects show a count badge matching their photo count', async ({ page }) => {
  const first24 = (await order(page)).slice(0, 24);
  const expected = first24.filter(p => p.photos.length > 1 && !p.sensitive);
  await expect(page.locator('.count')).toHaveCount(expected.length);
  for (const p of expected) {
    await expect(page.locator(`#card-${p.id} .count`)).toHaveText(String(p.photos.length));
  }
});

test('the reviewed groups really are grouped', async ({ page }) => {
  const S = await site(page);
  const find = id => S.projects.find(p => p.id === id);
  // the nude back-piece case called out in the brief: four photos, one card
  expect(find('set-goddess-bodysuit').photos.map(p => p.f).sort()).toEqual([
    'orig-ig-193804.jpg', 'orig-ig-193806.jpg', 'orig-ig-193809.jpg', 'r2-brian-brian-01.jpg',
  ]);
  // no longer behind a cover: the shop asked for it shown like any other card
  expect(find('set-goddess-bodysuit').sensitive).toBeUndefined();
  expect(find('set-mary-back').photos).toHaveLength(3);
  expect(find('set-james-dragon-sleeve').photos).toHaveLength(10);
  expect(find('set-bulldog').photos).toHaveLength(2);
  expect(find('set-mahakala').photos).toHaveLength(2);
  // one tattoo cannot have two artists
  for (const p of S.projects) expect(typeof p.artistId === 'string' || p.artistId === null).toBe(true);
});

test('the deleted duplicates are gone from the data', async ({ page }) => {
  const S = await site(page);
  const files = new Set(S.projects.flatMap(p => p.photos.map(x => x.f)));
  for (const gone of ['orig-ig-194047.jpg', 'orig-ig-193842.jpg', 'orig-ig-194059.jpg',
                      'orig-ig-193817.jpg', 'orig-ig-193934.jpg', 'orig-ig-194005.jpg',
                      'orig-ig-193939.jpg', 'orig-ig-193951.jpg']) {
    expect(files.has(gone), gone).toBe(false);
  }
});

test('the owner is named Brother Greg and his surname appears nowhere', async ({ page }) => {
  // Base64 so the name itself is not written anywhere in this repository,
  // while the check that keeps it off the site still works.
  const surname = Buffer.from('cmFuY291cnQ=', 'base64').toString();
  const html = await page.content();
  expect(html.toLowerCase()).not.toContain(surname);
  await expect(page.locator('footer')).toContainText('Owner: Brother Greg');
  const S = await site(page);
  expect(S.artists.find(a => a.id === 'greg').name).toBe('Brother Greg');
});

test('style and artist filters narrow the grid and can be cleared', async ({ page }) => {
  const S = await site(page);
  await page.locator('#style-filters button', { hasText: /^Lettering$/ }).click();
  const lettering = S.projects.filter(p => p.style === 'Lettering').length;
  await expect(page.locator('#tally')).toContainText(`of ${lettering}`);

  await page.locator('#style-filters button', { hasText: /^All$/ }).click();
  await expect(page.locator('#tally')).toContainText(`of ${S.projects.length}`);

  await page.locator('#artist-filters button', { hasText: /^Chas Byassee$/ }).click();
  const chas = S.projects.filter(p => p.artistId === 'chas').length;
  await expect(page.locator('#tally')).toContainText(`of ${chas}`);
});

test('a filter combination with no work shows the empty state, not a blank grid', async ({ page }) => {
  await page.locator('#artist-filters button', { hasText: /^Brother Greg$/ }).click();
  await page.locator('#style-filters button', { hasText: /^Lettering$/ }).click();
  await expect(page.locator('#grid-empty')).toBeVisible();
  await expect(page.locator('.card')).toHaveCount(0);
  await expect(page.locator('#more')).toBeHidden();
});

test('a crew card filters the gallery to that artist', async ({ page }) => {
  const S = await site(page);
  await page.locator('.artist', { hasText: 'Thadius Gardner' }).click();
  const n = S.projects.filter(p => p.artistId === 'thad').length;
  await expect(page.locator('#tally')).toContainText(`of ${n}`);
});

test('the front page leads with the curated picks, in order', async ({ page }) => {
  const S = await site(page);
  const shown = await page.$$eval('.card', els => els.map(e => e.id.replace(/^card-/, '')));
  expect(shown).toHaveLength(24);
  expect(shown).toEqual(S.featured);
});

test('the design plates are off the front page and sunk to the very end', async ({ page }) => {
  const S = await site(page);
  const ids = (await order(page)).map(p => p.id);
  const shown = await page.$$eval('.card', els => els.map(e => e.id.replace(/^card-/, '')));
  for (const id of S.buried) {
    expect(shown, `${id} is still on the front page`).not.toContain(id);
  }
  // and they occupy the last positions, in the order the list gives
  expect(ids.slice(-S.buried.length)).toEqual(S.buried);
});

test('nothing is dropped or duplicated by the curation', async ({ page }) => {
  const S = await site(page);
  const ids = (await order(page)).map(p => p.id);
  expect(ids).toHaveLength(S.projects.length);
  expect(new Set(ids).size).toBe(S.projects.length);
  expect([...ids].sort()).toEqual(S.projects.map(p => p.id).sort());
});

test('every multi-photo card leads with the cover the shop chose', async ({ page }) => {
  // guards the hand-picked covers against a future edit reordering photos[]
  const expected = {
    'set-mary-back': 'orig-ig-193825.jpg',
    'set-brian-demon-leg': 'orig-ig-193930.jpg',
    'set-mahakala': 'orig-ig-194002.jpg',
    'set-james-dragon-sleeve': 'orig-ig-194041.jpg',
    'set-chas-skel-scorp': 'orig-ig-194120.jpg',
    'set-james-dragon-back': 'orig-ig-194138.jpg',
    'set-brian-tiger': 'orig-os-4503420.jpg',
    'set-orange-dragon': 'r2-brian-brian-09.jpg',
    'set-chas-eagle': 'r4-chas-chas-15.jpg',
    'set-goddess-bodysuit': 'r2-brian-brian-01.jpg',
    'set-bulldog': 'r4-thad-thad-10.jpg',
    'set-brian-dragon-flowers': 'orig-ig-194109.jpg',
    // merged pairs: the finished tattoo leads, the design or detail sits behind it
    'set-thad-cards-sleeve': 'r4-thad-thad-12.jpg',
    'set-chas-severed-head': 'orig-ig-193732.jpg',
    'set-james-eagle': 'orig-ig-193751.jpg',
  };
  const S = await site(page);
  for (const [id, cover] of Object.entries(expected)) {
    const p = S.projects.find(x => x.id === id);
    expect(p, id).toBeTruthy();
    expect(p.photos[0].f, `${id} cover`).toBe(cover);
  }
});

test('the front page is mostly finished tattoos, not flash', async ({ page }) => {
  const first24 = (await order(page)).slice(0, 24);
  const paintings = first24.filter(p => p.style === 'Paintings');
  // one of the owner's paintings is deliberately included; more than that and
  // the wall stops being a portfolio of tattoo work
  expect(paintings.length, paintings.map(p => p.title).join(', ')).toBeLessThanOrEqual(1);
});

test('the front page shows work from every artist who has tattoo photos', async ({ page }) => {
  const first24 = (await order(page)).slice(0, 24);
  const credited = new Set(first24.map(p => p.artistId).filter(Boolean));
  for (const id of ['brian', 'james', 'chas', 'thad', 'greg']) {
    expect(credited.has(id), `${id} has nothing on the front page`).toBe(true);
  }
});

test('a tattoo and the painting it came from share one card, tattoo first', async ({ page }) => {
  const S = await site(page);
  const p = S.projects.find(x => x.id === 'set-chas-severed-head');
  expect(p.photos.map(x => x.f)).toEqual(['orig-ig-193732.jpg', 'orig-ig-193735.jpg']);
  // the finished tattoo is the cover, not the design
  expect(p.style).toBe('Color');
  expect(p.photos[1].cap).toMatch(/painted design/);
  // and the two no longer occupy two slots on the wall
  const ids = (await order(page)).map(x => x.id);
  expect(ids).not.toContain('p-orig-ig-193735');
  expect(ids).not.toContain('p-orig-ig-193732');
});

test('the merged pairs each open as a two-photo swipeable card', async ({ page }) => {
  for (const [id, artist] of [['set-thad-cards-sleeve', 'Thadius Gardner'],
                              ['set-chas-severed-head', 'Chas Byassee'],
                              ['set-james-eagle', 'James Whelan']]) {
    await page.goto('/#work/' + id);
    await expect(page.locator('#viewer')).toHaveJSProperty('open', true);
    await expect(page.locator('#v-rail .v-slide')).toHaveCount(2);
    await expect(page.locator('#v-counter')).toHaveText('1 / 2');
    await expect(page.locator('#v-by')).toContainText(artist);
    // swipe forward and back with the buttons
    await page.locator('#v-next').click();
    await expect(page.locator('#v-counter')).toHaveText('2 / 2');
    await page.locator('#v-prev').click();
    await expect(page.locator('#v-counter')).toHaveText('1 / 2');
    await page.keyboard.press('Escape');
    // the card carries a 2-photo badge on the grid
    await expect(page.locator(`#card-${id} .count`)).toHaveText('2');
  }
});
