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
  expect(find('set-james-dragon-sleeve').photos).toHaveLength(11);
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
  await page.locator('#style-filters button', { hasText: /^Paintings$/ }).click();
  const paintings = S.projects.filter(p => p.style === 'Paintings').length;
  await expect(page.locator('#tally')).toContainText(`of ${paintings}`);

  await page.locator('#style-filters button', { hasText: /^All$/ }).click();
  await expect(page.locator('#tally')).toContainText(`of ${S.projects.length}`);

  await page.locator('#artist-filters button', { hasText: /^Chas Byassee$/ }).click();
  const chas = S.projects.filter(p => p.artistId === 'chas').length;
  await expect(page.locator('#tally')).toContainText(`of ${chas}`);
});

test('a filter combination with no work shows the empty state, not a blank grid', async ({ page }) => {
  await page.locator('#artist-filters button', { hasText: /^Brother Greg$/ }).click();
  await page.locator('#style-filters button', { hasText: /^Black & grey$/ }).click();
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
    'set-james-dragon-sleeve': 'r5-james-05.jpg',
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
    'set-brian-lady-head': 'r2-brian-brian-10.jpg',
    // September 2026: same tattoo or painting shot twice, better image first
    'set-brian-panther': 'orig-ig-193920.jpg',
    'set-greg-religious-flash': 'r2-greg-greg-02.jpg',
    'set-james-koi-back': 'r2-james-james-12.jpg',
    'set-james-lady-pearls': 'orig-ig-194150.jpg',
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

test('the Black & grey filter contains no colour work', async ({ page }) => {
  // The archive shipped with colour pieces under Black & grey — the shop
  // spotted it on the live site. These are the specific offenders.
  const S = await site(page);
  const byId = Object.fromEntries(S.projects.map(p => [p.id, p]));
  for (const id of ['set-brian-panther', 'p-orig-ig-193926', 'p-orig-ig-194010',
                    'p-orig-os-4503443', 'p-orig-os-4503438']) {
    expect(byId[id], id).toBeTruthy();
    expect(byId[id].style, `${id} "${byId[id].title}" is back under Black & grey`)
      .not.toBe('Black & grey');
  }
  // and no title under Black & grey may advertise colour
  for (const p of S.projects.filter(x => x.style === 'Black & grey')) {
    expect(p.title, p.id).not.toMatch(/\bcolou?r\b|red accents/i);
  }
});

test('pieces whose own title says black and grey are filed that way', async ({ page }) => {
  const S = await site(page);
  const wrong = S.projects
    .filter(p => /black\s*(&|and)\s*gr[ae]y|blackwork/i.test(p.title) && p.style !== 'Black & grey')
    .map(p => `${p.id} (${p.style}) ${p.title}`);
  expect(wrong).toEqual([]);
});

test('nothing on skin is filed under Paintings, and no painting is filed as a tattoo', async ({ page }) => {
  const S = await site(page);
  // this one was a tattoo photographed close up, filed as a painting
  const claws = S.projects.find(p => p.id === 'p-r2-brian-brian-04');
  expect(claws.title).toMatch(/on skin/i);
  expect(claws.style).not.toBe('Paintings');
  for (const p of S.projects.filter(x => x.style === 'Paintings')) {
    expect(p.title, `${p.id} is filed under Paintings`).not.toMatch(/\bon skin\b|\btattooed\b/i);
  }
});

test('the artist-at-work photo sits with the shop photos, not in the work gallery', async ({ page }) => {
  const S = await site(page);
  expect(S.projects.find(p => p.id === 'p-r2-james-james-10')).toBeUndefined();
  const shop = S.shopPhotos.find(x => x.f === 'r2-james-james-10.jpg');
  expect(shop, 'process photo missing from shopPhotos').toBeTruthy();
  expect(shop.cap).toMatch(/tattooing a client/i);
  // it is rendered in the Find the shop strip
  await expect(page.locator(`#shop-strip img[src*="r2-james-james-10"]`)).toHaveCount(1);
});

test('every style filter still has work behind it', async ({ page }) => {
  const S = await site(page);
  for (const style of S.styles) {
    const n = S.projects.filter(p => p.style === style).length;
    expect(n, `style "${style}" has no work`).toBeGreaterThan(0);
    await page.locator('#style-filters button', { hasText: new RegExp(`^${style.replace(/&/, '&')}$`) }).click();
    await expect(page.locator('#tally')).toContainText(`of ${n}`);
    await expect(page.locator('#grid-empty')).toBeHidden();
  }
});

test('the two lady head cards are one swipeable card, wide view first', async ({ page }) => {
  const S = await site(page);
  const p = S.projects.find(x => x.id === 'set-brian-lady-head');
  expect(p.photos.map(x => x.f)).toEqual(['r2-brian-brian-10.jpg', 'r2-brian-brian-19.jpg']);
  const ids = (await order(page)).map(x => x.id);
  expect(ids).not.toContain('p-r2-brian-brian-10');
  expect(ids).not.toContain('p-r2-brian-brian-19');

  await page.goto('/#work/set-brian-lady-head');
  await expect(page.locator('#viewer')).toHaveJSProperty('open', true);
  await expect(page.locator('#v-rail .v-slide')).toHaveCount(2);
  await expect(page.locator('#v-counter')).toHaveText('1 / 2');
  await page.locator('#v-next').click();
  await expect(page.locator('#v-counter')).toHaveText('2 / 2');
});

test('work the shop flagged as not-a-painting sits at the end of Paintings', async ({ page }) => {
  const S = await site(page);
  const flagged = ['p-orig-ig-193745', 'p-orig-ig-194017', 'p-orig-os-5261262',
                   'p-r2-greg-greg-09', 'p-orig-ig-193851', 'p-orig-ig-193848',
                   'p-r2-james-james-07', 'p-r4-chas-chas-20', 'p-orig-ig-193739',
                   'p-orig-ig-193742', 'p-orig-os-5261255'];
  for (const id of flagged) expect(S.buried, `${id} not buried`).toContain(id);

  // inside the Paintings filter they must all come after the genuine paintings
  const paintings = (await order(page)).filter(p => p.style === 'Paintings').map(p => p.id);
  const firstFlagged = paintings.findIndex(id => flagged.includes(id));
  const lastClean = paintings.reduce((acc, id, i) => (flagged.includes(id) ? acc : i), -1);
  expect(firstFlagged).toBeGreaterThan(lastClean);
});

test('the ornamental sleeve is off the front page and near the end', async ({ page }) => {
  const S = await site(page);
  expect(S.featured).not.toContain('p-orig-ig-193943');
  expect(S.buried).toContain('p-orig-ig-193943');
  const ids = (await order(page)).map(p => p.id);
  expect(ids.indexOf('p-orig-ig-193943')).toBeGreaterThan(ids.length - S.buried.length - 1);
});

test('Lettering is gone and its three pieces sit at the end of Color', async ({ page }) => {
  const S = await site(page);
  expect(S.styles).not.toContain('Lettering');
  await expect(page.locator('#style-filters button', { hasText: /^Lettering$/ })).toHaveCount(0);
  expect(S.projects.filter(p => p.style === 'Lettering')).toHaveLength(0);

  const moved = ['p-orig-os-4503448', 'p-orig-os-4503445', 'p-orig-os-4503431'];
  const byId = Object.fromEntries(S.projects.map(p => [p.id, p]));
  for (const id of moved) {
    expect(byId[id], id).toBeTruthy();
    expect(byId[id].style, id).toBe('Color');
    expect(byId[id].artistId, id).toBe('thad');
  }
  // last in the Color filter, which is where the shop asked for them
  const colour = (await order(page)).filter(p => p.style === 'Color').map(p => p.id);
  expect(colour.slice(-3).sort()).toEqual([...moved].sort());
});

test('the shop hours read 12:00 PM to 7:00 PM, every day, everywhere', async ({ page }) => {
  const S = await site(page);
  expect(S.hours.weekly).toHaveLength(7);
  for (const d of S.hours.weekly) {
    expect(d.open, d.day).toBe('12:00');
    expect(d.close, d.day).toBe('19:00');
  }
  await expect(page.locator('#hours-now')).toHaveText('12:00 PM to 7:00 PM, daily');
  const rows = page.locator('#hours-list li');
  await expect(rows).toHaveCount(7);
  for (let i = 0; i < 7; i++) {
    await expect(rows.nth(i)).toContainText('12:00 PM \u2013 7:00 PM');
  }
  await expect(page.locator('footer')).toContainText('12:00 PM to 7:00 PM');
  // nothing anywhere still says the old closing time
  const html = (await page.content()).toLowerCase();
  expect(html).not.toContain('8 pm');
  expect(html).not.toContain('20:00');
});

test('the visitor-facing copy no longer says "the wall" or "card"', async ({ page }) => {
  // Greg's note: visitors did not know what "the wall" meant. Class names and
  // code comments are not visitor-facing, so this reads rendered text only.
  const text = await page.evaluate(() => document.body.innerText.toLowerCase());
  expect(text).not.toMatch(/\bwall\b/);
  expect(text).not.toMatch(/\bcards?\b/);
  await expect(page.locator('#gallery-h')).toHaveText('The work');
});

test('How it works spells out walk-ins, the deposit and free consultations', async ({ page }) => {
  const how = page.locator('#how');
  await expect(page.locator('#how-h')).toHaveText('How it works');
  await expect(how.locator('.steps-how > li')).toHaveCount(3);
  const text = (await how.innerText()).toLowerCase();
  expect(text).toContain('first come, first served');
  expect(text).toContain('between appointments');
  expect(text).toMatch(/call the shop before you come down|the earlier in the day/);
  expect(text).toContain('small deposit');
  expect(text).toMatch(/goes toward the price/);
  expect(text).toMatch(/holds the chair/);
  expect(text).toContain('consultations are free');
  expect(text).toContain('do not need an appointment');
  // it does not invent a deposit amount
  expect(text).not.toMatch(/\$\s?\d/);
});

test('the September merges each open as a two-photo swipeable card', async ({ page }) => {
  for (const [id, n] of [['set-brian-panther', 2], ['set-greg-religious-flash', 2],
                         ['set-james-koi-back', 2], ['set-james-lady-pearls', 2]]) {
    await page.goto('/#work/' + id);
    await expect(page.locator('#viewer')).toHaveJSProperty('open', true);
    await expect(page.locator('#v-rail .v-slide')).toHaveCount(n);
    await expect(page.locator('#v-counter')).toHaveText(`1 / ${n}`);
    await page.locator('#v-next').click();
    await expect(page.locator('#v-counter')).toHaveText(`${n} / ${n}`);
    await page.keyboard.press('Escape');
    // wait for the close to settle: closing pops the history entry the open
    // pushed, and racing the next hash navigation against that pop lands on a
    // half-torn-down viewer.
    await expect(page.locator('#viewer')).toHaveJSProperty('open', false);
    await expect(page.locator(`#card-${id} .count`)).toHaveText(String(n));
  }
  // and the cards they replaced no longer take a slot of their own
  const ids = (await order(page)).map(x => x.id);
  for (const gone of ['p-orig-ig-193920', 'p-orig-ig-193923', 'p-r2-greg-greg-01',
                      'p-r2-greg-greg-02', 'p-r2-james-james-12', 'p-orig-ig-194150']) {
    expect(ids, gone).not.toContain(gone);
  }
});

test('the September intake is on the site, credited to James Whelan', async ({ page }) => {
  const S = await site(page);
  const files = new Set();
  S.projects.forEach(p => p.photos.forEach(ph => files.add(ph.f)));
  // 23 supplied, 04 dropped as an identical duplicate of an existing photo
  const kept = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  expect(kept).toHaveLength(22);
  for (const n of kept) {
    const f = `r5-james-${String(n).padStart(2, '0')}.jpg`;
    expect(files.has(f), `${f} missing from the gallery`).toBe(true);
  }
  expect(files.has('r5-james-04.jpg'), 'the duplicate was imported anyway').toBe(false);
  // every project carrying one of them credits James Whelan
  for (const p of S.projects) {
    if (p.photos.some(ph => ph.f.startsWith('r5-james-'))) {
      expect(p.artistId, `${p.id} is not credited to James Whelan`).toBe('james');
    }
  }
  expect(S.artists.find(a => a.id === 'james').name).toBe('James Whelan');
  expect(S.artists.find(a => a.id === 'james').handle).toBe('_jameswhelan');
});
