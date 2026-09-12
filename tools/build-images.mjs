// Generates the responsive WebP derivatives the site actually serves.
// Masters in photos/*.jpg are the archival source and are never served directly.
// Deterministic: same input bytes -> same output bytes. Safe to re-run.
//
//   node tools/build-images.mjs          # only missing/stale derivatives
//   node tools/build-images.mjs --force  # rebuild everything
import sharp from 'sharp';
import { readdir, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'photos';
const OUT = 'assets/g';
const WIDTHS = [360, 540, 720, 1080];
const QUALITY = { 360: 76, 540: 78, 720: 80, 1080: 82 };
const force = process.argv.includes('--force');

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter(f => f.endsWith('.jpg')).sort();

const fresh = async (src, dst) => {
  try { return (await stat(dst)).mtimeMs >= (await stat(src)).mtimeMs; } catch { return false; }
};

let made = 0, kept = 0;
const index = {};
for (const f of files) {
  const id = path.basename(f, '.jpg');
  const src = path.join(SRC, f);
  const meta = await sharp(src).metadata();
  index[f] = { w: meta.width, h: meta.height };
  // Never upscale. A master smaller than the narrowest breakpoint still gets
  // one derivative at its own width, so every photo has a WebP to serve.
  // app.js derives the same list from the w/h in data/site.js.
  let widths = WIDTHS.filter(w => w <= meta.width);
  if (widths.length === 0) widths = [meta.width];
  for (const w of widths) {
    const dst = path.join(OUT, `${id}-${w}.webp`);
    if (!force && await fresh(src, dst)) { kept++; continue; }
    await sharp(src)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY[w] ?? 80, effort: 5 })   // strips all metadata by default
      .toFile(dst);
    made++;
  }
}
await writeFile(path.join(OUT, 'index.json'), JSON.stringify(index));
console.log(`masters=${files.length} derivatives written=${made} up-to-date=${kept}`);
