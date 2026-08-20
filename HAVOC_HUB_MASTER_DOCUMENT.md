# HAVOC BROADCAST HUB — MASTER DOCUMENT
**The single controlling document for all development. Where anything else (old plans, READMEs, prior instructions, chat suggestions) disagrees with this document, THIS DOCUMENT WINS.**
Repo: murphsmurph/Havoc-Broadcast-Hub · GitHub Pages · Owner: Jacob Murphy, play-by-play broadcaster, Huntsville Havoc (SPHL)

---

# PART 1 — WHAT THIS APPLICATION IS

Two mission-critical pillars, one supporting feature, one division of labor.

**PILLAR 1 — PREP ENGINE (protect above all).** The Hub replaces Jacob's old Word/Excel prep workflow. It generates: call sheets, game notes, line cards, rosters, matchup notes, milestone material, player bio/career pages, franchise/historical notes, and printable game packets (PDF). Never remove, simplify away, or break prep-generation while adding anything. **Regression rule: a full packet must print correctly after every change session.**

**PILLAR 2 — BOOTH ENGINE (lean by design).** The same verified data, surfaced fast during a live call: one **Game Day view** assembling existing data — tonight's lineup/pairs, jersey-number lookup, milestone-watch strip, quick stats, game context, next-break info, and a simple live-notes textarea. It is a view over existing data, NOT a parallel subsystem. Built only after data integrity (P0A) is green.

**SUPPORTING — LEARN THE ROSTERS (slim).** Keep: flashcards, jersey↔name, pronunciation, position, line/pair, Havoc + opponent study, opponent cram. Cut: elaborate quiz modes, scoring, gamification. Reads canonical roster data only. P3 priority — never blocks or delays P0/P1.

**DIVISION OF LABOR (permanent).** The website RENDERS; Claude AUTHORS. All prose — media bios, broadcast bios, season recaps, storylines, franchise-file text, game-notes copy — is written in Claude (Cowork) sessions and committed as JSON (`data/bios.json` and related). The Hub NEVER generates or edits prose. Empty prose renders "— bio to come —". This also settles tone: notes sound professional because a broadcaster and Claude wrote them, not a template.

---

# PART 2 — STANDING LAWS (apply to every session, forever)

