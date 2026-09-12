// There is no build step and no type checker, so this stands in for both.
// It checks the things that would otherwise break silently in production:
// syntax, data/file agreement, image metadata, and the invariants the site
// relies on. Exits non-zero on any error.
import { readFile, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

// --- 1. syntax -------------------------------------------------------------
for (const f of ['assets/js/app.js', 'data/site.js']) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); }
  catch (e) { err(`${f}: syntax error\n${e.stderr}`); }
}

// --- 2. load the data the way the page does --------------------------------
const g = {};
try {
  const src = await readFile('data/site.js', 'utf8');
  new Function('window', src)(g);
} catch (e) { err(`data/site.js did not evaluate: ${e.message}`); }
const SITE = g.SITE;
if (!SITE) err('data/site.js did not set window.SITE');

const html = await readFile('index.html', 'utf8');
const css = await readFile('assets/css/app.css', 'utf8');
const app = await readFile('assets/js/app.js', 'utf8');

// --- 3. the surname must not appear anywhere -------------------------------
// Base64 so the name itself is not written anywhere in this repository,
// while the check that keeps it off the site still works.
const SURNAME = Buffer.from('cmFuY291cnQ=', 'base64').toString();
for (const [name, body] of [['index.html', html], ['data/site.js', await readFile('data/site.js', 'utf8')],
                            ['assets/js/app.js', app], ['assets/css/app.css', css],
                            ['netlify.toml', await readFile('netlify.toml', 'utf8')],
                            ['README.md', await readFile('README.md', 'utf8')]]) {
  if (body.toLowerCase().includes(SURNAME)) err(`${name}: the owner's surname appears in published content`);
}
for (const f of await readdir('photos')) {
  if (f.toLowerCase().includes(SURNAME)) err(`photos/${f}: filename contains the owner's surname`);
}

