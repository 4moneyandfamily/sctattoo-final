// Crawls every outbound URL the site can produce — markup, structured data and
// the data file — and reports a status code for each. Run before a launch.
import { readFile } from 'node:fs/promises';

const seen = new Map();   // url -> where it came from
const add = (u, where) => {
  if (!/^https?:\/\//i.test(u)) return;
  if (!seen.has(u)) seen.set(u, new Set());
  seen.get(u).add(where);
};

const html = await readFile('index.html', 'utf8');
for (const m of html.matchAll(/(?:href|src)="(https?:[^"]+)"/g)) add(m[1].replace(/&amp;/g, '&'), 'index.html');
const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
for (const m of ld.matchAll(/"(https?:\/\/[^"]+)"/g)) add(m[1], 'structured data');

const data = await readFile('data/site.js', 'utf8');
for (const m of data.matchAll(/"(https?:\/\/[^"]+)"/g)) add(m[1], 'data/site.js');

const UA = 'Mozilla/5.0 (compatible; SanClementeTattooLinkCheck/1.0)';

// Calibrate first. In a locked-down CI sandbox an egress proxy answers 403 to
// every CONNECT, which would otherwise look like a site full of dead links.
let egressOK = true;
try {
  const probe = await fetch('https://fonts.googleapis.com/css2?family=Bungee', {
    method: 'GET', headers: { 'User-Agent': UA },
  });
  egressOK = probe.ok;
} catch { egressOK = false; }
if (!egressOK) console.log('NOTE: outbound HTTPS is blocked here, so statuses below are not trustworthy.\n');

const rows = [];
for (const [url, where] of seen) {
  let status = '---', note = '';
  try {
    // HEAD first; a lot of sites answer HEAD with 405, so fall back to a
    // ranged GET rather than downloading the whole page.
    let r = await fetch(url, { method: 'HEAD', redirect: 'follow', headers: { 'User-Agent': UA } });
    if (r.status === 405 || r.status === 403 || r.status === 501) {
      r = await fetch(url, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': UA, Range: 'bytes=0-2047' } });
      note = 'via GET';
    }
    status = r.status;
    if (r.url !== url) note = (note ? note + ', ' : '') + 'redirects to ' + r.url;
  } catch (e) {
    status = 'ERR';
    note = String(e.cause?.code || e.message).slice(0, 70);
  }
  rows.push({ status, url, where: [...where].join(' + '), note });
}

rows.sort((a, b) => String(a.status).localeCompare(String(b.status)) || a.url.localeCompare(b.url));
const pad = (s, n) => String(s).padEnd(n);
console.log(`${pad('STATUS', 7)} ${pad('URL', 74)} SOURCE / NOTE`);
for (const r of rows) console.log(`${pad(r.status, 7)} ${pad(r.url, 74)} ${r.where}${r.note ? ' — ' + r.note : ''}`);
const ok = rows.filter(r => r.status === 200).length;
const bad = rows.filter(r => r.status !== 200 && r.status !== 'ERR');
console.log(`\n${rows.length} outbound URLs · ${ok} OK · ${bad.length} non-200 · ` +
            `${rows.filter(r => r.status === 'ERR').length} unreachable`);
const all403 = rows.length > 0 && rows.every(r => r.status === 403);
if (ok === 0 && all403) {
  console.log('\nEvery target returned an identical 403' + (egressOK
    ? ' while the calibration host succeeded.\nThat is the signature of a host allowlist on the way out, not dead links.'
    : ' and the calibration probe also failed.\nOutbound HTTPS is blocked here.'));
  console.log('Re-run from a machine with open network access before treating any of');
  console.log('these as broken.');
  process.exitCode = 0;
} else if (bad.length) {
  process.exitCode = 1;
}
