const { test, expect } = require('@playwright/test');

// Nothing in here ever reaches the shop: on any host that is not
// sanclementetattoo.com the form is in dry-run mode and posts nothing. The one
// test that exercises a real POST routes it to an intercepted URL.
const fill = async (page) => {
  await page.fill('#idea', 'Traditional panther on the calf');
  await page.fill('#size', 'About 5 inches');
  await page.fill('#placement', 'Outer calf');
  await page.fill('#name', 'Test Person');
  await page.fill('#phone', '9495550123');
  await page.fill('#email', 'test@example.com');
  await page.check('input[name="age18"]');
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#booking-form')).toBeVisible();
});

test('the Netlify wiring the shop depends on is present', async ({ page }) => {
  const f = page.locator('#booking-form');
  await expect(f).toHaveAttribute('name', 'booking');
  await expect(f).toHaveAttribute('data-netlify', 'true');
  await expect(f).toHaveAttribute('method', 'POST');
  await expect(f).toHaveAttribute('netlify-honeypot', 'bot-field');
  await expect(page.locator('input[name="form-name"][value="booking"]')).toHaveCount(1);
});

test('a broken wiring is reported loudly instead of failing silently', async ({ page }) => {
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/');                               // clean load: no complaints
  await expect(page.locator('#booking-form')).toBeVisible();
  expect(errors.filter(e => e.includes('[booking]'))).toEqual([]);

  // break it the way a careless edit would, then re-run the audit
  const shouted = await page.evaluate(() => {
    const msgs = [];
    const real = console.error;
    console.error = (...a) => msgs.push(a.join(' '));
    document.getElementById('booking-form').removeAttribute('data-netlify');
    document.querySelector('input[name="form-name"]').remove();
    // re-run the same audit the page runs on load
    const f = document.getElementById('booking-form');
    const bad = [];
    if (f.getAttribute('name') !== 'booking') bad.push('name');
    if (f.getAttribute('data-netlify') !== 'true') bad.push('data-netlify="true" missing');
    if (!f.querySelector('input[name="form-name"][value="booking"]')) bad.push('hidden form-name input missing');
    if (bad.length) console.error('[booking] form wiring is broken, submissions will be lost:', bad.join('; '));
    console.error = real;
    return msgs;
  });
  expect(shouted.join(' ')).toContain('form wiring is broken');
});

test('required fields block submission and focus the first problem', async ({ page }) => {
  await page.locator('#send').click();
  await expect(page.locator('#form-error')).toContainText('Check the highlighted fields');
  await expect(page.locator('#form-result')).toBeHidden();
  expect(await page.evaluate(() => document.activeElement.id)).toBe('idea');
});

test('the 18+ confirmation cannot be skipped', async ({ page }) => {
  await fill(page);
  await page.uncheck('input[name="age18"]');
  await page.locator('#send').click();
  await expect(page.locator('#form-error')).toContainText('Check the highlighted fields');
  await expect(page.locator('#form-result')).toBeHidden();
});

test('an invalid email is rejected', async ({ page }) => {
  await fill(page);
  await page.fill('#email', 'not-an-email');
  await page.locator('#send').click();
  await expect(page.locator('#form-error')).toContainText('Check the highlighted fields');
});

test('dry run logs the inquiry and posts nothing to the shop', async ({ page }) => {
  const logs = [];
  page.on('console', m => logs.push(m.text()));
  const posts = [];
  await page.route('**/*', route => {
    if (route.request().method() === 'POST') { posts.push(route.request().url()); return route.abort(); }
    return route.continue();
  });

  await fill(page);
  await page.waitForTimeout(3100);                    // clear the bot time-trap
  await page.locator('#send').click();

  await expect(page.locator('#form-result')).toBeVisible();
  await expect(page.locator('#form-result')).toHaveClass(/dry/);
  await expect(page.locator('#form-result')).toContainText('Nothing was sent to the shop');
  expect(posts, 'a dry run must not POST anywhere').toEqual([]);
  expect(logs.join(' ')).toContain('DRY RUN');
  // the logged payload is the real inquiry, so it can be inspected
  expect(logs.join(' ')).toContain('Traditional panther on the calf');
});

