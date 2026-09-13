// Renders the Open Graph / Twitter card and the touch icon with the real brand
// fonts by screenshotting a local HTML template in Chromium.
// Nothing here is AI-generated: it is typography plus one real shop photograph.
import { chromium } from '@playwright/test';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

const ROOT = process.cwd();
const shot = 'photos/r2-greg-greg-05.jpg';            // the shop's red front door
const b64 = (await readFile(shot)).toString('base64');

// Chromium will not fetch fonts cross-origin over file://, so the faces are
// inlined as data URIs. That also makes the render independent of the CSS file.
let fontCss = await readFile('assets/css/fonts.css', 'utf8');
for (const m of [...fontCss.matchAll(/url\(\.\.\/fonts\/([^)]+)\)/g)]) {
  const bytes = (await readFile(path.join('assets/fonts', m[1]))).toString('base64');
  fontCss = fontCss.replace(m[0], `url(data:font/woff2;base64,${bytes})`);
}

const page = (w, h, body) => `<!doctype html><meta charset="utf-8">
<style>${fontCss}</style>
<style>
  html,body{margin:0;padding:0}
  body{width:${w}px;height:${h}px;overflow:hidden;background:#0B0B0C;color:#F6F5F2}
  *{box-sizing:border-box}
</style>${body}`;

const og = page(1200, 630, `
<style>
  .card{display:flex;width:1200px;height:630px}
  .left{flex:1 1 62%;padding:64px 56px;display:flex;flex-direction:column;justify-content:center;
        background:
          radial-gradient(ellipse at 15% 0%, rgba(198,160,42,.20), transparent 55%),
          repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(247,241,220,.035) 31px),
          #0B0B0C;
        border-right:10px solid #B3121E}
  .eyebrow{font-family:Archivo,sans-serif;font-weight:800;font-size:21px;letter-spacing:.22em;
           text-transform:uppercase;color:#C8A02E;margin:0 0 20px}
  .name{font-family:Bungee,Impact,sans-serif;font-size:82px;line-height:.95;margin:0;color:#F6F5F2}
  .name em{display:block;font-style:normal;color:#E9CC72}
  .rule{height:9px;background:#B3121E;width:300px;margin:30px 0 26px}
  .script{font-family:Yellowtail,cursive;font-size:44px;color:#E9CC72;margin:0 0 22px;line-height:1}
  .meta{font-family:Archivo,sans-serif;font-size:25px;line-height:1.5;color:#A9A9B0;margin:0}
  .meta b{color:#fff}
  .right{flex:0 0 38%;position:relative}
  .right img{width:100%;height:100%;object-fit:cover;display:block}
  .right::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(20,17,12,.55),rgba(20,17,12,0) 45%)}
</style>
<div class="card">
  <div class="left">
    <p class="eyebrow">Traditional street shop</p>
    <h1 class="name">SAN CLEMENTE<em>TATTOO</em></h1>
    <div class="rule"></div>
    <p class="script">Walk-ins every day</p>
    <p class="meta"><b>117 Avenida Granada</b> · San Clemente, CA<br>12:00 PM to 7:00 PM, daily · (949) 498-8487</p>
  </div>
  <div class="right"><img src="data:image/jpeg;base64,${b64}" alt=""></div>
</div>`);

const icon = page(512, 512, `
<style>
  .i{width:512px;height:512px;display:flex;flex-direction:column;align-items:center;justify-content:center;
     background:#0B0B0C;border:26px solid #B3121E}
  .i span{font-family:Bungee,Impact,sans-serif;font-size:190px;line-height:.86;color:#F6F5F2}
  .i span.g{color:#E9CC72}
  .i i{display:block;width:210px;height:12px;background:#C8A02E;margin:18px 0}
</style>
<div class="i"><span>SC</span><i></i><span class="g">TAT</span></div>`);

// This sandbox ships one Chromium build that may not match the installed
// Playwright version, and no headless-shell build at all, so find a real
// browser the same way playwright.config.js does before falling back to
// Playwright's own managed download.
function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return undefined;
  const dirs = readdirSync(root).filter(d => /^chromium-\d+$/.test(d)).sort().reverse();
  for (const d of dirs) {
    const bin = path.join(root, d, 'chrome-linux', 'chrome');
    if (existsSync(bin)) return bin;
  }
  return undefined;
}
const exe = findChromium();
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
await mkdir('assets', { recursive: true });

async function render(html, w, h, out, type, needFonts) {
  const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.setContent(html, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  // Fail loudly rather than shipping a card in fallback fonts. Only the faces
  // the templates actually use are checked; fonts.check() is false for a
  // declared-but-unused @font-face.
  const loaded = await p.evaluate(
    (fonts) => fonts.filter(f => !document.fonts.check(`40px "${f}"`)), needFonts);
  if (loaded.length) throw new Error('brand fonts did not load: ' + loaded.join(', '));
  await p.screenshot({ path: out, type, quality: type === 'jpeg' ? 88 : undefined });
  await p.close();
  console.log(out);
}

await render(og, 1200, 630, 'assets/og.jpg', 'jpeg', ['Bungee', 'Yellowtail', 'Archivo']);
await render(icon, 512, 512, 'assets/apple-touch-icon.png', 'png', ['Bungee']);
await browser.close();

// Flat SVG favicon: no raster, scales everywhere, tiny.
await writeFile('assets/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="San Clemente Tattoo">
<rect width="64" height="64" fill="#0B0B0C"/>
<rect x="3" y="3" width="58" height="58" fill="none" stroke="#B3121E" stroke-width="6"/>
<path d="M12 33h40" stroke="#C8A02E" stroke-width="4"/>
<text x="32" y="27" text-anchor="middle" font-family="Impact,Haettenschweiler,sans-serif" font-size="19" fill="#F6F5F2">SC</text>
<text x="32" y="50" text-anchor="middle" font-family="Impact,Haettenschweiler,sans-serif" font-size="16" fill="#E9CC72">TAT</text>
</svg>
`);
console.log('assets/favicon.svg');
