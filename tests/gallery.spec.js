const { test, expect } = require('@playwright/test');

// The gallery data is the contract everything else depends on, so read it the
// same way the page does instead of duplicating expectations here.
async function site(page) {
  return page.evaluate(() => window.SITE);
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
  const S = await site(page);
  const first24 = S.projects.slice(0, 24);
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
