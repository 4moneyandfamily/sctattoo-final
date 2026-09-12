// Chromium only in this sandbox: the Playwright CDN is blocked here, so the
// Firefox and WebKit downloads fail. CI with network access should drop the
// `projects` override and run all three.
const { defineConfig, devices } = require('@playwright/test');

// Use CHROMIUM_PATH when set. Otherwise, if Playwright's own managed build is
// missing but the image ships one under PLAYWRIGHT_BROWSERS_PATH, use that
// rather than failing with "run npx playwright install".
const fs = require('node:fs');
const path = require('node:path');

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !fs.existsSync(root)) return undefined;
  const dirs = fs.readdirSync(root).filter(d => /^chromium-\d+$/.test(d)).sort().reverse();
  for (const d of dirs) {
    const exe = path.join(root, d, 'chrome-linux', 'chrome');
    if (fs.existsSync(exe)) return exe;
  }
  return undefined;
}

const exe = findChromium();
const launchOptions = exe ? { executablePath: exe } : {};

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 30000,
  expect: { timeout: 7000 },
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:8080',
    launchOptions,
  },
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npx --yes serve -l 8080 .',
    url: 'http://127.0.0.1:8080/',
    reuseExistingServer: true,
    timeout: 60000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions, viewport: { width: 1280, height: 900 } } },
    { name: 'tablet',  use: { ...devices['Desktop Chrome'], launchOptions, viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true } },
    { name: 'phone',   use: { ...devices['Desktop Chrome'], launchOptions, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 } },
  ],
});
