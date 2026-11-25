# AIGAMERIA Content Pipeline (generator.py)

Zero-cost web ingestion → strict-JSON content bundle for the AIGAMERIA
frontend (192.168.1.50). Stdlib-only Python 3.10+. No local LLM required;
Ollama is optional and failure-safe.

## What it produces

`data/live/data.json` (and a copy at `public/data/api-data.json`, served by
the app at `/data/api-data.json`) with this schema per game:

```jsonc
{
  "generated_at": "...",
  "games": {
    "fc27": {
      "cards":            [ { id, category, source_tag, title, summary, language, url, fetched_at } ],
      "coach_session":    { title, ovr, metrics, suggested_questions, tactical_tips },
      "formation_board":  { team, formation, style, description, players[{name,number,role,x,y}], tactical_arrows },
      "controller_combos":{ game, drill_name, duration_ms, platforms[], timeline_inputs[{t_ms,buttons,note}] }
    }
  }
}
```

## Sources (all free, no API keys)

* Reddit JSON hot feeds (`reddit.com/r/<sub>/hot.json`)
* Steam news API (`api.steampowered.com` — for titles with an appid)
* DuckDuckGo HTML endpoint (`html.duckduckgo.com/html/?q=`)
* Fallback: the app's own `knowledge_cards` SQLite store (already-harvested
  real content, zero network)

Optional Ollama (qwen2.5:1.5b/3b on `127.0.0.1:11434`): only used to summarize
fetched snippets, temperature 0.1, JSON mode, output re-parsed & merged — any
failure falls back to rule-based extraction.

## Run

```bash
python3 pipeline/generator.py                 # full run, all games
python3 pipeline/generator.py --game fc27     # one game
python3 generator.py --check-only             # validate existing bundle
```

On success it atomically replaces `data/live/data.json` (previous file kept as
`data.json.bak`). Publication only happens **after** schema validation passes,
so the frontend never sees broken JSON.

## Linux scheduling (zero-lag serving)

### cron (simplest)

```cron
# every 6 hours + on-boot catch-up
15 */6 * * * cd /srv/aigameria && python3 pipeline/generator.py >> /var/log/aigameria-pipeline.log 2>&1
@reboot sleep 90 && cd /srv/aigameria && python3 pipeline/generator.py >> /var/log/aigameria-pipeline.log 2>&1
```

### systemd timer (preferred)

`/etc/systemd/system/aigameria-pipeline.service`:

```ini
[Unit]
Description=AIGAMERIA content pipeline (web -> validated JSON)
After=network-online.target

[Service]
Type=oneshot
WorkingDirectory=/srv/aigameria
ExecStart=/usr/bin/python3 pipeline/generator.py
Nice=10
IOSchedulingClass=idle
# tiny footprint: no GPU, stdlib only, ~30-60 MB RSS
```

`/etc/systemd/system/aigameria-pipeline.timer`:

```ini
[Unit]
Description=Run AIGAMERIA pipeline every 6 hours

[Timer]
OnBootSec=2min
OnUnitActiveSec=6h
AccuracySec=5min

[Install]
WantedBy=timers.target
```

Enable:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now aigameria-pipeline.timer
systemctl list-timers aigameria-pipeline*
```

## Frontend consumption

The bundle is served at `/data/api-data.json` (static, cached by the app
server). Fetch it client-side with `cache: 'no-store'` per section, or wire it
into `curatedTrends` — the schema's `cards` section matches the lobby card
fields (`id/category/title/summary/source_tag`), and `formation_board` matches
the analyz stage payload. A `--check-only` health probe is cron-safe.

## Resource footprint

* Stdlib only; RSS ≈ 25-40 MB; full run ≈ 10-30 s (network permitting).
* Every source has an independent timeout (10-12 s) — total worst case stays
  bounded even offline (falls back to the KB store).
* Deterministic output: identical inputs → identical JSON (no hallucination).
