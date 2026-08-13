// Refresh data/havoc_players.json from the EliteProspects API.
//
// Runs on a machine (or a GitHub Action) — NEVER in the browser. The key is
// read from the environment (EP_API_KEY, or .env in the repo root, which is
// git-ignored) and never written anywhere.
//
//   node scripts/update_stats.mjs            # refresh + diff summary
//   node scripts/update_stats.mjs --dry-run  # show what would change, write nothing
//
// Call budget (Explorer plan, 1,000/month): one refresh is ~17 stats calls.
// Search calls only happen for players with no cached ep_id — the id is
// written back into the JSON after the first lookup, so a weekly in-season
// refresh stays around 80 calls/month. Never poll from the site.
//
// v2 structure note: seasons[] is FROZEN career history through 2025-26 —
// this script may complete its gaps but the in-season workflow never edits it.
// baseline_pro/baseline_havoc and current_season belong to Jacob's game-night
// flow and are NEVER touched here. After a season, he folds current_season
// into seasons[] as a new row, recomputes baselines and zeroes the counters.
//
// Merge rules, mirroring the site's:
//  - The site computes everything; this script only maintains the season rows.
//  - EP fills gaps: it may fill a null and append a season the file lacks.
//    It NEVER overwrites a hand-curated non-null value — the curated data
//    carries caveats the API doesn't know about.
//  - League names map into meta.pro_leagues explicitly; anything unknown
//    defaults to non-pro and logs a warning for review.
//  - Overrides are left alone. When a refresh completes every GP in a scope,
//    the diff summary says the override is now removable — removing it is
//    Jacob's call, not the script's.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const FILE = path.join(ROOT, 'data', 'havoc_players.json');
const DRY = process.argv.includes('--dry-run');

// ---- key: env first, then .env (never committed — .gitignore has it) ----
function apiKey() {
  if (process.env.EP_API_KEY) return process.env.EP_API_KEY.trim();
  try {
    const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
    const m = env.match(/^EP_API_KEY=(.+)$/m);
    if (m) return m[1].trim();
  } catch (e) {}
  console.error('No EP_API_KEY in the environment or .env — nothing fetched.');
  process.exit(1);
}

const BASE = 'https://api.eliteprospects.com/v1';
let CALLS = 0;
async function ep(pathname, params = {}) {
  CALLS++;
  const u = new URL(BASE + pathname);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  u.searchParams.set('apiKey', apiKey());
  const r = await fetch(u, { headers: { 'User-Agent': 'HavocBroadcastHub/1.0' } });
  if (!r.ok) throw new Error('EP ' + pathname + ' HTTP ' + r.status);
  return r.json();
}

// ep_ids already resolved once — seeded so the first run doesn't spend
// search calls on players we already know
const KNOWN_IDS = {
  'Davis Goukler': 370024,
  'Kevin Weaver-Vitale': 519479,
  'Gio Procopio': 285339,
  'Troy Williams': 271639,
};

// ---- league mapping: EP's names onto the file's, and pro/not-pro ----
// EP prints league names its own way ("NCAA III" vs "ACHA", France's
// "Division 1"). Everything must resolve explicitly; unknown = non-pro + warn.
export const LEAGUE_MAP = {
  'SPHL': 'SPHL', 'ECHL': 'ECHL', 'FPHL': 'FPHL', 'AHL': 'AHL', 'NHL': 'NHL',
  'Mestis': 'Mestis',
  'Division 1': 'France Division 1', 'France Division 1': 'France Division 1',
  'Ligue Magnus D1': 'France Division 1',
  'Coupe de France': 'Coupe de France',
  'BeNe League': 'BeNe League', 'BeNe-League': 'BeNe League',
  'NIHL National': 'NIHL National', 'NIHL': 'NIHL National',
  'Slovakia': 'Slovak Extraliga', 'Slovak Extraliga': 'Slovak Extraliga', 'Extraliga': 'Slovak Extraliga',
  // non-pro, mapped so they don't warn
  'NCAA': 'NCAA', 'NCAA III': 'NCAA III', 'NCAA II': 'NCAA II', 'ACHA': 'ACHA',
  'USports': 'OUA (U Sports)', 'OUA': 'OUA (U Sports)', 'ACAC': 'ACAC',
  'NAHL': 'NAHL', 'USHL': 'USHL', 'BCHL': 'BCHL', 'AJHL': 'AJHL', 'SJHL': 'SJHL',
  'MJHL': 'MJHL', 'SIJHL': 'SIJHL', 'OJHL': 'OJHL', 'GOJHL': 'GOJHL', 'NCDC': 'NCDC',
  'USPHL Premier': 'USPHL Premier', 'WSHL': 'WSHL', 'CCHL2': 'CCHL2',
};
export function mapLeague(epName, proLeagues, warn) {
  const name = LEAGUE_MAP[String(epName || '').trim()] || null;
  if (name) return { league: name, pro: proLeagues.includes(name) };
  if (warn) warn('unknown EP league "' + epName + '" — treated as non-pro, review it');
  return { league: String(epName || '').trim(), pro: false };
}

