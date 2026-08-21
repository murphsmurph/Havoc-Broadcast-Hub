/* TEST 7 — the service worker must actually install.
   Regression guard for the defect found in P3 planning: sw.js precached
   ./data/bios.json, which is gitignored (embargoed club material) and therefore
   never deployed. cache.addAll is atomic, so the install promise rejected and the
   service worker NEVER activated on the hosted site — offline booth use was dead
   in production while working locally, where the file happens to exist.

   1. every precached path is actually served (i.e. exists in a deployed build)
   2. the worker reaches "activated" against a production-shaped build
   3. the shell is really in the cache afterwards
   The server below deliberately 404s gitignored paths so the test sees what
   GitHub Pages sees, not what the dev box has lying around. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = process.env.HAVOC_ROOT || path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png' };

// what git actually ships — anything untracked is invisible to GitHub Pages
const tracked = new Set(execSync('git ls-files', { cwd: ROOT }).toString().split('\n').filter(Boolean));

let pass = 0, fail = 0;
const T = (n, ok, d) => { console.log((ok ? 'PASS' : 'FAIL') + '  ' + n + (ok ? '' : '  — ' + d)); ok ? pass++ : fail++; };

const srv = http.createServer((q, s) => {
  const rel = decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const file = path.join(ROOT, rel);
  if (!tracked.has(rel) && rel !== '') { s.statusCode = 404; s.end('not deployed'); return; }
  try {
    s.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    s.setHeader('Service-Worker-Allowed', '/');
    s.end(fs.readFileSync(file));
  } catch (e) { s.statusCode = 404; s.end('nf'); }
});
await new Promise(r => srv.listen(0, r));
const PORT = srv.address().port;

// 1 — every precached path is served by a real deployment
const swText = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const listed = (swText.match(/const PRECACHE=\[([^\]]*)\]/) || [, ''])[1]
  .split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
T('sw.js exposes a PRECACHE list', listed.length > 0, 'could not parse PRECACHE from sw.js');
const missing = [];
for (const entry of listed) {
  const url = 'http://localhost:' + PORT + '/' + entry.replace(/^\.\//, '');
  const res = await fetch(url);
  if (!res.ok) missing.push(entry + ' (' + res.status + ')');
}
T('every precached path exists in a deployed build', listed.length > 0 && missing.length === 0, listed.length ? 'not deployed: ' + missing.join(', ') : 'no PRECACHE list to check');

// 2 + 3 — the worker installs and activates against that build
const br = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined });
const ctx = await br.newContext();               // NOT serviceWorkers:'block' — the worker is the subject
await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
const pg = await ctx.newPage();
await pg.goto('http://localhost:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });

const state = await pg.evaluate(async () => {
  try {
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise(r => setTimeout(() => r(null), 15000))
    ]);
    if (!reg) return { ok: false, why: 'navigator.serviceWorker.ready never resolved (install rejected?)' };
    return { ok: !!reg.active, why: reg.active ? reg.active.state : 'no active worker' };
  } catch (e) { return { ok: false, why: e.message }; }
});
T('service worker reaches "activated"', state.ok, state.why);

const cached = await pg.evaluate(async () => {
  const keys = await caches.keys();
  for (const k of keys) {
    const c = await caches.open(k);
    if (await c.match('./index.html') || await c.match(location.origin + '/index.html')) return k;
  }
  return null;
});
T('the app shell is in the cache after install', !!cached, 'no cache holds index.html; caches=' + cached);

console.log(`\n${pass} passed, ${fail} failed`);
await br.close(); srv.close();
process.exit(fail ? 1 : 0);
