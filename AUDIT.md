# CODE-LEVEL AUDIT — Part 3 of HAVOC_HUB_MASTER_DOCUMENT.md
**Audit only. No code was modified.** Every finding cites `file → function/section → logic` and is labeled **CONFIRMED FROM CODE**, **INFERRED**, or **UNKNOWN**. Data-side claims were verified by independent recomputation over the committed JSON (`tests/anchor_reconstruction.mjs`, committed with this report — it becomes P0A tests #2 and #4).

**Files inspected:** `index.html` (7,998 lines), `player.html`, `bios.html`, `sw.js`, `mobile.css`, `manifest.json`, `js/daily-report-parser.js`, `scripts/{fetch-rosters, fetch-daily-report, update_stats, add_player, build-ep-data, probe-ht}.mjs`, `.github/workflows/{sphl-daily, ep-refresh, ep-data, ht-probe}.yml`, `data/{havoc_players, sphl-rosters, bios, sphl-daily, ep-players}.json`.
**Terms traced to exhaustion:** `current_season`, `baseline_*`, `computed_*`, `override_*`, `pro_leagues`, `level`, `msTotals`, `msSum`, `msIsPro`, `msIsHavoc`, `htCareerFor`, `feedSet`, `handOwns`, `feedOwns`, `p.sheet`, `spineRosterApply`, `rosterFileApply`, `htMergeRoster`, `htVitalsBackfill`, `recBook`, `recParse`, `recWatchRows`, `frJoin`, `frLive`, `frgLive`, `msWithin`, `rosterMatch`, `norm`, `localStorage.setItem`, `careersFile`, `quiz`/`flashcard`/`learn`.

---

## EXECUTIVE SUMMARY

**Excellent.** The career-math architecture is exactly Part 2 §4 and it is *correct*: **all six anchor reconstructions match** (Alger, Fries ×2, Wilson ×2, Procopio — §A.0), the file-wide sweeps are clean (0 PTS≠G+A rows, 0 junior/college leaks into pro sums), no live double-counting path exists, GAA/SV% are never summed anywhere, milestone thresholds match the spec constant-for-constant, and the record watch / boards / franchise race all consume the **same** `msTotals` result. The EP refresh Action is fully compliant with §5 and §7 (PR-only, freeze-guarded, never-decrease). Hand-edit ownership on the eight vitals works exactly as documented. Fail-soft floors genuinely prevent empty-over-good commits.

**Fragile.** Roster precedence (Part 2 §5) is **not implemented** — the ownership flag it depends on (`p.sheet`) is read once and written never, so the one guard that exists is inert, and `feedSet` cannot tell rung 1 internal data from rung 4 stale data. The measured blast radius today: **one click of Game Day Refresh deactivates 6 of the 17 signed 2026-27 players and injects 24 departed 2025-26 players as active**, changing every prep output at once. Separately, the packet's "SPHL Career"/"Career" blocks print from two caches (HockeyTech, EP) that are never reconciled with the spine, and `msLoad` permanently prefers a localStorage import over the committed file.

**First (P0A candidates, in order).** (1) Roster provenance + season-aware `feedSet` — stamp spine rows, make the ladder enforceable (C-1/C-2/C-11/C-12); (2) `msLoad` staleness — stop `DATA.careersFile` from shadowing the committed spine forever (A-8); (3) one canonical career function shared by index.html and player.html, retiring `computed_*` drift (A-5/A-14/D-1); (4) the record-watch holder join (B4-a); (5) the five automated tests — #4 and #2 already exist in `tests/anchor_reconstruction.mjs` and pass.

**Canonical data model:** the implemented model **matches Part 2 §4 exactly** — frozen `seasons[]` + `baseline_pro`/`baseline_havoc` + `current_season`, displayed career = baseline + current (`index.html:5215-5221`). No redesign is recommended. The recommendation is *consolidation* (one implementation of it instead of five) — not a different model.

---

## A. CAREER-STAT TRACE

### A.0 Hand-reconstruction vs known-good anchors — ALL MATCH ✅ **[CONFIRMED — run `node tests/anchor_reconstruction.mjs`]**

| Player · universe | Anchor | Displayed (baseline+current) | Fresh re-sum of seasons[] | Verdict |
|---|---|---|---|---|
| Alger · PRO | 200 GP / 97-105-202 | **200 / 97-105-202** | 193 / 97-102-199 (1 row missing GP) | ✅ anchor = displayed; the delta is the documented tracker source, carried in the baseline |
| Fries · PRO | 329 GP / 86-107-193 | **329 / 86-107-193** | 329 / 86-107-193 | ✅ exact, both ways |
| Fries · SPHL-only | 306 / 74-93-167 | (no SPHL total exists on any surface — §A.3) | **306 / 74-93-167** | ✅ re-sum matches |
| Wilson · PRO | 164 GP / 95 W / 10 SO | **164 / 95 / 10** | 164 / 95 / 10 | ✅ exact |
| Wilson · HAVOC | 92 GP / 49 W / 8 SO | **92 / 49 / 8** | 92 / 49 / 8 | ✅ exact |
| Procopio · HAVOC | 110 GP / 65 PTS | **110 / 65** | 110 / 65 | ✅ exact |

Sweeps: **PTS≠G+A rows: 0 · junior/college leaks into any pro sum: 0.** Baseline-vs-seasons deltas exist only where documented tracker values fill gaps the season rows can't (Alger Havoc PIM 8; Wilson SVS 4,544 pro / 2,566 Havoc — Part 2 §12's flagged values, intact).