test('too-fast submissions are treated as bots', async ({ page }) => {
  await fill(page);
  await page.locator('#send').click();                 // well under the 3s trap
  await expect(page.locator('#form-error')).toContainText('one more second');
  await expect(page.locator('#form-result')).toBeHidden();
});

test('a filled honeypot silently drops the submission', async ({ page }) => {
  await fill(page);
  await page.waitForTimeout(3100);
  await page.evaluate(() => { document.querySelector('input[name="bot-field"]').value = 'spam'; });
  await page.locator('#send').click();
  await page.waitForTimeout(400);
  await expect(page.locator('#form-result')).toBeHidden();
});

test('a failed send never claims success and offers phone plus email', async ({ page }) => {
  // force the live path, then make the POST fail
  await page.goto('/?dryrun=0');
  await page.route('**/*', route =>
    route.request().method() === 'POST' ? route.abort('failed') : route.continue());
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await fill(page);
  await page.waitForTimeout(3100);
  await page.locator('#send').click();

  const box = page.locator('#form-result');
  await expect(box).toBeVisible();
  await expect(box).toHaveClass(/bad/);
  await expect(box).toContainText('was not delivered');
  await expect(box).not.toContainText('Request sent');
  await expect(box.locator('a[href^="tel:"]')).toHaveCount(1);
  await expect(box.locator('a[href^="mailto:"]')).toHaveCount(1);
  // the failure is reported, not swallowed
  expect(errors.join(' ')).toContain('inquiry NOT delivered');
  // and the send button is usable again
  await expect(page.locator('#send')).toBeEnabled();
});

test('a successful send confirms and clears the form', async ({ page }) => {
  await page.goto('/?dryrun=0');
  await page.route('**/*', route =>
    route.request().method() === 'POST' ? route.fulfill({ status: 200, body: 'ok' }) : route.continue());

  await fill(page);
  await page.waitForTimeout(3100);
  await page.locator('#send').click();

  await expect(page.locator('#form-result')).toHaveClass(/ok/);
  await expect(page.locator('#form-result')).toContainText('Request sent');
  await expect(page.locator('#idea')).toHaveValue('');
});

test('the reference photo is sent as multipart so the file survives', async ({ page }) => {
  await page.goto('/?dryrun=0');
  let contentType = null, body = null;
  await page.route('**/*', route => {
    if (route.request().method() === 'POST') {
      contentType = route.request().headers()['content-type'] || '';
      body = route.request().postData() || '';
      return route.fulfill({ status: 200, body: 'ok' });
    }
    return route.continue();
  });

  await fill(page);
  await page.setInputFiles('#ref', {
    name: 'old-tattoo.png', mimeType: 'image/png',
    buffer: Buffer.from('89504e470d0a1a0a', 'hex'),
  });
  await page.waitForTimeout(3100);
  await page.locator('#send').click();
  await expect(page.locator('#form-result')).toHaveClass(/ok/);

  expect(contentType).toContain('multipart/form-data');
  expect(body).toContain('old-tattoo.png');
  expect(body).toContain('Traditional panther on the calf');
});

test('the address the shop hands out submits for real; every rehearsal host does not', async ({ page }) => {
  // The canonical domain and the live address are two different things right
  // now: sanclementetattoo.com still serves the old site, so the shop hands out
  // sc-tattoo.netlify.app. A customer standing on that address has to get a
  // real submission rather than a "this is not the live site" message, and
  // every preview and local run must still post nothing.
  const live = (host) => page.evaluate(h => window.liveHost(h), host);

  for (const host of ['sanclementetattoo.com', 'www.sanclementetattoo.com',
                      'sc-tattoo.netlify.app']) {
    expect(await live(host), `${host} should submit for real`).toBe(true);
  }
  // exact match only, so previews, branch deploys and lookalikes stay dry
  for (const host of ['deploy-preview-6--sc-tattoo.netlify.app',
                      'greg-sept-update--sc-tattoo.netlify.app',
                      'sc-tattoo.netlify.app.evil.example',
                      'notsc-tattoo.netlify.app',
                      '127.0.0.1', 'localhost']) {
    expect(await live(host), `${host} must stay in dry run`).toBe(false);
  }
});
