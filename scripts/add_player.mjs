// Scaffold the committed data for a mid-season Havoc addition.
//
// The hub roster / packet pick a new signing up automatically from the live
// SPHL feed — this script covers everything that renders from the committed
// files: the milestone boards, career pages, record watch and bio pages
// (data/havoc_players.json) and the bio-page prose slots (data/bios.json).
//
//   node scripts/add_player.mjs "First Last"            # scaffold both entries
//   node scripts/add_player.mjs "First Last" --dry-run  # print, write nothing
//   node scripts/add_player.mjs "First Last" --num 21 --pos C   # feed not published yet
//
// What it does, and refuses to do:
//  - Vitals (number, position, height, weight, hometown, birthdate) come from
//    data/sphl-rosters.json when the league has published him; otherwise from
//    the flags; otherwise they stay blank. Nothing is ever invented.
//  - Career history comes from EliteProspects when EP_API_KEY is available
//    (.env or the environment) and the name search is unambiguous — exactly
//    update_stats.mjs's rule. Ambiguous or keyless runs scaffold an empty
//    seasons[] and say so; --backfill later, or fill it by hand.
//  - Additive only. If the name already exists in either file it aborts.
//    franchise_records, league_reference and meta are never touched.
//  - Baselines = sums of the scaffolded seasons (pro leagues for _pro,
//    Huntsville rows for _havoc); current_season starts at zero.
//
// Flags: --num --pos --ht --wt --sh --born --dob(YYYY-MM-DD) --from --ep-id

import fs from 'node:fs';
import path from 'node:path';
import { ep, findKey, mapSeason } from './update_stats.mjs';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const FILE = process.env.HAVOC_FILE || path.join(ROOT, 'data', 'havoc_players.json');
const BIOS_FILE = process.env.HAVOC_BIOS_FILE || path.join(ROOT, 'data', 'bios.json');
const ROSTERS = process.env.HAVOC_ROSTERS_FILE || path.join(ROOT, 'data', 'sphl-rosters.json');

// ---- args ----
const argv = process.argv.slice(2);
const NAME = argv.find(a => !a.startsWith('--'));
const DRY = argv.includes('--dry-run');
const flag = k => { const i = argv.indexOf('--' + k); return i >= 0 ? (argv[i + 1] || '') : ''; };
if (!NAME) { console.error('Usage: node scripts/add_player.mjs "First Last" [--dry-run] [--num N --pos C ...]'); process.exit(1); }

const slug = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const dobFmt = iso => {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(iso || '');
  const MO = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return MO[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1];
};

// ---- the roster-feed file: vitals, if the league has published him ----
function rosterRow() {
  let file;
  try { file = JSON.parse(fs.readFileSync(ROSTERS, 'utf8')); } catch (e) { return { row: null, note: 'no ' + path.basename(ROSTERS) + ' on disk' }; }
  const hav = (file.teams || []).find(t => /Huntsville/i.test(t.name || ''));
  const rows = ((hav || {}).roster || []).filter(r => r.first_name || r.name);
  const want = slug(NAME);
  let row = rows.find(r => slug(r.name || (r.first_name + ' ' + r.last_name)) === want);
  if (!row) { // formal-name tolerance: "Gio" vs "Giovanni" — match a unique surname
    const last = slug(NAME.split(/\s+/).pop());
    const cand = rows.filter(r => slug(r.last_name || String(r.name || '').split(/\s+/).pop()) === last);
    if (cand.length === 1) row = cand[0];
    else if (cand.length > 1) return { row: null, note: cand.length + ' Havoc rows share that surname — pass vitals as flags' };
  }
  return { row: row || null, note: row ? null : 'not in the roster file yet (fine before the league publishes him)' };
}

