# EP data files (built by the weekly GitHub Action)

- `ep-players.json` — Elite Prospects career data keyed by **HockeyTech
  player ID**. Built by `.github/workflows/ep-data.yml` running
  `scripts/build-ep-data.mjs`. The site loads this same-origin file and
  merges it into rosters (career bio bullets + EP profile links). Do not
  edit by hand — it gets regenerated.
- `sphl-ep-map.json` — the cached HockeyTech-ID → EP-ID mapping, plus an
  `unmatched` section listing players the matcher would not guess at
  (with their candidate lists). Cached matches are never re-searched.
- `ep-overrides.json` — **hand-edited** fixes for unmatched players:
  `{ "<hockeytech_player_id>": <ep_player_id> }`. Overrides always win.
  Find the HockeyTech ID in `sphl-ep-map.json`'s `unmatched` section and
  the EP ID in the player's eliteprospects.com URL.

## One-time setup

1. Sign up at https://developer.eliteprospects.com/ (free tier).
2. Repo Settings → Secrets and variables → Actions → new **secret**
   `EP_API_KEY` with the key. Never commit it.
3. Repo Settings → Actions → General → Workflow permissions →
   "Read and write permissions" (so the workflow can push the JSONs).
4. Actions tab → "Update Elite Prospects data" → Run workflow.

No key? The workflow still runs in Plan-B mode: it applies
`ep-overrides.json` entries as profile links and makes zero EP API calls;
the site links every other player name to an EP search page.
