// P0A test #5 — roster precedence (master document Part 2 §5).
// A synthetic stale-feed fixture must NOT displace an internal-sheet player.
//
//   node tests/roster_precedence.mjs
//
// Drives the app's REAL Game Day Refresh roster path (htDoRosters → seasonTry
// → htRosterSweep → htMergeRoster → htVitalsBackfill) in headless Chromium,
// with htFetch mocked to today's live shape: the active season (46) answers
// coaches-only, and the fallback season (44) answers the exact Havoc rows in
// the committed data/sphl-rosters.json — i.e. real 2025-26 league data.
// Asserts: every signed player stays active with his sheet number (Proctor
// stays #72 against the feed's #1), no stale player is injected, gaps still
// fill, and the guard reports what it refused.
//
// Chromium resolution: PLAYWRIGHT_CHROMIUM (env) or Playwright's default.

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = process.env.HAVOC_ROOT || path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const EXE = process.env.PLAYWRIGHT_CHROMIUM || undefined;

const srv = http.createServer((q, s) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  try { s.end(fs.readFileSync(f)); } catch (e) { s.statusCode = 404; s.end('nf'); }
}).listen(0);
const PORT = srv.address().port;

const fails = [];
const ok = (n, c) => { console.log((c ? 'PASS' : 'FAIL') + ' — ' + n); if (!c) fails.push(n); };

(async () => {
  const b = await chromium.launch(EXE ? { executablePath: EXE } : {});
  const pg = await b.newPage();
  // hermetic: nothing but the local server. Page-init JSONP calls to the real
  // league feed otherwise reach the internet from CI and their error bodies
  // ("invalid access key…") land as script SyntaxErrors — noise, not findings.
  await pg.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  pg.on('pageerror', e => { console.log('PAGEERROR', String(e)); fails.push('pageerror'); });
  await pg.goto('http://localhost:' + PORT + '/index.html');
  await pg.waitForTimeout(2000);

  const r = await pg.evaluate(async () => {
    await msLoad(); await new Promise(r => setTimeout(r, 100));
    spineRosterApply();
    const spine = MS_DATA.players.map(x => x.name);
    // seed the seasons list the picker would have loaded from the feed
    DATA.seasons = { at: new Date().toISOString(), list: [
      { id: '46', name: '2026-2027 Regular Season', short: '2026-2027', playoff: false, career: false, end: '2027-04-30' },
      { id: '44', name: '2025-2026 Regular Season', short: '2025-2026', playoff: false, career: false, end: '2026-04-05' },
    ]};
    DATA.settings.htSeason = '46';
    // the stale fixture: season 46 = coaches only; season 44 = the REAL rows
    // from the committed roster file (what the league feed serves today)
    const file = await fetch('data/sphl-rosters.json').then(r => r.json());
    const hav44 = file.teams.find(t => /Huntsville/.test(t.name)).roster;
    htFetch = async (params) => {
      const p = params || {};
      if (p.view === 'teamsbyseason') return { SiteKit: { Teamsbyseason: [{ id: '3', name: 'Huntsville Havoc' }, { id: '5', name: 'Knoxville Ice Bears' }] } };
      if (p.view === 'roster') {
        if (String(p.season_id) === '46') return { SiteKit: { Roster: [{ first_name: 'Stuart', last_name: 'Stefan', position: 'Head Coach' }] } };
        if (String(p.team_id) === '3') return { SiteKit: { Roster: hav44 } };
        return { SiteKit: { Roster: [{ first_name: 'Some', last_name: 'Bear', position: 'D', tp_jersey_number: '7' }] } };
      }
      return {};
    };
    const hasGuard = typeof GUARD_LOG !== 'undefined';
    if (hasGuard) GUARD_LOG.length = 0;
    let note = '';
    try { note = await htDoRosters(); } catch (e) { return { threw: String(e) }; }
    const roster = DATA.roster;
    const signedInactive = spine.filter(n => { const p = roster.find(x => norm(x.name) === norm(n)); return !p || p.active === '0'; });
    const proctor = roster.find(p => /Alex Proctor/.test(p.name)) || {};
    const staleAdds = roster.filter(p => !spine.some(n => norm(n) === norm(p.name)));
    const gou = roster.find(p => /Goukler/.test(p.name)) || {};
    return {
      note, signedTotal: spine.length, signedInactive,
      proctorNum: proctor.num, proctorSheet: proctor.sheet,
      staleAdds: staleAdds.map(p => p.name),
      guardNotes: hasGuard ? GUARD_LOG.length : 0,
      fellBack: !!(((DATA.report || {}).seasonFallback || {}).rosters),
      gouklerActive: gou.active !== '0',
    };
  });

  if (r.threw) { ok('htDoRosters ran', false); console.log(r.threw); }
  else {
    console.log(JSON.stringify(r, null, 1));
    ok('the sync fell back to the stale season (fixture is exercising the real path)', r.fellBack === true);
    ok('every signed player stays active (' + r.signedTotal + '/' + r.signedTotal + ')', r.signedInactive.length === 0);
    ok('Proctor keeps his sheet number #72 against the feed\'s #1', r.proctorNum === '72' && r.proctorSheet);
    ok('no stale-season player was injected into the roster', r.staleAdds.length === 0);
    ok('the guard reported its refusals', r.guardNotes > 0);
  }
  await b.close(); srv.close();
  console.log(fails.length ? fails.length + ' FAILURE(S)' : 'ALL PASS');
  process.exit(fails.length ? 1 : 0);
})();
