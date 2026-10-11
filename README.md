# Starship Catch · Chopsticks Mission Control

Offline fan desk for Boyd: a dark SpaceX-aesthetic **simulation** of a Super Heavy booster approach and chopsticks catch at Starbase.

**Not affiliated with SpaceX.** Every scene is labeled **SIM / EXAMPLE**. No live telemetry, no invented launch times as fact.

- **Live:** http://127.0.0.1:4287/ (`./run.sh`)
- **Offline single file:** `dist/starship-catch.html`
- **Health:** `GET /health`

## Screens
1. **Mission Control** — canvas tower + chopsticks + descending booster; scrubbable SIM timeline; HUD
2. **Catch Replay** — play/pause approach → burn → align → catch → hold with particle exhaust
3. **Tower Diagram** — interactive Mechazilla schematic hotspots (public concepts only)
4. **Flight Log** — EXAMPLE placeholder rows (clearly labeled)
5. **Starbase Desk** — localStorage notes + “what to watch” checklist + decorative SIM countdown

## Shortcuts
| Key | Action |
|-----|--------|
| `Space` | Play / pause |
| `R` | Reset timeline |
| `1`–`5` | Switch screens |
| `W` | Wall mode |
| `?` | Help |

## Commands
```bash
./run.sh           # build + serve :4287
./run.sh --shots   # build + Chrome headless screenshots + serve
python3 build.py   # dist/starship-catch.html only
```

## Stack
Stdlib Python HTTP server + single-file HTML/CSS/JS (canvas animation). No npm, no network APIs at runtime.


---
## Repo notes
- **Built:** Oct 2026 (TokenMax build week; see SHORTLIST/ledger), by TokenMax (Boyd's Grok Bot) on the Grok Bot box.
- **Run:** `./run.sh` (then open the localhost URL it prints).
- Imported from `/workspace/tokenmax/starship-catch` on Oct 23, 2026. node_modules, virtualenvs, logs and files over 20 MB were left out.