1. **Never invent a fact or a number.** A null renders "—", never 0. A missing bio renders a placeholder. Uncertain values carry their footnote/flag everywhere they print.
2. **Flag discrepancies; never silently correct historical data.**
3. **Career universes never mix.** The app distinguishes: CURRENT SEASON · HAVOC CAREER · SPHL CAREER · PROFESSIONAL CAREER · college/junior (which count in NO pro universe). Pro = SPHL, ECHL, FPHL, AHL, NHL, European pro leagues (Mestis, France D1, Coupe de France, BeNe, NIHL National, Slovak Extraliga). Never NCAA, U Sports, ACAC, or juniors.
4. **Career math architecture (already built — do not redesign):** frozen `seasons[]` history + `baseline_pro`/`baseline_havoc` (entering-season totals) + `current_season` live counters. Displayed career = baseline + current_season. `seasons[]` and baselines are never edited in-season; `current_season` is the only game-night edit. End-of-season rollover folds counters into history and recomputes baselines.
5. **2026-27 ROSTER PRECEDENCE (critical):** Jacob's internal team information outranks everything. Order: (1) internal 2026-27 signed-sheet/team data → (2) verified official SPHL 2026-27 data once actually published → (3) cached feed data → (4) prior-season/historical. HockeyTech being "live" does NOT make it authoritative — do not overwrite internal 2026-27 rosters with stale 2025-26 league data. Feed additions get flagged for confirmation; sheet players are never dropped by a sync; leftovers park as "unconfirmed". Reconcile, never blindly replace.
6. **Nothing broadcast-critical lives only in a browser.** Authored content belongs in git. localStorage is for ephemeral prefs and game-night counters only.
7. **Automations open PRs, never push to main** (EP refresh already does this — keep it; apply to anything new). Any fetch Action fails soft: keep last good file, never commit an empty file over a good one. **Narrow exception (ruled 2026-08-19, after P0A):** the daily fetch Action (`sphl-daily.yml`) may push ONLY its two cache files — `data/sphl-daily.json` and `data/sphl-rosters.json` — directly to main, on two conditions: (1) it runs the roster-precedence test (test #5) against the freshly fetched data BEFORE committing, and skips the commit with a logged warning if the test fails; (2) this exception stays written here. It covers no other file and no other workflow.
8. **Secrets:** the EliteProspects API key lives only in `.env` (gitignored) and the `EP_API_KEY` GitHub secret. Never in client code — GitHub Pages is public.
9. **SPHL conventions control, not NHL** — standings points, OTL/SOL handling, season length, roster rules. Use professional hockey nomenclature (goaltender, defenseman, line, defense pair, power play/PK, healthy scratch, dressed, etc.) and standard stat abbreviations (GP G A PTS PIM PPG SHG GWG SOG W L OTL GAA SV% SO) — but never force jargon where it reads unnaturally.
10. **Names:** formal name on bio/career page headers (e.g., GIOVANNI PROCOPIO); quoted nickname ("Gio") is the on-air shorthand for lineup cards and broadcast bios. **Data joins always use the formal name.**
11. **No re-bloating.** New feature ideas go into `LATER.md`, not the codebase. Review at the All-Star break. Preserve the static GitHub Pages / no-build architecture unless there is a compelling, stated reason.
12. **Known corrections that must hold:** Stefan is in his 16th season in the organization (7 player + 5 assistant + entering 4th as HC) — not 18th. Career shutouts record: 8 — Brian Wilson, active. Tracker-flagged values (e.g., Wilson career saves 4,544 pro / 2,566 Havoc; Alger 2025-26 GP/A) keep their flags until a complete source replaces them.

---

# PART 3 — IMMEDIATE ASSIGNMENT: SCOPED AUDIT (AUDIT ONLY)

**Do not modify code, refactor, redesign UI, add features, or change statistics in this assignment. Inspect the actual repository — evidence, not assumptions. Then STOP and wait for approval.**

Every finding cites `file → function/section → logic` and is labeled **CONFIRMED FROM CODE / INFERRED / UNKNOWN**. Do not claim a calculation works a certain way without finding the implementation. A product-level audit already happened; do NOT re-derive it — the sections below are the code-level gaps.

**A. CAREER-STAT TRACE (deepest priority).** Map every path that computes: current-season GP/G/A/PTS/PIM; Havoc career; SPHL career; professional career; goalie aggregation (GP W L OTL SO SVS; note GAA/SV% cannot be summed). Hunt specifically for: double counting (especially current_season added twice), universe mixing, NCAA/junior rows leaking into pro sums, PTS ≠ G+A, milestones consuming the wrong universe, stale values, and multiple functions computing the same total differently. **Hand-reconstruct three players end-to-end and compare to known-good anchors: Alger 200 GP / 97-105-202 pro; Fries 329 GP / 86-107-193 pro (SPHL-only: 306 / 74-93-167); Wilson 164 GP / 95 W / 10 SO pro, 92 GP / 49 W / 8 SO Havoc.**

**B. MILESTONE & FRANCHISE-RACE TRACE.** Which totals feed which badges, banners, next-pass chips, record-watch lines, and the all-time re-ranking; threshold logic (100s of GP within 25; 50s of G/A within 10; 50s of PTS within 15; goalie 50s of W within 10; soon ≤5 / upcoming ≤15); tie handling; the 25-GP qualifier on goalie rate sorts.

**C. ROSTER PRECEDENCE PROOF.** Trace every sync path (browser HockeyTech sync, nightly daily-report Action, any roster Action, manual edits, bios import if present) and prove the Part 2 §5 precedence holds on each — or name exactly where it can be violated. Confirm whether internal 2026-27 data can currently be overwritten, and how rosters flow into call sheets / game notes / line cards / Learn the Rosters.

**D. DATA-FLOW MAP + DUPLICATE LOGIC.** One diagram: SOURCE → STORAGE (files vs localStorage keys, list them) → CALCULATION → DISPLAY → PREP OUTPUT / BOOTH OUTPUT. List every place duplicate logic computes the same value.

**E. VERIFY-ONLY PAGE.** One page confirming (or correcting) prior findings on: prep/print pipeline and its regression surface, PWA/service-worker/offline behavior, architecture hot spots, Learn the Rosters current state, and meaningful nomenclature inconsistencies (identify only — do not rewrite).

**DELIVERABLE:** Executive summary (what's excellent / fragile / first) · the traces above · data-integrity risks classified CRITICAL/HIGH/MEDIUM/LOW · regression risks to call sheets/game notes/line cards · duplicated-logic list · recommended canonical data model IF it differs from Part 2 §4 (say so if it already matches) · the exact files inspected and terms traced. If something requested already exists, say so. If you disagree with an assumption here, argue it with evidence. **Then stop.**

---

# PART 4 — ROADMAP (execute in order, after audit approval)

**P0A — DATA INTEGRITY.** Fix only what the audit CONFIRMED (double counts, universe leaks, duplicate calculators consolidated to one canonical function per total). Then add `tests/` — plain node scripts, run by an Action on every PR, no framework:
1. PTS = G+A on every season row where all three exist.
2. Recompute pro/Havoc totals from seasons[] + current_season; compare to displayed values (respecting documented tracker overrides).
3. No junior/college row in any pro-universe sum.
4. Known-good anchors (Alger 202 pro PTS · Fries 329 pro GP · Wilson 95 pro W, 8 Havoc SO · Procopio 110 GP / 65 PTS Havoc — entering 2026-27; update anchors at rollover).
5. Roster precedence: a synthetic stale-feed fixture must NOT displace an internal-sheet player.
**Nothing else ships until P0A is green.**
**STATUS: COMPLETE — approved 2026-08-19.** Shipped as PRs #70 (stale-season tourniquet on every feed apply), #71 (roster provenance + season-aware precedence), #72 (msLoad: the committed file outranks a browser snapshot), #73 (one canonical career function, `js/career-math.js`; drifted `computed_*` fields retired), #74 (record-holder join by formal name), #75 (the five tests in CI, `.github/workflows/tests.yml`), #76 (ep-data.yml opens PRs instead of pushing main).

**P0B — PREP ENGINE COMPLETION.**
1. *localStorage rescue (if not already done — highest operational risk):* temporary Settings → "Export all local edits" button; Jacob exports from the browser(s) he edited in; merge into committed data files (his hand edits win; show a diff summary); only then remove in-place content editors. Keep game-night counter editors.
2. *Nightly roster Action:* fetch all SPHL rosters to `data/sphl-rosters.json` as a SOURCE LAYER merged under Part 2 §5 precedence — never destructively. Show file freshness in the UI. Keyless daily report remains the fallback floor.
3. *Bios rendering:* `data/bios.json` (fields: joined_blurb, season_recap, career_highlights, broadcast_bio, pronunciation, footnotes, embargoed; staff: role, season_recap, coaching_career, playing_legacy) renders all 20 pages — 17 players + Stefan/Piacentini/Detulleo — using the Giovanni Procopio and Stuart Stefan reference pages as the visual template (vitals line, Joined line, season counters, prose sections, grouped career table with playoff columns and totals bar). Prose content is supplied complete in the delivered bios file; load verbatim; footnotes print as small italics. `embargoed: true` = renders nowhere, excluded from print and indexes. When `current_season.gp > 0`, auto-prepend "2026-27 to date: X GP, G-A-P" (goalie variant) above the recap.
4. *Remaining cuts* (if not already done): Post-Game copy desk, EP widgets/iframes, embargo-mode machinery (replaced by the bios flag), club-bios import/signed-sheet reconcile UI (replaced by committed JSON + precedence rules), per-block hover nudge controls, page inspector outlines, folder layout editor, Compact preset. KEEP: Print Center sizing + Fit every page, and Learn the Rosters per Part 1.
**Packet print-test after each item.**
**STATUS: COMPLETE — reconciled against main 2026-08-19.** All four items verified shipped (rescue button live pending P3 removal; nightly roster Action gated by test #5; all 20 bio pages render with embargo + auto-prepend verified; every cut confirmed absent, KEEP items intact). Learn the Rosters = superseded-for-now, returns slim at P3.

**P0C — BOOTH ENGINE.** The single Game Day view per Part 1, Pillar 2. Reuse existing components; no new data stores; readable at booth distance in dark mode.
**STATUS: COMPLETE — PR #78; booth dry-run accepted 2026-08-20.** Polish #1 (a stale offseason daily report stomping fresher live stats) fixed in PR #81.

**P1 — BROADCAST INTELLIGENCE.** Opponent matchup notes in the packet (series history, head-to-head, opponent storylines from committed JSON); milestone/franchise-race/record-watch lines surfaced on the packet cover and Game Day view. Mostly wiring of existing data — build nothing that duplicates it.
**STATUS: COMPLETE — PRs #79 (storylines from `data/matchups.json` + series flags on the scouting report) and #80 (watch box on the packet cover); the Game Day view carries the same lines since PR #78.**

**P2 — LIVE INTELLIGENCE.** In-game refresh polish; next-break surfacing; nothing that risks P0 stability.

**P3 — SUPPORTING / ARCHITECTURE / POLISH.** Split index.html (shell + `css/hub.css` + `js/` modules: data, feeds, milestones, packet, print, ui — plain script tags, still works as file://, update service-worker cache list, zero behavior change). Slim Learn the Rosters per Part 1. Nomenclature pass (UI labels/headers only — prose is authored). Rewrite README under 1,000 words. Create `LATER.md`. Remove the temporary export button.

---

# PART 5 — ONGOING OPERATION (document at top of README when P0 completes)
- **Nightly:** Actions refresh rosters + league stats automatically, under precedence rules.
- **Game week:** prose authored in Claude, committed as JSON; the Hub renders it.
- **Game night:** Jacob bumps `current_season` player counters + team record (30 seconds, site or commit).
- **Weekly in-season:** EP refresh Action opens a PR (~17 API calls of the 1,000/month plan); Jacob reviews the diff and merges.
- **Season end:** rollover — fold current_season into seasons[], recompute baselines, zero counters, update test anchors.

*End of master document. When in doubt: protect the packet, respect the precedence ladder, never invent a number, and stop and ask.*
