# Havoc-Broadcast-Hub
HAvoc Broadcasting Hub
# Havoc Game Notes Hub

A single-file broadcast & media toolkit for the Huntsville Havoc (SPHL). No build, no server — one HTML file that runs in any browser.

## What's inside
- **Game packet generator** — cover, Meet the Team (numerical order w/ auto-written bios), scouting report with full Match Up panel, quick facts
- **Game sheet, lineup chart & line card** — printable, per-team colors, all 12 team logos embedded
- **2026-27 schedule** — official 60-game slate + preseason, promo nights, results entry, season calendar (home red / away gray)
- **Standings & league reference** — 2026-27 rule changes, schedule matrix, all-time Havoc leaders, head-to-head
- **Live scorebar** — league-wide SPHL scores (recent finals, tonight, week ahead) that update every minute while games are on, every 15 minutes otherwise, and pause while the tab is hidden; standings and stats also quietly refresh hourly
- **Keyless daily-report baseline** — a nightly GitHub Action (`.github/workflows/sphl-daily.yml`) fetches the league's public daily report (no key needed), parses it with `js/daily-report-parser.js`, and commits `data/sphl-daily.json`; the site loads it as its data floor with a source badge. The same parser powers manual import: open the report, save the page, upload the .html (or paste it) — per-section parse summary included, works offline. Live feed data overlays this when available
- **Live SPHL data** — one-tap sync from the league's HockeyTech feed (standings, all player/goalie stats, full schedule + auto-filled final scores, and every team's roster). Works both hosted (GitHub Pages etc.) and opened as a local file; the feed key is auto-detected, and everything is saved to this browser after each sync. The latest daily report can also always be pasted in by hand as a manual fallback — same parsed data either way
- **Two bios per Havoc player, written by you** — a long **media bio** used on the Game Packet pages and a short **broadcast bio** used on the lineup chart & game sheet; opponent players carry just a broadcast bio. Nothing is auto-written. Captains are marked C / A in the player editor and their letter shows everywhere names print
- **Meet the Hockey Operations Team** — head coach, assistant coach, GM and equipment manager (names + bios, user-filled on the Roster tab) print as their own Game Packet page
- **Elite Prospects profile links** — a weekly GitHub Action (`.github/workflows/ep-data.yml`) matches every SPHL player to Elite Prospects via the official EP API (name + date-of-birth matching, cached forever, hand-fixable via `data/ep-overrides.json`) and commits `data/ep-players.json`; every roster name links to the player's EP page (EP search when unmatched). One-time setup in `data/README.md`
- **Broadcast call log** — career game tracking for 2025-26 + 2026-27, importable from the call-log app
- **Post-game copy desk** — recap writer from a Game Center paste + booth notes (needs an Anthropic API key)
- **Learn the Roster** — quiz modes for play-by-play memorization

## Important: where your data lives
All data (rosters, results, call log, keys) is saved in the **browser's localStorage — not in this file**. That means:
- Safe to share/publish this file — it contains no personal data or keys
- **Moving between computers/URLs = data does NOT follow.** Use **Settings → Export** on the old copy and Import on the new one
- Back up with Settings → Export regularly. localStorage can be wiped by clearing browser data.
- A rolling **auto-backup** (everything except logos) is also kept in the browser — Settings → Restore auto-backup brings it back if something gets overwritten.

## Run it
Open `index.html` in a browser. That's the whole install.
