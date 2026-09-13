// Crop-only removal of screenshot chrome from the photo masters.
//
// Roughly half the archive came in as Instagram post screenshots and still
// carried the app's own furniture: the carousel counter pill top-right, the
// mute / tagged-people / liked-by icons along the bottom, an app watermark,
// and letterbox bars from square post frames. tools/chrome-plan.json holds one
// rectangle per affected file, measured from pixel geometry and confirmed by
// eye (AUDIT.md). The only operation here is a crop: nothing is painted,
// cloned or inpainted, so no pixel of anybody's artwork is ever invented.
//
// Re-runnable. The untouched master is copied to photos/_prechrome/ the first
// time a file is cropped, and that copy is the marker that stops a second pass
// from cropping an already-cropped file.
//
//   node tools/clean-chrome.mjs
import sharp from 'sharp';
import { readFile, writeFile, mkdir, access, copyFile } from 'node:fs/promises';
import path from 'node:path';

const PHOTOS = 'photos';
const ORIG = path.join(PHOTOS, "_prechrome");
const { crop } = JSON.parse(await readFile('tools/chrome-plan.json', 'utf8'));

await mkdir(ORIG, { recursive: true });

let done = 0, skipped = 0, missing = 0;
const sizes = {};

for (const [file, entry] of Object.entries(crop)) {
  const src = path.join(PHOTOS, file);
  const keep = path.join(ORIG, file);
  const [x0, y0, x1, y1] = entry.box;

  try { await access(src); } catch { missing++; continue; }
  try { await access(keep); skipped++; continue; } catch { /* not cropped yet */ }

  const meta = await sharp(src).metadata();
  if (meta.width !== entry.from[0] || meta.height !== entry.from[1]) {
    throw new Error(`${file}: master is ${meta.width}x${meta.height}, plan expects ${entry.from.join('x')}`);
  }
  await copyFile(src, keep);
  const buf = await sharp(src)
    .extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 })
    .jpeg({ quality: 92, mozjpeg: true })   // sharp writes no metadata unless asked
    .toBuffer();
  await writeFile(src, buf);
  sizes[file] = [x1 - x0, y1 - y0];
  done++;
}

console.log(`cropped=${done} already-done=${skipped} missing=${missing}`);
for (const [f, wh] of Object.entries(sizes)) console.log(`  ${f} -> ${wh[0]}x${wh[1]}`);
// photos/_prechrome/ is deliberately gitignored: the pre-crop masters are
// already recoverable from git history, and 33 MB of duplicates in the tree
// would double the repo's photo weight for no gain. The dimension check above
// is the real safety net - on a fresh clone it refuses to crop a master whose
// size no longer matches the plan's "from", so a second pass can never crop
// twice even with the marker directory absent.