if (SITE) {
  // --- 4. photo files and derivatives exist, dimensions are truthful -------
  const WIDTHS = [360, 540, 720, 1080];
  const all = [...SITE.projects.flatMap(p => p.photos.map(ph => ({ ...ph, owner: p.id }))),
               ...SITE.shopPhotos.map(ph => ({ ...ph, owner: 'shopPhotos' }))];

  for (const ph of all) {
    let meta;
    try { meta = await sharp(`photos/${ph.f}`).metadata(); }
    catch { err(`${ph.owner}: photos/${ph.f} is referenced but missing`); continue; }

    if (meta.width !== ph.w || meta.height !== ph.h) {
      err(`${ph.f}: data says ${ph.w}x${ph.h}, file is ${meta.width}x${meta.height} ` +
          `(run "npm run images" and update data/site.js)`);
    }
    if (meta.orientation && meta.orientation !== 1) {
      err(`${ph.f}: carries EXIF orientation ${meta.orientation}; rotation must be baked into pixels`);
    }
    if (meta.exif) err(`${ph.f}: still carries EXIF metadata, which must be stripped before publishing`);

    let avail = WIDTHS.filter(w => w <= ph.w);
    if (!avail.length) avail = [ph.w];
    for (const w of avail) {
      try { await stat(`assets/g/${ph.f.replace(/\.jpg$/, '')}-${w}.webp`); }
      catch { err(`${ph.f}: derivative ${w}w is missing (run "npm run images")`); }
    }
  }

  // --- 5. no photo may appear twice ---------------------------------------
  const seen = new Map();
  for (const ph of all) {
    if (seen.has(ph.f)) err(`${ph.f} appears in both ${seen.get(ph.f)} and ${ph.owner}`);
    seen.set(ph.f, ph.owner);
  }

  // --- 6. orphan masters ---------------------------------------------------
  const onDisk = (await readdir('photos')).filter(f => f.endsWith('.jpg'));
  for (const f of onDisk) {
    if (!seen.has(f)) warn(`photos/${f} is on disk but nothing references it`);
  }

  // --- 7. structural invariants -------------------------------------------
  const ids = new Set();
  for (const p of SITE.projects) {
    if (ids.has(p.id)) err(`duplicate project id: ${p.id}`);
    ids.add(p.id);
    if (!p.photos.length) err(`${p.id}: has no photos`);
    if (!p.title || p.title.length < 3) err(`${p.id}: title is missing or too short`);
    if (!SITE.styles.includes(p.style)) err(`${p.id}: style "${p.style}" is not in SITE.styles`);
    if (p.artistId && !SITE.artists.some(a => a.id === p.artistId)) {
      err(`${p.id}: unknown artistId "${p.artistId}"`);
    }
    for (const ph of p.photos) if (!ph.cap) err(`${p.id}: photo ${ph.f} has no caption`);
  }
  // a style chip with nothing behind it is a dead end
  for (const s of SITE.styles) {
    if (!SITE.projects.some(p => p.style === s)) err(`style "${s}" has no work and would show an empty filter`);
  }
  for (const a of SITE.artists) {
    if (a.instagram !== `https://www.instagram.com/${a.handle}/`) {
      err(`artist ${a.id}: instagram URL does not match handle @${a.handle}`);
    }
  }
  if (SITE.hours.weekly.length !== 7) err('hours.weekly must have 7 days');

  // --- 7b. the curated running order -------------------------------------
  const seenOrder = new Set();
  for (const [list, name] of [[SITE.featured, 'featured'], [SITE.buried, 'buried']]) {
    if (list === undefined) { warn(`SITE.${name} is missing; the wall falls back to archive order`); continue; }
    if (!Array.isArray(list)) { err(`SITE.${name} must be an array`); continue; }
    for (const id of list) {
      if (!ids.has(id)) err(`SITE.${name}: "${id}" is not a project id`);
      if (seenOrder.has(id)) err(`"${id}" is in both featured and buried`);
      seenOrder.add(id);
    }
    const dupes = list.filter((v, i) => list.indexOf(v) !== i);
    if (dupes.length) err(`SITE.${name} lists ${[...new Set(dupes)].join(', ')} more than once`);
  }
  // 24 is one full page; more than that and the tail never gets seen as featured
  if (Array.isArray(SITE.featured) && SITE.featured.length > 24) {
    warn(`SITE.featured has ${SITE.featured.length} entries but only 24 fit the first page`);
  }
  // a featured project with a weak cover defeats the point
  for (const id of SITE.featured || []) {
    const p = SITE.projects.find(x => x.id === id);
    if (p && !p.photos.length) err(`featured "${id}" has no photos`);
  }
}

// --- 8. markup invariants the CSP and CLS budgets depend on ----------------
if (/\sstyle="/.test(html)) err('index.html: inline style attribute found; the CSP forbids inline styles');
const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g)].map(m => m[0]);
for (const s of inlineScripts) {
  if (!s.includes('application/ld+json')) err(`index.html: executable inline script found (${s}); the CSP forbids it`);
}
for (const m of html.matchAll(/<img\b[^>]*>/g)) {
  if (!/\bwidth=/.test(m[0]) || !/\bheight=/.test(m[0])) err(`index.html: <img> without width/height: ${m[0].slice(0, 70)}`);
  if (!/\balt=/.test(m[0])) err(`index.html: <img> without alt: ${m[0].slice(0, 70)}`);
}
if (!/rel="canonical"/.test(html)) err('index.html: no canonical link');
for (const tag of ['og:title', 'og:description', 'og:image', 'og:url', 'twitter:card']) {
  if (!html.includes(tag)) err(`index.html: missing ${tag}`);
}
try { JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]); }
catch (e) { err(`index.html: structured data is not valid JSON (${e.message})`); }

// every <img> the app builds must reserve its box too
if (!/width="' \+ \w+\.w \+ '"/.test(app) && !app.includes("width=\"' + cover.w")) {
  warn('assets/js/app.js: could not confirm generated <img> tags carry width/height');
}

// --- report ---------------------------------------------------------------
for (const w of warns) console.log(`warn   ${w}`);
for (const e of errors) console.log(`ERROR  ${e}`);
console.log(`\n${errors.length} error(s), ${warns.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