### A.1 The architecture in the code — five universes, not two **[CONFIRMED]**

| # | Universe | Source | Consumers |
|---|---|---|---|
| 1 | Spine pro/Havoc | `baseline_* + current_season` | milestone boards, franchise race, record watch, hub career pages, player.html totals |
| 2 | Spine seasons[] re-sum | `seasons[]` filtered live | `msTotals` v1 fallback (dead today); player.html `+/-` and playoff columns |
| 3 | HockeyTech SPHL career | `DATA.careerHT` (localStorage, manual pull) | packet career pages ("SPHL Career" block, index.html:5016-5030), folder career line (:3939-3948) |
| 4 | EliteProspects static | `data/ep-players.json` | packet career pages fallback ("Career" block, :5032-5040) |
| 5 | Live team stats | `DATA.report.teamStats` | Meet the Team stripe, call-sheet season lines |

Universes 1–2 are Part 2 §4. Universes 3–5 are older surfaces **never reconciled against the spine** — the same player's packet can print a feed-derived career beside a spine-derived one (Finding A-1).

### A.2 The single hub entry point — `msTotals(p,scope)` index.html:5206-5227 **[CONFIRMED]**
- **v2 path (:5215-5221)**, taken for all 17 players today: `vals[k] = (baseline[k]??0)+(current_season[k]??0)`; `override_*` returned only as the boolean `ov` (the tracker chip) — **its values are ignored on this path** (Finding A-4).
- **v1 fallback (:5223-5226)**: `msSum(seasons[] filtered)` with `override_*` merged over — **unreachable with today's data; dead code.**
- Priority, hub: baseline+current ▸ override-over-sum ▸ sum. `computed_*_totals` never read by index.html.
- Priority, player.html `tot()` (:200-215): baseline+current ▸ **computed_*+current** ▸ "—". `override_*` never read by player.html.

### A.3 Things the assignment assumed that do not exist **[CONFIRMED]**
- `htCareerFor` is **not** an SPHL filter over the spine — it reads the separate HockeyTech cache (universe 3).
- **No SPHL-only stat total exists anywhere**; player.html:168 counts SPHL *seasons* only, and the "HAVOC / SPHL / PRO TOTALS" label (:213-214) is inferred from pro==Havoc equality, not computed.
- **No in-app editor for `current_season`** — the game-night edit is a JSON file edit or `msImportFile` import (matches the documented workflow).
- **No season-rollover implementation** — prose only, in three documents; no script (Finding A-13).

### Findings A (each **[CONFIRMED]** unless noted)

