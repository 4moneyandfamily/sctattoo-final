// Adds new photos to the gallery. Copy the files into photos/ first, then:
//
//   node tools/add-photos.mjs photos/new-piece-01.jpg photos/new-piece-02.jpg
//
// It strips metadata, bakes in any rotation the camera recorded, builds the
// responsive derivatives, and prints a ready-to-paste block for data/site.js.
// Several files given at once are treated as one tattoo (one card, first file
// as the cover) — run it once per tattoo.
import sharp from 'sharp';
import { writeFile, readFile, mkdir, copyFile, access } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node tools/add-photos.mjs photos/<file>.jpg [more files...]');
  console.error('       all files given are treated as one tattoo, first file is the cover');
  process.exit(1);
}

await mkdir('photos/_originals', { recursive: true });
const out = [];

for (const f of files) {
  if (path.dirname(f) !== 'photos') { console.error(`${f}: put the file in photos/ first`); process.exit(1); }
  const id = path.basename(f, '.jpg');
  const SURNAME = Buffer.from('cmFuY291cnQ=', 'base64').toString();   // not spelled out on purpose
  if (id.toLowerCase().includes(SURNAME)) { console.error(`${f}: filename must not contain the owner's surname`); process.exit(1); }

  const before = await sharp(f).metadata();
  const notes = [];
  if (before.orientation && before.orientation !== 1) notes.push(`EXIF orientation ${before.orientation} baked in`);
  if (before.exif) notes.push('EXIF stripped');
  if (before.gps) notes.push('GPS stripped');

  // keep a recoverable original the first time we touch a file
  try { await access(`photos/_originals/${id}.jpg`); }
  catch { await copyFile(f, `photos/_originals/${id}.jpg`); }

  // .rotate() with no argument applies the EXIF orientation to the pixels;
  // sharp drops all metadata unless asked to keep it, so GPS goes with it
  const buf = await sharp(f).rotate().jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  await writeFile(f, buf);

  const after = await sharp(f).metadata();
  out.push({ id, w: after.width, h: after.height, notes });
  console.error(`${id}: ${after.width}x${after.height}${notes.length ? '  (' + notes.join(', ') + ')' : ''}`);
}

execFileSync(process.execPath, ['tools/build-images.mjs'], { stdio: 'inherit' });

const q = (s) => JSON.stringify(s);
const one = out.length === 1;
console.error('\n--- paste this into the projects array in data/site.js -------------------');
if (one) {
  const p = out[0];
  console.log(`    { id: "p-${p.id}", style: "Traditional", artistId: null, title: "DESCRIBE THE PIECE", photos: [{ f: ${q(p.id + '.jpg')}, w: ${p.w}, h: ${p.h}, cap: "DESCRIBE THIS PHOTO" }] },`);
} else {
  console.log(`    { id: "set-NAME-THIS", style: "Traditional", artistId: null, title: "DESCRIBE THE PIECE",`);
  console.log(`      photos: [`);
  for (const p of out) console.log(`        { f: ${q(p.id + '.jpg')}, w: ${p.w}, h: ${p.h}, cap: "DESCRIBE THIS PHOTO" },`);
  console.log(`      ] },`);
}
console.error('-------------------------------------------------------------------------');
console.error('Then: set style to one of SITE.styles, set artistId (or leave null),');
console.error('write real titles/captions, and run "npm run lint && npm test".');
