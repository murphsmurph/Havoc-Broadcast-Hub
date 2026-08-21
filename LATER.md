# LATER

Where new ideas go instead of into the codebase (master document Part 2, Law §11:
*"No re-bloating. New feature ideas go into `LATER.md`, not the codebase. Review at
the All-Star break."*).

Nothing here is committed work. Each entry says what it is, why it was deferred, and
what it would touch. Add to the list freely; take from it only at a review point.

## Operational — do these when the trigger fires

- **EP call-budget guard.** The EliteProspects key exhausted its 1,000-call month on
  ~17 Aug 2026; every EP call has returned `401 Monthly limit … exceeded` since.
  Deferred because the quota resets on its own. When it does: cap calls per run in
  `scripts/build-ep-data.mjs` and `scripts/update_stats.mjs`, and treat a
  "Monthly limit" 401 as a distinct loud failure rather than a generic one, so a
  scheduled run can never silently burn the month again.
- **Three fill candidates, awaiting a deliberate decision.** From the historical-stat
  validation experiment, all confirmed against the official SPHL feed, none applied:
  Alger 2025-26 PIM `6`, Alger 2025-26 +/- `13`, Wilson 2025-26 saves `1277`. They are
  Hub nulls, not disagreements — the rule is review, never auto-overwrite.
- **Pronunciations.** `data/bios.json` carries the `pronunciation` key for all 17
  players and every value is still blank; opponents have none. The feed's
  `phonetic_name` fills in when the league publishes 2026-27 rosters; anything it
  leaves blank has to be asked for and committed.
- **Opening Weekend tab.** Temporary by design, self-archiving after 17 Oct 2026. The
  13 `ow*` functions stay in the code until someone decides to retire them.

## Architecture — considered and deliberately not built

- **Official-primary reconcile report.** A read-only view that compares `seasons[]` and
  `current_season` against the official per-player season stats by `ht_id`, emitting the
  experiment's seven classifications and writing nothing. Recommended by the validation
  experiment; deferred as out of scope for the bridge.
- **Carry the official `player_id` in the committed spine.** Add `ht_id` per player in
  `data/havoc_players.json` so validation joins never touch names. The Procopio trap —
  two Procopios on one roster, a surname join comparing Giovanni against Dominick — is
  the argument for it.
- **Game Center as the postgame counter source.** `feed=gc&game_id=…&tab=gamesummary`
  returns final score, per-period scoring, goals with scorer/assist player ids,
  penalties, shots, power plays, goaltender decisions, officials and lineups. It could
  reconcile `current_season` after a final, behind a review PR per Law §7. Explicitly
  not built during the experiment.
- **Goalie milestone windows for saves and shutouts.** `MS_RULES.goalie` tracks GP and W
  only, though the spine already carries `svs` and `so` baselines.
- **Per-game Game Day notes.** `DATA.gameday` is a single set of notes overwritten each
  night, unlike interviews which key on date + opponent. Keying them per game would
  keep a night's notes recoverable.

## Known rough edges — recorded, not urgent

- **Printing mutates saved state.** `pkAutoFit` writes `DATA.secAuto` and calls `save()`,
  so opening the print dialog can change stored section sizes (audit E1).
- **Two auto-fit implementations** with different floors (7 pt and 6 pt).
- **`player.html` / `bios.html` offline** are served `index.html` by the service worker's
  navigate fallback — the wrong page rather than an error (audit E2).
- **Runtime cache growth is unbounded** — the headshot cache is never pruned.
- **`tests/roster_precedence.mjs`** fixture labels Knoxville with team id 5; the real feed
  id is 6 (5 is Evansville). Harmless in a mock, wrong if anything ever keys off it.
- **2025-26 special teams.** `data/season2526_final.json` has no PP%/PK% because the
  official season-44 feed does not serve them; the packet omits rather than invents.

## Rejected — kept here so they are not re-proposed

- Elaborate quiz modes, scoring, levels, leaderboards or any gamification of Learn the
  Rosters (master document Part 1: explicitly cut).
- A second statistics engine, a parallel roster or player database, or preseason
  statistics folded into regular-season counters (bridge assignment, §2 and §15).
- Any build step, bundler or npm-driven asset pipeline (Law §11: the static
  GitHub Pages / no-build architecture is preserved unless there is a compelling,
  stated reason).
