/* Canonical career math — THE one implementation (P0A, audit A-14/D-1).
   Career = baseline_<scope> + current_season (the master document Part 2 §4
   model); when a baseline is absent, the v1 fallback sums the frozen
   seasons[] under the pro filter, with tracker overrides merged over.
   index.html (boards, race, record watch) and player.html (bio-page totals)
   both consume this file — plain script, works from file://.

   Null policy is a caller choice, preserving each surface's contract:
   - boards (nullAsZero: true, default): an unknown key counts as 0
   - bio page (nullAsZero: false): an unknown baseline key stays null → "—"  */
(function (root) {
  'use strict';
  function proLeagues(meta) { return (meta && meta.pro_leagues) || []; }
  function isPro(row, proL) { return (proL || []).indexOf(row.league) >= 0 || row.level === 'Pro'; }
  function isHavoc(row) { return row.team === 'Huntsville Havoc'; }
  /* null-respecting sum: a key no row carries stays "unknown" (0 here; the
     caller decides how unknown renders) */
  function sum(rows, keys) {
    const out = {};
    keys.forEach(k => {
      let any = false, t = 0;
      rows.forEach(r => { if (r && r[k] != null) { any = true; t += r[k]; } });
      out[k] = any ? t : 0;
    });
    return out;
  }
  function keysFor(p) { return p.type === 'goalie' ? ['gp', 'svs', 'w', 'so'] : ['gp', 'g', 'a', 'pts', 'pim']; }
  function totals(p, scope, meta, opts) {
    opts = opts || {};
    const keys = opts.keys || keysFor(p);
    const nz = opts.nullAsZero !== false;
    const ov = scope === 'pro'
      ? (p.override_pro || p.override_pro_goalie)
      : (p.override_havoc || p.override_havoc_goalie);
    const base = scope === 'pro' ? p.baseline_pro : p.baseline_havoc;
    if (base && p.current_season) {
      const cur = p.current_season, vals = {};
      keys.forEach(k => {
        if (nz) vals[k] = (base[k] == null ? 0 : base[k]) + (cur[k] == null ? 0 : cur[k]);
        else vals[k] = base[k] == null ? null : base[k] + (cur[k] == null ? 0 : cur[k]);
      });
      return { vals, ov: !!ov, live: cur, base };
    }
    // v1 fallback: frozen history under the pro filter, tracker override wins
    const proL = proLeagues(meta);
    const rows = (p.seasons || []).filter(r => scope === 'pro' ? isPro(r, proL) : (isPro(r, proL) && isHavoc(r)));
    const computed = sum(rows, keys);
    const incomplete = rows.some(r => r.gp == null);
    return { vals: ov ? Object.assign({}, computed, ov) : computed, ov: !!ov, incomplete };
  }
  root.CareerMath = { proLeagues, isPro, isHavoc, sum, keysFor, totals };
})(typeof window !== 'undefined' ? window : globalThis);
