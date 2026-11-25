# AIGAMERIA API — Linux/Python backend (FastAPI)

Professional, modular, gameId-isolated REST backend for AIGAMERIA.
Metadata-only: **no video files are ever downloaded or stored** — only text
data, game metadata, button/combos guides, and free direct stream links
resolved through the **8-hour cache (TTL = 28800s)**.

## Structure

```
backend-aigameria/
├── app/
│   ├── main.py            # FastAPI app + startup sync + log rotation
│   ├── config.py          # env config (AIGAMERIA_DB, TTL=28800, disk budget)
│   ├── db.py              # SQLite (stdlib sqlite3, WAL) — metadata tables only
│   ├── cache.py           # 8h cache: get_or_refresh / sweep / stale-if-error
│   ├── isolation.py       # strict gameId isolation + EN language sanitizer
│   ├── routes.py          # REST API (games/coach/media/stage/gamepad/ava)
│   ├── seed_data.py       # per-game topic packs (EN/FA) + combos
│   └── seed_sync.py       # initial + incremental sync (idempotent upserts)
├── pipeline/sync.py       # standalone sync runner (cron/systemd timer)
├── deploy/
│   ├── aigameria-api.service    # systemd unit
│   ├── aigameria-sync.service   # oneshot sync unit
│   ├── aigameria-sync.timer     # 6h incremental sync timer
│   └── (Dockerfile, docker-compose.yml at package root)
└── tests/                 # pytest granular suite
    ├── test_isolation.py        # gameId isolation + pitch guard
    ├── test_cache_ttl.py        # TTL=28800, hit/refresh/stale/fallback
    ├── test_no_heavy_files.py   # no video files written to disk
    ├── test_sync_incremental.py # idempotent + incremental updates
    └── test_language_errors.py  # EN purity, FA output, error codes
```

## REST API (all `/api/v1`)

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/health` | service + TTL info |
| `GET /api/v1/games?lang=en\|fa` | game list (isolated) |
| `GET /api/v1/games/{game_id}?lang=` | game + topic packs |
| `GET /api/v1/coach/{game_id}/topics/{topic_id}?lang=` | topic-locked tips |
| `GET /api/v1/media/stream/{game_id}?topic_id=` | 8h-cached direct stream |
| `GET /api/v1/stage/{game_id}?topic_id=` | stage/projector data (pitch guard) |
| `GET /api/v1/gamepad/{game_id}?lang=` | button/combos data |
| `GET /api/v1/ava/{game_id}?topic_id=&lang=` | AVA hologram coach state |

Laws enforced in code + tests: football data can never enter a non-football
response; unknown game → isolated 404; missing topic → isolated empty for the
SAME game; EN output never contains Persian script; cache TTL is exactly 28800s;
no video file is ever written to disk.

## Run on the Linux server (one path)

```bash
# 1. upload the folder to the server, e.g. /opt/aigameria/backend-aigameria
cd /opt/aigameria/backend-aigameria
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt

# 2. systemd service + sync timer
sudo cp deploy/aigameria-api.service deploy/aigameria-sync.service deploy/aigameria-sync.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now aigameria-api aigameria-sync.timer
curl http://127.0.0.1:8090/api/v1/health
```

Or with Docker: `docker compose up -d --build` (DB persisted in the `api-data` volume).

## Run tests (one command)

```bash
cd backend-aigameria && python -m pytest tests/ -v
```

The DB is created automatically at `AIGAMERIA_DB` (default `.data/aigameria_api.sqlite`)
on the server during startup sync; sync is idempotent and incremental (dedupe_key
upserts) and runs every 6h via the systemd timer.