| ID | Sev | Finding |
|---|---|---|
| **A-1** | **HIGH (latent)** | Packet "SPHL Career" (:5011-5031, HockeyTech cache) and "Career" (:5032-5040, EP file) blocks never reconcile with the spine — three different careers can print in one packet. Latent today: `ep-players.json` careerStats are near-empty (94/352 entries, max 1 row). |
| **A-2** | **HIGH (latent)** | The EP "Career" block sums **every** row with no league/level/playoff filter (:5035); `build-ep-data.mjs:290-315` dedupes by `year\|team\|league\|gp`, so a playoff row with different GP is added to the same total. Would mix NCAA/junior/playoffs if EP data filled in. |
| **A-3** | MEDIUM | `msSum` (:5202) and the v2 path (:5219) coerce null→0, violating the stated "— never zero" rule (:963, comment :5196). Downstream, `frLive:5447`/`frgLive:5554` null-coalescing fallbacks to the club's published all-time numbers are unreachable — spine always silently overrides. |
| **A-4** | MEDIUM | `override_*` values consumed only by the dead v1 path; the tracker chip (:5381, :5828) renders from the live path's boolean. Invisible today **only because the baselines were seeded byte-for-byte from the tracker** (verified: Alger, Wilson). player.html shows tracker-sourced totals with no chip at all. |
| **A-5** | MEDIUM | `computed_*_totals` are write-once (`add_player.mjs:140`), never recomputed, already drifted (Alger: 193/199 vs baseline 200/202; Wilson SVS 0 vs 4,544). If a baseline were ever deleted (the exact advice `update_stats.mjs:219-220` prints), player.html would print 193 GP while index.html printed 200 — two pages, one player, two careers. |
| **A-6** | MEDIUM | player.html totals rows mix bases *within one row*: GP/G/A/PTS/PIM from baseline+current, but `+/-` and playoff columns re-summed from seasons[] (:206-207) — Alger's PRO row prints 200 GP beside a +/- covering only 193 GP, unmarked. |
| **A-7** | MEDIUM | Playoff leakage: display layer is clean everywhere; the **ingest** filter (`update_stats.mjs:214`, `add_player.mjs:111`) admits playoff-typed rows via `\|\| r.postseasonStats`, and `mapSeason:103` would read their playoff line as regular stats if `regularStats` is absent. Whether EP ever sends that shape: **UNKNOWN** (no API access from the audit). `syncCurrent:128` takes the *first* matching row — same exposure. |
| **A-8** | **HIGH** | `msLoad` (:5256-5264) prefers `DATA.careersFile` (a localStorage import) over fetching the committed file, **forever, with no freshness check** — a browser that ever imported the file stops seeing committed updates. player.html always fetches fresh, so hub and bio pages can disagree in the booth. |
| **A-9** | MEDIUM | PTS summed independently of G+A everywhere; no validator. Data clean today (sweep: 0). Exposure is the game-night hand edit (bump `g` without `pts`). The EP ratchet cannot repair it coherently (counters reconcile at different times). |
| **A-10** | — clean | Milestone flags, record watch and boards all consume the same `msTotals` result (:5370-5371, :5743, :5446, :5553). The assignment's suspicion is **not borne out**. Caveat: record watch is Havoc-scope even under the Pro board view (B4-d). |
| **A-11** | LOW | `seasonsCount` (+1 unconditional, player.html:102) asserts a 2026-27 season before a game is played and would double-count if a live-season row ever landed in seasons[] (both writers currently prevent that). |
| **A-12** | MEDIUM | Unknown EP league names default to non-pro **`level:'Junior'`** (`update_stats.mjs:94-111`) — a real pro league missing from the 40-entry map is excluded from every pro sum, with only a change-list warning. `mapSeason` also never emits 'High School'/'Youth' (both exist in the data). |
| **A-13** | conditional-CRITICAL | **No rollover script exists.** Folding current_season into seasons[] without zeroing counters would double-count the whole season on every surface with nothing to detect it. (Mitigation: the P0A test suite — anchors + recompute — would catch it, which is an argument for the tests preceding the rollover.) |
| **A-14** | reference | Five reimplementations of "career total" with three Huntsville tests (`==='Huntsville Havoc'` ×2, `/Huntsville/` , `/Huntsville/i`), two pro filters (OR-list∪level vs level-only), two null policies (0 vs —), two goalie key sets (hub omits L/OTL; bio page attempts them). All agree on today's data — verified — but only by data discipline, not by construction. |
| **A-15** | LOW | `frJoin` fuzzy fallback (:5429-5435) could attach live totals to a wrong historical name; today all 4 joins are exact-name and value-identical. |

