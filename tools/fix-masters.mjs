// One-time, deterministic correction of the photo masters.
// Rotations were identified by visual review (see AUDIT.md); duplicates by
// sha256 + perceptual hashing + registration residual. Re-runnable: rotating an
// already-corrected file is prevented by the _originals/ marker.
import sharp from 'sharp';
import { readFile, writeFile, mkdir, rm, access, copyFile } from 'node:fs/promises';
import path from 'node:path';

const PHOTOS = 'photos';
const ORIG = path.join(PHOTOS, '_originals');
const plan = JSON.parse(await readFile(process.argv[2], 'utf8'));

await mkdir(ORIG, { recursive: true });

let rotated = 0, deleted = 0, skipped = 0;

for (const id of plan.rotate_90_cw) {
  const src = path.join(PHOTOS, `${id}.jpg`);
  const keep = path.join(ORIG, `${id}.jpg`);
  try { await access(keep); skipped++; continue; } catch {}   // already corrected
  await copyFile(src, keep);                                   // recoverable original
  const buf = await sharp(src).rotate(90).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  await writeFile(src, buf);
  rotated++;
}

for (const d of plan.duplicates_delete) {
  const p = path.join(PHOTOS, `${d.delete}.jpg`);
  try { await access(p); } catch { skipped++; continue; }
  await rm(p);
  deleted++;
}

console.log(`rotated=${rotated} deleted=${deleted} already-done=${skipped}`);
