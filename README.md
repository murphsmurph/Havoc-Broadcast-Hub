# Havoc-Broadcast-Hub
HAvoc Broadcasting Hub
# Havoc Game Notes Hub

A single-file broadcast & media toolkit for the Huntsville Havoc (SPHL). No build, no server — one HTML file that runs in any browser.

## What's inside
- **Game packet generator** — pro media-notes standard: cover (news w/ auto-draft, standings, 4-column leaders, media contact), Meet the Team, Hockey Operations, Elite Prospects career-stat pages, scouting report (series history + league-ranked Match Up), quick facts, season splits + "last time it happened", game-by-game log, roster + pronunciation guide, franchise records, blank scoring worksheets, and the dense game sheet — with a section picker and Full/Booth presets. Derived pages compute from the per-game log (auto-filled from results + attendance; shots/PP/fights hand-entered on the Schedule tab)
- **Game sheet, lineup chart & line card** — printable, per-team colors, all 12 team logos embedded
- **2026-27 schedule** — official 60-game slate + preseason, promo nights, results entry, season calendar (home red / away gray)
- **Standings & league reference** — 2026-27 rule changes, schedule matrix, all-time Havoc leaders, head-to-head, plus a seeded **2026 season review & New Teams 2026-27** card: the President's Cup final and full playoff bracket, the 12-team table (2025-26 records, finishes, 2026-27 head coaches) and FPHL franchise files for Athens and Pee Dee. Every block is editable in place with a one-click restore, and a red • marks anything still unverified. The venue reference covers all 12 buildings
- **Franchise files** — a deep, researched file on each of the 12 clubs: founding and arena, season-by-season table, all-time record, championships and Finals, all-time leaders, records and awards, attendance, retired numbers and the current coach, plus a **running "Havoc all-time vs. them"** line that starts from the published baseline and accumulates from your own game log, and a per-team storylines box pre-filled with cross-team notes. Every section is editable with a restore, sourcing caveats travel with the text (a red • flags computed, single-sourced or disputed numbers), and nothing here is ever overwritten by a sync
- **Live scorebar** — league-wide SPHL scores (recent finals, tonight, week ahead) that update every minute while games are on, every 15 minutes otherwise, and pause while the tab is hidden; standings and stats also quietly refresh hourly
- **Keyless daily-report baseline** — a nightly GitHub Action (`.github/workflows/sphl-daily.yml`) fetches the league's public daily report (no key needed), parses it with `js/daily-report-parser.js`, and commits `data/sphl-daily.json`; the site loads it as its data floor with a source badge. The same parser powers manual import: open the report, save the page, upload the .html (or paste it) — per-section parse summary included, works offline. Live feed data overlays this when available
- **Live SPHL data** — one-tap sync from the league's HockeyTech feed (standings, all player/goalie stats, full schedule + auto-filled final scores, and every team's roster). Works both hosted (GitHub Pages etc.) and opened as a local file; the feed key is auto-detected, and everything is saved to this browser after each sync. The latest daily report can also always be pasted in by hand as a manual fallback — same parsed data either way
- **Signed-sheet roster with feed reconcile** — the club's own 2026-27 signed-players sheet is the roster's source of truth in preseason. Jersey numbers from the sheet outrank the league feed; when the feed disagrees, both numbers show with a one-click resolve. Players the feed adds are flagged for confirmation, players on the sheet are never dropped by a sync, and anyone left over from a prior season is parked as "unconfirmed" — visible for review, out of the packet — instead of deleted. A status panel on the Rosters tab reports which signings the league feed has published yet
- **Two bios per Havoc player, written by you** — a long **media bio** used on the Game Packet pages and a short **broadcast bio** used on the lineup chart & game sheet; opponent players carry just a broadcast bio. Nothing is auto-written. Captains are marked C / A in the player editor and their letter shows everywhere names print
- **Meet the Hockey Operations Team** — head coach, assistant coach, GM and equipment manager (names + bios, user-filled on the Roster tab) print as their own Game Packet page
- **EP Widgets tab** — live embedded Elite Prospects widgets (league standings, scoring & goalie leaders, schedule/results, and a career card for any mapped player), styled in Havoc red, complementing the feed + daily-report data
- **Elite Prospects profile links** — a weekly GitHub Action (`.github/workflows/ep-data.yml`) matches every SPHL player to Elite Prospects via the official EP API (name + date-of-birth matching, cached forever, hand-fixable via `data/ep-overrides.json`) and commits `data/ep-players.json`; every roster name links to the player's EP page (EP search when unmatched). One-time setup in `data/README.md`
- **Broadcast call log** — career game tracking for 2025-26 + 2026-27, importable from the call-log app
- **Post-game copy desk** — a formatter, not a generator: you write each section (headline, lede, body, quotes, notes), it assembles the finished report in one fixed house style with a one-click Copy; a Game Center paste can auto-fill the score/date/venue facts
- **Learn the Roster** — quiz modes for play-by-play memorization

## Important: where your data lives
All data (rosters, results, call log, keys) is saved in the **browser's localStorage — not in this file**. That means:
- Safe to share/publish this file — it contains no personal data or keys
- **Moving between computers/URLs = data does NOT follow.** Use **Settings → Export** on the old copy and Import on the new one
- Back up with Settings → Export regularly. localStorage can be wiped by clearing browser data.
- A rolling **auto-backup** (everything except logos) is also kept in the browser — Settings → Restore auto-backup brings it back if something gets overwritten.

## Run it
Open `index.html` in a browser. That's the whole install.
