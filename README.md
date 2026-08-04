# Havoc-Broadcast-Hub
HAvoc Broadcasting Hub
# Havoc Game Notes Hub

A single-file broadcast & media toolkit for the Huntsville Havoc (SPHL). No build, no server — one HTML file that runs in any browser.

## What's inside
- **Game packet generator** — cover, Meet the Team (numerical order w/ auto-written bios), scouting report with full Match Up panel, quick facts
- **Game sheet, lineup chart & line card** — printable, per-team colors, all 12 team logos embedded
- **2026-27 schedule** — official 60-game slate + preseason, promo nights, results entry, season calendar (home red / away gray)
- **Standings & league reference** — 2026-27 rule changes, schedule matrix, all-time Havoc leaders, head-to-head
- **Live SPHL data** — one-tap sync from the league's HockeyTech feed (standings, all player/goalie stats, auto-filled final scores)
- **Broadcast call log** — career game tracking for 2025-26 + 2026-27, importable from the call-log app
- **Post-game copy desk** — recap writer from a Game Center paste + booth notes (needs an Anthropic API key)
- **Learn the Roster** — quiz modes for play-by-play memorization

## Important: where your data lives
All data (rosters, results, call log, keys) is saved in the **browser's localStorage — not in this file**. That means:
- Safe to share/publish this file — it contains no personal data or keys
- **Moving between computers/URLs = data does NOT follow.** Use **Settings → Export** on the old copy and Import on the new one
- Back up with Settings → Export regularly. localStorage can be wiped by clearing browser data.

## Run it
Open `index.html` in a browser. That's the whole install.
