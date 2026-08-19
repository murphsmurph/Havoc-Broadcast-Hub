// Hand-reconstruction of career totals against known-good anchors.
// Part 3 audit evidence; becomes P0A tests #2 and #4 (see the master document).
//
//   node tests/anchor_reconstruction.mjs
//
// For each anchor player it recomputes, from data/havoc_players.json alone:
//   - fresh sums over seasons[] + current_season under BOTH pro filters the
//     code uses (index.html msIsPro: league in meta.pro_leagues OR level==='Pro';
//     player.html: level==='Pro' only) — a divergence is itself a finding
//   - the DISPLAYED career (index.html msTotals v2 path: baseline + current)
//   - the file's stored computed_*_totals and any override_* (tracker) values
// and compares every one to the anchor. Also file-wide integrity sweeps:
// PTS = G+A on every row where all three exist; no junior/college row inside
// any pro sum; baseline consistency (baseline == sum of pro/Havoc season rows
// wherever the rows are complete). Exits 1 on any anchor mismatch or sweep hit.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const FILE = process.env.HAVOC_FILE || path.join(ROOT, 'data', 'havoc_players.json');
const D = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const PRO = D.meta.pro_leagues || [];

// entering-2026-27 anchors (update at season rollover, per the master document)
const ANCHORS = [
  { name: 'Austin Alger',  scope: 'pro',   want: { gp: 200, g: 97,  a: 105, pts: 202 } },
  { name: 'Connor Fries',  scope: 'pro',   want: { gp: 329, g: 86,  a: 107, pts: 193 } },
  { name: 'Connor Fries',  scope: 'sphl',  want: { gp: 306, g: 74,  a: 93,  pts: 167 } },
  { name: 'Brian Wilson',  scope: 'pro',   want: { gp: 164, w: 95,  so: 10 } },
  { name: 'Brian Wilson',  scope: 'havoc', want: { gp: 92,  w: 49,  so: 8 } },
  { name: 'Gio Procopio',  scope: 'havoc', want: { gp: 110, pts: 65 } },
];

const isProHub    = r => PRO.includes(r.league) || r.level === 'Pro';   // index.html msIsPro
const isProBioPg  = r => r.level === 'Pro';                             // player.html filter
const isHavoc     = r => r.team === 'Huntsville Havoc';
const keysFor = p => p.type === 'goalie' ? ['gp', 'w', 'l', 'otl', 'so', 'svs'] : ['gp', 'g', 'a', 'pts', 'pim'];

// index.html msSum: null-respecting — a null never becomes a 0 in the total
function sum(rows, keys) {
  const out = {};
  keys.forEach(k => { let any = false, t = 0; rows.forEach(r => { if (r[k] != null) { any = true; t += r[k]; } }); out[k] = any ? t : 0; });
  return out;
}
function addCur(t, p, keys) {
  const c = p.current_season || {};
  const out = {};
  keys.forEach(k => { out[k] = (t[k] || 0) + (c[k] == null ? 0 : c[k]); });
  return out;
}
function rowsFor(p, scope, proFilter) {
  const s = p.seasons || [];
  if (scope === 'pro')  return s.filter(proFilter);
  if (scope === 'havoc') return s.filter(r => proFilter(r) && isHavoc(r));
  if (scope === 'sphl') return s.filter(r => r.league === 'SPHL');
  return [];
}
// index.html msTotals v2 display path: baseline + current (override NOT applied)
function displayed(p, scope, keys) {
  const base = scope === 'pro' ? p.baseline_pro : scope === 'havoc' ? p.baseline_havoc : null;
  if (!base || !p.current_season) return null;
  return addCur(base, p, keys);
}
const fmt = (o, keys) => keys.map(k => k.toUpperCase() + ' ' + (o && o[k] != null ? o[k] : '—')).join(' · ');
const failures = [];
const note = m => console.log(m);
const fail = m => { failures.push(m); console.log('MISMATCH  ' + m); };

console.log('anchor reconstruction — ' + path.relative(ROOT, FILE) + ' · pro_leagues: ' + PRO.length + ' leagues\n');