// ---- EP season row -> the file's season shape ----
export function mapSeason(epRow, proLeagues, warn) {
  const st = epRow.regularStats || epRow.stats || {};
  const { league, pro } = mapLeague(
    (epRow.league && (epRow.league.name || epRow.league.shortName)) || epRow.leagueName,
    proLeagues, warn);
  const team = (epRow.team && (epRow.team.name || epRow.teamName)) || epRow.teamName || '';
  const season = String(epRow.season && (epRow.season.slug || epRow.season.name) || epRow.year || '')
    .replace(/^(\d{4})-(\d{4})$/, (m, a, b) => a + '-' + b.slice(2));
  const n = v => (v == null ? null : +v);
  const base = { season, team, league, level: pro ? 'Pro' : (/(NCAA|ACHA|OUA|U Sports|ACAC)/i.test(league) ? 'College' : 'Junior') };
  const isG = st.SVP != null || st.svp != null || st.GAA != null || st.gaa != null || epRow.position === 'G';
  const row = isG
    ? { ...base, gp: n(st.GP ?? st.gp), w: n(st.W ?? st.w), l: n(st.L ?? st.l), otl: n(st.OTL ?? st.otl),
        so: n(st.SO ?? st.so), gaa: n(st.GAA ?? st.gaa), svpct: n(st.SVP ?? st.svp), svs: n(st.SVS ?? st.svs) }
    : { ...base, gp: n(st.GP ?? st.gp), g: n(st.G ?? st.g), a: n(st.A ?? st.a), pts: n(st.PTS ?? st.pts),
        pim: n(st.PIM ?? st.pim), pm: n(st.PM ?? st.pm) };
  const po = epRow.postseasonStats || epRow.playoffStats;
  if (po && (po.GP ?? po.gp) != null)
    row.po = { gp: n(po.GP ?? po.gp), g: n(po.G ?? po.g), a: n(po.A ?? po.a), pts: n(po.PTS ?? po.pts), pim: n(po.PIM ?? po.pim) };
  return row;
}

// ---- merge: fill nulls, append missing seasons, never overwrite curated ----
export function mergeSeasons(player, epRows, log) {
  const key = r => [r.season, r.team.toLowerCase(), r.league].join('|');
  const have = new Map(player.seasons.map(r => [key(r), r]));
  epRows.forEach(er => {
    const cur = have.get(key(er));
    if (!cur) {
      // a season the file does not have at all — appended for review
      player.seasons.push(er);
      log('  + added ' + er.season + ' ' + er.team + ' (' + er.league + ')');
      return;
    }
    Object.keys(er).forEach(k => {
      if (k === 'po') return;
      if (cur[k] == null && er[k] != null) { cur[k] = er[k]; log('  ~ filled ' + er.season + ' ' + er.team + ' ' + k + ' = ' + er[k]); }
    });
    if (er.po && !cur.po) { cur.po = er.po; log('  ~ filled ' + er.season + ' ' + er.team + ' playoffs'); }
  });
}

export function overrideNowRemovable(player, proLeagues) {
  const scopes = [];
  const rows = s => player.seasons.filter(r =>
    (proLeagues.includes(r.league) || r.level === 'Pro') && (s === 'pro' || r.team === 'Huntsville Havoc'));
  if ((player.override_pro || player.override_pro_goalie) && rows('pro').every(r => r.gp != null)) scopes.push('pro');
  if ((player.override_havoc || player.override_havoc_goalie) && rows('havoc').every(r => r.gp != null)) scopes.push('havoc');
  return scopes;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const pro = data.meta.pro_leagues;
  // hard stop if the API merge would ever reach the live-counter fields
  const frozen = JSON.stringify(data.players.map(p => [p.baseline_pro, p.baseline_havoc, p.current_season]));
  const changes = [];
  const log = m => changes.push(m);
  for (const p of data.players) {
    log(p.name + ':');
    const before = changes.length;
    // resolve + cache the EP id — the join key for everything after this
    if (!p.ep_id) {
      if (KNOWN_IDS[p.name]) { p.ep_id = KNOWN_IDS[p.name]; log('  ~ ep_id seeded: ' + p.ep_id); }
      else {
        try {
          const res = await ep('/players', { q: p.name, limit: 5 });
          const hits = (res && (res.data || res.players)) || [];
          const hit = hits.find(h => (h.name || (h.firstName + ' ' + h.lastName)) === p.name) || (hits.length === 1 ? hits[0] : null);
          if (hit) { p.ep_id = hit.id; log('  ~ ep_id resolved: ' + hit.id); }
          else log('  ! no unambiguous EP match (' + hits.length + ' candidates) — resolve by hand');
        } catch (e) { log('  ! EP search failed: ' + e.message); }
      }
    }
    if (!p.ep_id) { if (changes.length === before) changes.pop(); continue; }
    try {
      const res = await ep('/players/' + p.ep_id + '/stats', { limit: 100 });
      const rows = ((res && (res.data || res.stats)) || [])
        .filter(r => (r.gameType || r.type || 'REGULAR_SEASON').toUpperCase().indexOf('REGULAR') >= 0 || r.postseasonStats)
        .map(r => mapSeason(r, pro, w => log('  ! ' + w)));
      mergeSeasons(p, rows, log);
    } catch (e) { log('  ! EP stats failed: ' + e.message); }
    overrideNowRemovable(p, pro).forEach(s =>
      log('  * every ' + s.toUpperCase() + ' season row now has a GP — the ' + s + ' override can be deleted so computed sums take over'));
    if (changes.length === before) changes.pop(); // nothing to say about this player
  }
  console.log(changes.length ? changes.join('\n') : 'No changes — the file already matches EP.');
  console.log('\nEP calls used: ' + CALLS);
  if (frozen !== JSON.stringify(data.players.map(p => [p.baseline_pro, p.baseline_havoc, p.current_season]))) {
    console.error('BUG: the refresh touched baseline/current_season fields — nothing written.');
    process.exit(1);
  }
  if (!DRY && changes.some(c => /^  [~+]/.test(c))) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
    console.log('Wrote ' + path.relative(ROOT, FILE) + ' — review the diff above, then commit.');
  } else if (DRY) {
    console.log('(dry run — nothing written)');
  }
}

// only run when invoked directly, so the mapping functions stay testable
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  main().catch(e => { console.error(e.message); process.exit(1); });
}
