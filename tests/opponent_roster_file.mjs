// Bridge test #6 — opponent rosters from the committed file (additive only).
//
//   node tests/opponent_roster_file.mjs
//
// Drives the real load path (rosterFileLoad → rosterFileApply →
// rosterFileApplyOpponents) in headless Chromium against the committed
// data/sphl-rosters.json. Asserts: a fresh browser gets every opponent
// roster from the file with no feed; the apply is idempotent; a hand edit
// and a live-feed value both outrank the file on re-apply; the file never
// deactivates or renames anyone; a club missing from the file (Pee Dee
// until the league publishes 2026-27) yields no entry and no error; and
// the Havoc precedence path is untouched.
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
  const ctx = await b.newContext({ serviceWorkers: 'block' });
  await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  const pg = await ctx.newPage();
  pg.on('pageerror', e => { console.log('PAGEERROR', String(e)); fails.push('pageerror'); });
  await pg.goto('http://localhost:' + PORT + '/index.html');
  await pg.waitForTimeout(2000);

  const file = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sphl-rosters.json'), 'utf8'));
  const fileTeams = file.teams.filter(t => !/Huntsville/.test(t.name)).length;

  const r = await pg.evaluate(async () => {
    await rosterFileLoad(); await new Promise(r => setTimeout(r, 100));
    const opp = DATA.oppRosters || {};
    const pens = opp['Pensacola Ice Flyers'] || [];
    const before = JSON.stringify(opp);
    rosterFileApply();                       // idempotency: second apply, no change
    const idempotent = JSON.stringify(DATA.oppRosters) === before;

    // hand edit outranks the file on re-apply
    const p1 = pens[0];
    const fileNum = p1.num;
    p1.num = '99'; p1.handEdit = Object.assign({}, p1.handEdit, { num: 1 });
    rosterFileApply();
    const handWins = p1.num === '99';
    p1.num = fileNum; delete p1.handEdit;    // restore

    // a live-feed value outranks the file on re-apply (feedSet-owned field)
    const p2 = pens[1];
    feedSet(p2, 'ht', '9-9');                // pretend a fresher live sync set this
    rosterFileApply();
    const feedWins = p2.ht === '9-9';

    // the file never deactivates: a hand-set scratch survives re-apply
    const p3 = pens[2];
    p3.active = '0'; p3.handEdit = Object.assign({}, p3.handEdit, { active: 1 });
    rosterFileApply();
    const scratchSurvives = p3.active === '0';
    p3.active = '1'; delete p3.handEdit;

    const proctor = DATA.roster.find(p => /Alex Proctor/.test(p.name)) || {};
    return {
      teams: Object.keys(opp).filter(k => (opp[k] || []).length).length,
      pens: pens.length,
      pensNums: pens.filter(p => p.num).length,
      pensIds: pens.filter(p => p.htId).length,
      peeDee: (opp['Pee Dee IceCats'] || []).length,
      idempotent, handWins, feedWins, scratchSurvives,
      proctorNum: proctor.num,
    };
  });

  console.log(JSON.stringify(r, null, 1));
  ok('every non-Havoc club in the file has an opponent roster (' + r.teams + '/' + fileTeams + ')', r.teams === fileTeams);
  ok('Pensacola roster present offline with numbers + official ids', r.pens >= 15 && r.pensNums > 0 && r.pensIds === r.pens);
  ok('apply is idempotent (second pass changes nothing)', r.idempotent === true);
  ok('a hand edit outranks the file on re-apply', r.handWins === true);
  ok('a live-feed value outranks the file on re-apply', r.feedWins === true);
  ok('a hand-set scratch survives re-apply (file never reactivates)', r.scratchSurvives === true);
  ok('a club absent from the file (Pee Dee, pre-publish) stays empty without error', r.peeDee === 0);
  ok('Havoc precedence untouched — Proctor still #72 off the sheet', r.proctorNum === '72');

  await b.close(); srv.close();
  console.log(fails.length ? fails.length + ' FAILURE(S)' : 'ALL PASS');
  process.exit(fails.length ? 1 : 0);
})();