for (const a of ANCHORS) {
  const p = D.players.find(x => x.name === a.name);
  if (!p) { fail(a.name + ': not in the data file'); continue; }
  const keys = keysFor(p);
  const wantKeys = Object.keys(a.want);
  const freshHub = addCur(sum(rowsFor(p, a.scope, isProHub), keys), p, keys);
  const freshBio = addCur(sum(rowsFor(p, a.scope, isProBioPg), keys), p, keys);
  const disp = a.scope === 'sphl' ? null : displayed(p, a.scope, keys);
  const stored = a.scope === 'pro' ? p.computed_pro_totals : a.scope === 'havoc' ? p.computed_havoc_totals : null;
  const ov = a.scope === 'pro' ? (p.override_pro || p.override_pro_goalie) : a.scope === 'havoc' ? (p.override_havoc || p.override_havoc_goalie) : null;
  const incomplete = rowsFor(p, a.scope, isProHub).filter(r => r.gp == null).length;

  console.log('— ' + a.name + ' · ' + a.scope.toUpperCase());
  console.log('  anchor            ' + fmt(a.want, wantKeys));
  console.log('  fresh sum (hub)   ' + fmt(freshHub, wantKeys) + (incomplete ? '   [' + incomplete + ' season row(s) missing GP — nulls sink, not zero]' : ''));
  if (JSON.stringify(wantKeys.map(k => freshHub[k])) !== JSON.stringify(wantKeys.map(k => freshBio[k])))
    console.log('  fresh sum (bio)   ' + fmt(freshBio, wantKeys) + '   [player.html level-only filter DIVERGES from the hub filter]');
  if (disp)   console.log('  displayed (v2)    ' + fmt(disp, wantKeys) + '   [baseline_' + a.scope + ' + current_season]');
  if (stored) console.log('  computed_* file   ' + fmt(stored, wantKeys));
  if (ov)     console.log('  tracker override  ' + fmt(ov, wantKeys));

  const judge = disp || freshHub;               // what the site actually shows
  for (const k of wantKeys) {
    if (judge[k] !== a.want[k]) fail(a.name + ' ' + a.scope + ' ' + k.toUpperCase() + ': shown ' + judge[k] + ' vs anchor ' + a.want[k]);
  }
  console.log('');
}

// ---- file-wide sweeps ----
let ptsBad = 0, leak = 0, baseDrift = 0;
for (const p of D.players) {
  const keys = keysFor(p);
  for (const r of (p.seasons || [])) {
    if (r.g != null && r.a != null && r.pts != null && r.g + r.a !== r.pts) { ptsBad++; fail(p.name + ' ' + r.season + ' ' + r.team + ': PTS ' + r.pts + ' ≠ G+A ' + (r.g + r.a)); }
    if (isProHub(r) && /(NCAA|ACHA|OUA|U ?Sports|ACAC|NAHL|USHL|BCHL|AJHL|SJHL|MJHL|SIJHL|OJHL|GOJHL|NCDC|USPHL|WSHL|CCHL)/i.test(r.league || '')) { leak++; fail(p.name + ' ' + r.season + ': non-pro league "' + r.league + '" passes the pro filter (level=' + r.level + ')'); }
  }
  // baseline vs frozen-history sums, only where every counted row is complete
  for (const scope of ['pro', 'havoc']) {
    const base = scope === 'pro' ? p.baseline_pro : p.baseline_havoc;
    if (!base) continue;
    const rows = rowsFor(p, scope, isProHub);
    if (rows.some(r => r.gp == null)) continue;                       // tracker territory — flagged, not judged
    const s = sum(rows, keys);
    const diff = keys.filter(k => base[k] != null && s[k] !== base[k]);
    if (diff.length) { baseDrift++; note('  note: ' + p.name + ' baseline_' + scope + ' differs from the seasons[] sum on ' + diff.map(k => k.toUpperCase() + ' ' + s[k] + '→' + base[k]).join(', ') + ' (documented tracker source?)'); }
  }
}
console.log('\nsweeps: PTS≠G+A rows: ' + ptsBad + ' · junior/college leaks into pro: ' + leak + ' · baseline≠seasons-sum (complete rows only): ' + baseDrift + ' noted');
console.log(failures.length ? '\n' + failures.length + ' FAILURE(S)' : '\nALL ANCHORS MATCH');
process.exit(failures.length ? 1 : 0);