---

## B. MILESTONE & FRANCHISE-RACE TRACE

**Thresholds vs spec — MATCH, constant for constant [CONFIRMED]:** `MS_RULES` :5234-5237 = `skater{gp:[100,25],g:[50,10],a:[50,10],pts:[50,15]}, goalie{gp:[100,25],w:[50,10]}`; `msWithin` :5229 (`next=Math.ceil((val+1)/step)*step` — correctly refuses to re-flag a just-hit round number); tiers `msTier` :5238 soon≤5 / up≤15 / far. Ties: competition ranking with shared `T-` ranks on the all-time skater list (`frLive:5450-5454`), goalie list (`frgRanked:5566-5570`), coaches (:5642-5646), and the generic `tsRanks` engine (:5171-5191, official rank kept as the gray second line). 25-GP qualifier: enforced only on `gaa`/`svpct` sorts (`frgRanked:5562-5564`), with the show-all toggle (`FRG_ALL`, not persisted).

**Consumers → universes [CONFIRMED]:** badges = `msTotals(p, activeView)`; banner call lines = literal `away<=5` (:5399, a second "soon" definition) + franchise lines only in the havoc view; Next Pass chips = havoc, skaters on PTS / goalies on W; record watch = career rows `msTotals(p,'havoc')`, season rows raw `current_season` (silent while 0 — correct preseason behavior); all-time re-rank = static leaders overwritten per-row by `msTotals(p,'havoc')`; goalie chase = live gp/w/so/svs, **static gaa/sv%/l/t by design** (disclosed at :5612).

| ID | Sev | Finding |
|---|---|---|
| **B4-a** | **HIGH** | Record-holder identity is a case-sensitive **last-name substring test** against the flattened holder string (`mine = rec.who.indexOf(last)>=0`, :5769) — shared surnames route to the wrong branch (green "he holds it" vs amber "verify before air"). `recBook()` flattens records to display strings (:2632), so no ID join is available at the watch. |
| B0-c | MEDIUM | null→0 on the boards (same as A-3); six spine-seeded players currently render all-zero rows, indistinguishable from true zeros. Badges unaffected. |
| B1-a | MEDIUM | Franchise-race banner lines render only in the **havoc** view (:5411); the default view is **pro** (:5192) — a broadcaster on the default view sees no all-time calls. |
| B3-a | MEDIUM | The goalie leaders table opts out of the shared sort engine (`ts-skip`, :5609) — a parallel sort/rank implementation to keep in agreement. |
| B3-b | MEDIUM | The 25-GP qualifier is measured on **live** GP but gates **2025-26-static** GAA/SV% (:5551 vs :5564) — a goalie can qualify mid-season on rates that don't cover his qualifying games. Disclosed only generally. |
| B2-a/b | LOW | The "this season" tier is reachable only on GP (window math); SVS/SO/PIM are displayed but have no milestone rule (PIM *is* record-watched). |
| B2-d | LOW | Three independent tier-cutoff definitions (:5238, :5399, :5663 — staff uses ≤10 for "up"). |
| B4-b/c | latent | `recParse` (:5730-5736) drops a leading `.` (SV% ".927"→927) and strips the holder by first-numeric-run replace — both harmless with today's watched records, real bugs the day a rate record is watched. |
| B1-b | LOW | `frLive()`/`frgLive()` recomputed per rendered row (52-leader scan each) — fine at today's sizes, first hot spot if lists grow. |

---

## C. ROSTER PRECEDENCE PROOF (Part 2 §5)

**Context [CONFIRMED FROM DATA]:** `data/havoc_players.json` = rung 1 (internal 2026-27, 17 players). `data/sphl-rosters.json` = rung 3/4 **today** (season 44 = 2025-26 fallback, honestly labeled by the Action — but its consumers ignore the label). The live feed is in the same fallback state (season 46 returns coaches-only; `seasonTry` substitutes season 44).