async function main() {
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const bios = JSON.parse(fs.readFileSync(BIOS_FILE, 'utf8'));
  const out = [];
  const say = m => { out.push(m); console.log(m); };

  // additive only — never touch an existing entry
  const clash = data.players.find(p => slug(p.name) === slug(NAME));
  if (clash) { console.error('ABORT: "' + clash.name + '" is already in ' + path.relative(ROOT, FILE) + ' — this script only adds.'); process.exit(1); }
  if (bios.players && bios.players[NAME]) { console.error('ABORT: "' + NAME + '" is already in ' + path.relative(ROOT, BIOS_FILE) + '.'); process.exit(1); }

  // ---- vitals ----
  const { row, note } = rosterRow();
  if (note) say('roster file: ' + note);
  const feedName = row ? (row.name || (row.first_name + ' ' + row.last_name)) : '';
  if (row) say('roster file: matched ' + feedName + ' (#' + (row.tp_jersey_number || '?') + ', id ' + (row.player_id || row.id || '?') + ')');
  const num = flag('num') || (row && (row.tp_jersey_number || row.jersey_number)) || '';
  const posRaw = flag('pos') || (row && (row.position || row.pos)) || '';
  const pos = String(posRaw).toUpperCase() === 'F' ? 'F' : String(posRaw).toUpperCase();
  const isG = pos === 'G';
  const ht = flag('ht') || (row && (row.height_hyphenated || row.height)) || '';
  const wt = flag('wt') || (row && String(row.weight || '')) || '';
  const sh = flag('sh') || (row && (row.shoots || row.catches)) || '';
  const born = flag('born') || (row && (row.homeplace || row.hometown)) || '';
  const dobIso = flag('dob') || (row && (row.birthdate || row.date_of_birth)) || '';

  // ---- EliteProspects career history (optional) ----
  let epId = flag('ep-id') ? +flag('ep-id') : null;
  let seasons = [];
  if (!findKey() && !epId) {
    say('EP: no EP_API_KEY found — scaffolding an empty seasons[]; run update_stats.mjs --backfill later or fill it by hand');
  } else {
    try {
      if (!epId) {
        const res = await ep('/players', { q: NAME, limit: 5 });
        const hits = (res && (res.data || res.players)) || [];
        const hit = hits.find(h => (h.name || (h.firstName + ' ' + h.lastName)) === NAME) || (hits.length === 1 ? hits[0] : null);
        if (hit) { epId = hit.id; say('EP: matched player id ' + epId); }
        else say('EP: no unambiguous match (' + hits.length + ' candidates) — seasons left empty, resolve with --ep-id');
      }
      if (epId) {
        const res = await ep('/players/' + epId + '/stats', { limit: 100 });
        seasons = ((res && (res.data || res.stats)) || [])
          .filter(r => (r.gameType || r.type || 'REGULAR_SEASON').toUpperCase().indexOf('REGULAR') >= 0 || r.postseasonStats)
          .map(r => mapSeason(r, data.meta.pro_leagues, w => say('EP: ! ' + w)))
          .filter(r => r.season !== (data.meta.current_season || '2026-27')); // the live season is counters, not history
        say('EP: ' + seasons.length + ' season rows scaffolded (frozen history — eyeball them before committing)');
      }
    } catch (e) { say('EP: fetch failed (' + e.message + ') — seasons left empty'); }
  }

  // ---- baselines: sums of what we actually scaffolded — zeros for a rookie ----
  const proRows = seasons.filter(r => data.meta.pro_leagues.includes(r.league) || r.level === 'Pro');
  const havRows = proRows.filter(r => /Huntsville/i.test(r.team));
  const sum = (rows, keys) => keys.reduce((t, k) => (t[k] = rows.reduce((s, r) => s + (r[k] || 0), 0), t), {});
  const KEYS = isG ? ['gp', 'w', 'l', 'otl', 'so', 'svs'] : ['gp', 'g', 'a', 'pts', 'pim'];
  const basePro = sum(proRows, KEYS), baseHav = sum(havRows, KEYS);

  const current = isG
    ? { gp: 0, w: 0, l: 0, otl: 0, so: 0, svs: 0, gaa: null, svpct: null, po: { gp: 0, w: 0, l: 0, so: 0, svs: 0 },
        season: data.meta.current_season || '2026-27', team: 'Huntsville Havoc', league: 'SPHL' }
    : { gp: 0, g: 0, a: 0, pts: 0, pim: 0, pm: 0, po: { gp: 0, g: 0, a: 0, pts: 0, pim: 0 },
        season: data.meta.current_season || '2026-27', team: 'Huntsville Havoc', league: 'SPHL' };

  const lastTeam = seasons.length ? seasons[seasons.length - 1] : null;
  const entry = {
    name: NAME, num: String(num), pos, type: isG ? 'goalie' : 'skater',
    from: flag('from') || (lastTeam ? lastTeam.team + (lastTeam.league ? ' (' + lastTeam.league + ')' : '') : ''),
    seasons,
    notes: 'Scaffolded ' + new Date().toISOString().slice(0, 10) + ' by scripts/add_player.mjs from ' +
      [row ? 'sphl-rosters.json' : null, epId ? 'EP #' + epId : null].filter(Boolean).join(' + ') +
      (seasons.length ? ' — verify the season rows before air.' : ' — career history still to research.'),
    baseline_pro: basePro, baseline_havoc: baseHav,
    current_season: current,
    bio: { height: ht, weight: wt, shoots: sh, born, birthdate: dobIso ? dobFmt(dobIso) : '' },
  };
  if (epId) entry.ep_id = epId;
  data.players.push(entry);

  const stub = {
    joined_blurb: '', season_recap: '', career_highlights: '',
    pronunciation: '', broadcast_bio: '', embargoed: false, notes: '', footnotes: [],
  };
  // the spine name is the join key everywhere; a differing feed spelling rides along
  if (feedName && slug(feedName) !== slug(NAME)) { stub.formal_name = feedName; say('names: spine "' + NAME + '", feed prints "' + feedName + '" — formal_name set so the vitals/headshot join holds'); }
  bios.players = bios.players || {};
  bios.players[NAME] = stub;

  say('');
  say('entry: #' + (entry.num || '?') + ' ' + NAME + ' · ' + (pos || '?') + ' · ' + (ht || '?') + ' ' + (wt || '?') +
    ' · ' + (born || 'hometown ?') + ' · baselines pro ' + JSON.stringify(basePro) + ' havoc ' + JSON.stringify(baseHav));
  if (DRY) { say('(dry run — nothing written)'); return; }
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
  fs.writeFileSync(BIOS_FILE, JSON.stringify(bios, null, 2) + '\n');
  say('Wrote ' + path.relative(ROOT, FILE) + ' and ' + path.relative(ROOT, BIOS_FILE) + ' — review the git diff, then commit/PR.');
  say('His bio page renders now with "— bio to come —" slots; write the prose into data/bios.json when ready.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
