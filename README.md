# Havoc Broadcast Hub

> **[`HAVOC_HUB_MASTER_DOCUMENT.md`](HAVOC_HUB_MASTER_DOCUMENT.md) is the controlling document for all work in this repo. Where any other file or instruction disagrees with it, it wins.**

Broadcast and media toolkit for the Huntsville Havoc (SPHL) — game packets, booth
call sheets, line cards and a live Game Day view. No build step and no server:
static files that run from GitHub Pages or straight off disk.

## Operating rhythm (master document Part 5)

- **Nightly:** Actions refresh the daily report and every SPHL roster under the
  precedence rules. The roster commit is gated by the roster-precedence test, and a
  daily report older than your live sync is held, never applied over it.
- **Game week:** prose is authored in Claude sessions and committed as JSON
  (`data/bios.json`, `data/matchups.json`); the Hub renders it verbatim.
- **Game night:** bump `current_season` counters and the team record in
  `data/havoc_players.json` (~30 seconds), fill the lines, run one Game Day Refresh,
  call the game from the **Game Day** tab.
- **Weekly in-season:** the EP refresh Action opens a PR (~17 API calls of the
  1,000/month plan); review the diff and merge.
- **Season end:** rollover — fold `current_season` into `seasons[]`, recompute the
  baselines, zero the counters, and **update the anchors** in
  `tests/anchor_reconstruction.mjs`.

## What it does

- **Game packet** — cover, scouting report, quick facts, season splits, game log,
  roster and pronunciation guide, franchise records, worksheets and a dense game
  sheet, with a section picker and Full/Booth presets. Every page is exactly one
  sheet, so the PDF cannot paginate differently from the preview.
- **Booth pages** — per-team folder call sheets in the club's own colours, lineup
  chart, line card, and a Game Day view built for a phone at arm's length.
- **Learn the Rosters** — jersey-first study drill over the same canonical rosters
  and lines the packet prints.
- **Career and milestone tracking** — milestone boards, the all-time franchise race,
  the staff board and a franchise record watch, all off committed data.
- **Live SPHL data** — one Game Day Refresh pulls standings, player and goalie stats,
  schedule, results and every team's roster, with the season it used named on screen
  and on every printed page.
- **Prior-season bridge** — before 2026-27 statistics exist, the Hub prints last
  season's final numbers and entering-season career totals, always labelled as such.

## How it is built

Static HTML, CSS and plain classic scripts — no bundler, no npm, no framework.
`index.html` is the shell and markup; the application lives in `css/hub.css` and the
`js/` modules, loaded in order with `js/boot.js` last:

| module | responsibility |
|---|---|
| `data.js` | the store, team registries, shared helpers |
| `logos.js` · `reference.js` | crests; league and franchise reference data |
| `feeds.js` | HockeyTech transport, season resolution, stale-season guard, EP, daily report |
| `milestones.js` | career totals, milestone boards, franchise race, record watch |
| `packet.js` | everything that composes a printed page |
| `print.js` | how pages fit on paper — sizing, block flow, auto-fit |
| `booth.js` | scorebar, Game Day, Learn the Rosters |
| `ui.js` | the remaining screen surfaces |
| `boot.js` | every side effect; must stay last |

Career math is canonical in `js/career-math.js`, shared with `player.html`.
`tests/` holds four plain-node scripts covering seven checks, run by an Action on
every PR.

## Where the data lives

Authored content and every number that reaches air live in **committed JSON** under
`data/` — that is the source of truth, not the browser. localStorage holds only
game-night counters and local preferences, backed by an auto-backup and
Settings → Export.

Unannounced club material never enters this repository: it is public, and
`*bios*.json` is gitignored for that reason. `robots.txt` and a `noindex` tag keep the
site out of search results, which is not the same as private.

## Run it

Open `index.html` in a browser, or serve the folder. That is the whole install.