**Measured blast radius (computed with the app's own matcher against the committed files):** 6 spine players absent from the 2025-26 data (Goukler, T. Williams, Schmuck, Helmer, Hodge, Ilott) · 24 feed-only 2025-26 players · 1 jersey conflict (Proctor spine **#72** vs 2025-26 feed **#1**) · 4 position conflicts.

### Verdict per field class

| Field class | Required (§5) | Implemented | Verdict |
|---|---|---|---|
| Membership — add | flag for confirmation | any feed row pushed `active='1'` (:7345) | ❌ 24 stale adds |
| Membership — drop | sheet players never dropped | inactive sweep :7368, guard inert (below) | ❌ **CRITICAL** — 6 signed players deactivated |
| Jersey number | internal wins | hand > **any feed incl. 2025-26** (:7352, no empty-only guard) > spine; committed-file path IS guarded (:7420) | ❌ on live sync (Proctor #72→#1); ✅ on file apply |
| Position / vitals | internal wins | hand > feed-any-season (:7354/:7357/:7421/:7447) > spine-empty-fill | ❌ 3 paths (one zero-click: `rosterFileApply` runs on every page load) |
| Headshot | hand > official > cached | feed URL first, hand upload **last** (:3259-3264); write bypasses `feedSet` (:7351) | ❌ hand-proof bypassed |
| Pronunciation | authored/hand | feed phonetic > authored bios.json; `pron` absent from the handEdit list | ❌ |
| Active flag | hand wins | `p.active='1'` unconditional (:7364), bypasses `feedSet`; not hand-protectable | ❌ scratches silently undone |
| Name (join key) | spine formal name | spine name preserved (:7347) | ✅ **HOLDS** |

### Root causes **[CONFIRMED]**
- **C-11 (CRITICAL, enabling):** `p.sheet` is **read exactly once (:7368) and written nowhere in the repo** — `spineRosterApply` (:5300-5317) stamps no provenance, so rung 1 is unlabeled and the one written guard is dead code.
- **C-12 (CRITICAL, enabling):** `feedSet` (:7304-7310) refuses exactly two things — blank values and hand edits. It has no notion of season, file age or spine ownership: rungs 2, 3 and 4 are indistinguishable to it.

### Named violations (trigger scenarios)
1. **:7368** inactive sweep — one click of Game Day Refresh before the SPHL publishes 2026-27 → 6 signed players `active='0'`, gone from every prep output at once (the `>=8` guard tests "full roster", not "right season"). **CRITICAL**
2. **:7352** live-sync `feedSet(p,'num',…)` without the empty-only guard its sibling has (:7420) → season-44 numbers overwrite spine numbers (Proctor). **CRITICAL**
3. **:7345** unmatched feed names pushed active → 24 departed players on tonight's call sheet. **CRITICAL**
4. **:7421** `rosterFileApply` feedSets pos+vitals with no season check — **zero-click, on every page load**, from a file that is 2025-26 content today. **HIGH**
5. **:7351 + :3259-3264** headshot raw-assigned (bypasses feedSet) and ranked above the hand upload. **HIGH**
6. **:7364** unconditional `active='1'` — a hand-set healthy scratch is silently reactivated by any sync. **HIGH**
7. **:7427-7456** `htVitalsBackfill` deliberately fetches the previous season and feedSets vitals+pos, auto-chained after every roster pull — targets exactly the new signings. **MEDIUM**
8. **:7362/:7423/:7449** feed phonetic_name beats authored bios.json pronunciation; not pinnable by hand. **MEDIUM**
9. **`.github/workflows/ep-data.yml:37,43`** — `git add data/*.json` + **direct push to main**, no PR, no floor: a dirty `havoc_players.json` in the runner tree would ship unreviewed. Violates §7. **HIGH**
10. **`sphl-daily.yml`** pushes main directly — data content is rung-3/4-only and fail-softed (safe), but §7 says PR-only. **MEDIUM (policy)**
11. **`savePlayer` (:2472-2488)**: hand protection covers only `num,pos,ht,wt,sh,age,birth,dob`; confirming an unchanged value sets no flag; saving a blanked modal freezes blanks as hand edits. **MEDIUM**

### Protections that DID survive **[CONFIRMED — keep these]**
Hand-edit ownership on the 8 vitals (:2481-2484 → :7308) · change-guards/idempotence on both apply functions · spine name preserved as the join key (:7347) · `rosterFileApply` never adds/deactivates and never overwrites a set number (:7414/:7420) · `feedSet` refuses blanks (:7305) · **ep-refresh.yml PR-only with freeze-guard and never-decrease** (`update_stats.mjs:138-139, 188-190, 225-232`) · `fetch-rosters.mjs` fail-soft floors (zero-players, >50% shrink → softExit, last good file kept) and honest season labeling · no automatic roster sync in the browser (`feedAutoCheck` probes only; the destructive path requires a click) · single roster store, single `active!=='0'` gate into every prep output · season honesty in the UI (fallback banners, freshness chips — the app *tells* you it fell back; it just doesn't *act* on it).

---

## D. DATA-FLOW MAP + DUPLICATE LOGIC

```
SOURCES                     COMMITTED (git — the only durable layer)         BROWSER STORAGE
HockeyTech live feed ──┐    havoc_players.json  ← update_stats (PR) /       localStorage:
daily report (keyless)─┤      RUNG 1 spine        add_player (local)          havocHubData_v2            = DATA (everything)
EliteProspects API ────┤    sphl-rosters.json   ← fetch-rosters (nightly,     havocHubData_v2_backup     rolling 30s snapshot
hand edits ────────────┘      RUNG 3/4 today       fail-soft, pushes main)    havocHubData_v2_lastbk     export timestamp
                            bios.json             authored prose              havocHubData_v2_bksnooze   banner snooze
                            sphl-daily.json                                 IndexedDB havocHub/kv: mirror (full DATA, 4s), bkdir
                            ep-players/teams.json                          CacheStorage: havoc-hub-v3 shell+spine+bios, havoc-heads-v1

WRITE PATHS INTO DATA.roster (order applied):        CALCULATION                       DISPLAY / PREP OUTPUT
  spineRosterApply  — creates + empty-only fills      msTotals → msFlags/msWithin       tabs: Game/Live/Rosters/Reference/Print
  rosterFileApply   — AUTO each load; feedSets vitals frLive/frgLive/frNextPass         packet (14 sections) · lineup chart
  htMergeRoster     — click-sync; adds, feedSets,     recBook → recWatchRows            broadcast folders · dense game sheet
                      active='1', SWEEP :7368         glGames/glRec/glSplits            player.html / bios.html (fetch fresh)
  htVitalsBackfill  — prev-season vitals re-apply     teamPronList · rosterMatch/norm   BOOTH OUTPUT: NOT BUILT (no tab, no view)
  savePlayer (hand) — handEdit on 8 fields            pkLayout/pkFlowSection/pkAutoFit
```
`localStorage.setItem` writes exactly **4 keys** (all `havocHubData_v2*`); player.html/bios.html/sw.js write none. Booth Engine (P0C): confirmed unstarted.

### Duplicate-logic register (consolidation targets for P0A)

| # | Value | Implementations | Agree? |
|---|---|---|---|
| **1** | **Career totals** | `msTotals` :5206 · player.html `tot()` :200 (own loop; reads `computed_*` fallback index ignores) · packet `htCareerFor` :3440 (HockeyTech) · packet EP block :5035 (unfiltered) | ❌ three answers possible per player — **HIGH** |
| **2** | **Team record** | hand `G.hsvrec` · `stripRec(standings)` :5913 · `glRec` :6244 · inline tally :4916 · matchup :6170 | ❌ five, two shapes — a packet can show two different records — **HIGH** |
| **3** | **Stat-line join** | `applyStatsTo` :6110 (htId→num/name→rosterMatch) · `statLineFor` :2911 (num→name) · :6132 · :4723 | ❌ four joins, three precedences; only one uses the league ID — **HIGH** |
| **4** | Standings parse | :2296 and `parseStandingsInto` :6446 byte-identical; third parser in js/daily-report-parser.js | ❌ copy-paste — MEDIUM |
| **5** | Pronunciation | `teamPronList` :3352 (full chain) · `fdPron` :3861 (no Settings guide) · inline :6737 | ❌ three depths — MEDIUM |
| **6** | Name normalization | `norm` :4571 (no NFD) · `rosterMatch` :7315 · `normName` build-ep-data.mjs:43 (NFD+suffixes — the best one) · two different `slug`s (add_player vs player.html) | ❌ five normalizers, three semantics — MEDIUM |
| **7** | "Is a forward?" | `order` map :2428 (`'F'`→NaN sort) · progress chips :2441 (**excludes 'F'** — 9 of 17 spine players counted in no group) · `pos!=='D'&&pos!=='G'` ×3 | ❌ two incompatible — MEDIUM |
| 8-11 | franchise join / distance-to-target / careers-file loaders / headshot URL | see agents' traces | ⚠️ LOW–MEDIUM |

---

## E. VERIFY-ONLY PAGE

**Prep/print pipeline [CONFIRMED]:** a full packet print exercises `pkPreset → renderPacket (141 lines, largest function) → pkRebuild (secApplyAll → pgFooterFix → pkLayout/pkFlowSection) → pkAutoFit (≤6 passes) → printDoc (re-runs renderPacket) → print CSS`. Invariants hold in code: 816×1056 fixed page box, one `.page` = one sheet (`overflow:hidden` + `page-break-after`), scale-invariant measurement (`pkScale`), footer stacking via `pgFooterFix`. Regression traps: **printing mutates saved state** (`pkAutoFit` writes `DATA.secAuto` + `save()` — opening the print dialog can change stored sizes); **missed overflow is clipped invisibly on paper** (the red outline is `no-print`); two auto-fit implementations with different floors (7pt vs 6pt at :1997); `PK_CHROME`/`PK_NOFLOW` are hard-coded allowlists any new page furniture must join.

**PWA/offline [CONFIRMED]:** network-first + cache-fallback; precache = shell + `bios.json` + `havoc_players.json` (cache `havoc-hub-v3`); headshots cache-first. Offline: boards, record watch, career/bios data and previously-seen headshots work; `sphl-rosters/ep-players/sphl-daily` only if fetched once while online; **`player.html`/`bios.html` offline are served `index.html`** by the navigate fallback (wrong page, not an error); no offline indicator; unbounded runtime cache. A cache-name bump without an `sw.js` byte change does nothing (moot in practice — edits change bytes).

**Architecture hot spots [CONFIRMED]:** one 6,350-line script; top functions `renderPacket` 141 / `fdDataPage` 115 / `rinkSVG` 88 / `sheetPageHTML` 75 / `renderReference` 74 / `careerPages` 72; ~25 module-level mutable globals with `DATA` as the god-object; `onclick="..."` string handlers require every callable global (plain `<script>` split per the master doc is the right call — ES modules would break every button silently); `sw.js` precache must be updated in lockstep with any split; two `typeof`-guard load-order hedges already in the code (`PACKET_SECTIONS`, `rosterMatch`).

**Learn the Rosters [SUPERSEDED — rebuilt at P3]:** this entry recorded the feature as fully absent after cleanup Phase 3. It returned, slim, in PR #91 (the bridge assignment): a jersey-first study drill in `js/booth.js` — number->player and player->number, pronunciation, position, line/pair, Havoc + opponent study, opponent cram, expected-active-only, no scoring or gamification. Verified 12/12 against master document Part 1 during P3 and marked complete rather than rebuilt.

**Nomenclature (UI labels/headers only — identified, not rewritten) [CONFIRMED]:**
- *Goalie vs Goaltender*: print is consistently "Goaltenders" (:4764, :4945, :3030), screen consistently "Goalie(s)" (:5390, :5491, :5596) — the two never agree.
- *Power play*: `Power Play` and `Power play %` print as **adjacent rows of one table** (:5943 concatenates :6178 + :6344); also `PP%` (:4772, :2884).
- *PTS vs Pts*: house standard PTS; exceptions :2798 (screen) and :4924 (**printed** game-log page).
- Game log screen vs print header sets differ on four fields (Opp/Opponent, SF/SA vs Shots F-A, PPG+PP adv vs PP, Fights dropped in print).
- Cover standings box omits the SOL column the Live Data table has (:5928 vs :6710).
- `leaders4Block` spells out GOALS/ASSISTS/POINTS/PLUS-MINUS on a page otherwise abbreviated (:4879).
- `Team` (index) vs `Club` (player.html :244, :313).
- Game sheet comparison rows "our PP / their PK" — first-person lowercase on a printed sheet (:4772-4774); the PP% row prints a hard-coded "—" for the home cell.
- Printed group-row casing: FORWARDS/DEFENSE/GOALTENDERS (game sheet) vs Forwards/Defense/Goaltenders (roster page, chart) in the same packet.
- Defense/Defence: labels consistent (Defense); "Defence" exists only as a parser input synonym — no defect.

---

## RISK CLASSIFICATION

**CRITICAL (data integrity, live today)**
- C-1 inactive sweep :7368 — one sync click removes 6 signed players from every prep output.
- C-2 live-sync jersey overwrite :7352 — stale-season numbers beat internal numbers (Proctor #72→#1).
- C-3 stale-player injection :7345 — 24 departed players added active.
- C-11/C-12 root causes — no provenance stamp; season-blind `feedSet`. *(A-13 rollover double-count is conditional-CRITICAL: no script exists yet; the P0A tests would catch it.)*

**HIGH**
- A-8 `msLoad` localStorage shadowing of the committed spine.
- C-4 zero-click 2025-26 vitals via `rosterFileApply` on every load.
- C-5/C-6 headshot and active-flag writes bypass both feedSet and hand protection.
- C-9 `ep-data.yml` pushes `data/*.json` to main unreviewed (§7 violation with an unbounded glob).
- B4-a record-holder substring match — wrong green/amber branch on shared surnames.
- A-1/A-2 unreconciled packet career universes (latent while EP data is thin).

**MEDIUM** — A-3/B0-c null→0 vs the "never zero" rule · A-4 override values ignored on the live path (masked by tracker-seeded baselines) · A-5 `computed_*` drift (the player.html fallback trap) · A-6 mixed-basis totals rows · A-7 ingest playoff-leak clause (EP shape UNKNOWN) · A-9 PTS unvalidated on hand edits · A-12 unknown-league→Junior · C-7/C-8 vitals backfill + pron precedence · C-10 sphl-daily pushes main (policy) · C-11(savePlayer gaps) · B1-a pro-view banner gap · B3-a/B3-b goalie table engine + qualifier basis · D-1/2/3 duplicate calculators · E1 print mutates state / clipped overflow · E2 offline player.html misroute.

**LOW** — A-11, A-15, B2-a/b/d, B1-b, D-4..11, E cache growth, stale comment :899, nomenclature items.

**Regression risks to call sheets / game notes / line cards:** all three read the single `DATA.roster` through the single `active!=='0'` gate — which makes C-1 a *single point of failure for the whole prep pillar*, and equally means the P0A fix is one choke point, not many. The print pipeline's clipped-overflow behavior (E1) means any P0A change touching row counts must re-run the packet print check, not just the unit tests.

---

## RECOMMENDED CANONICAL DATA MODEL

**It already matches Part 2 §4.** Frozen `seasons[]` + baselines + `current_season`, career = baseline + current, is implemented at `index.html:5215-5221` and proven correct by the anchor reconstruction. Do not redesign. P0A should: (1) make `msTotals` the one canonical career function (player.html imports the same math; retire `computed_*` or regenerate it on every writer run), (2) add roster provenance + a season-aware `feedSet` so §5 becomes enforceable, (3) consolidate duplicate calculators D-1/2/3, (4) land the five tests — #2 and #4 exist and pass (`tests/anchor_reconstruction.mjs`); #1 and #3 are the same script's sweeps, ready to split out; #5 (stale-feed fixture) **would fail today** against `htMergeRoster`, by design of the test.

*End of audit. Awaiting approval before any P0A work.*
