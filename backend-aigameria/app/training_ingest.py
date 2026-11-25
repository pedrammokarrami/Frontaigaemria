"""Multi-source gaming training ingestion → structured training_records.

Source: the Node app's knowledge store (aipetros.sqlite knowledge_cards —
3239+ harvested records from Reddit/Steam/DDG/guide archives), plus any
catalog JSON packs dropped into ingest/ by future crawlers.

Rules honored: strict gameId isolation (records keep their game_id, verified
at query time too), no video binaries ever (links only), idempotent upserts
by dedupe_key, resumable via a stored cursor, batched, disk-guarded.
"""
import hashlib
import json
import logging
import os
import re
import sqlite3
import time
from pathlib import Path
from typing import Any

from . import config
from .db import get_db
from .disk_guard import can_ingest, enforce_budget
from .isolation import is_football_game

log = logging.getLogger("aigameria.ingest")

SOURCE_DB_ENV = "AIGAMERIA_NODE_DB"
BATCH_SIZE = 300

TRAINING_SCHEMA = """
CREATE TABLE IF NOT EXISTS training_records (
  dedupe_key TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  genre TEXT NOT NULL DEFAULT 'unknown',
  platforms TEXT NOT NULL DEFAULT '[\"pc\"]',
  layer TEXT NOT NULL,             -- controls|tactics|maps|glitch|mechanic|qa|links
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'knowledge_store',
  url TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_training_game ON training_records(game_id, layer);
CREATE TABLE IF NOT EXISTS ingest_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
"""

LAYER_RX = {
    "glitch": re.compile(r"glitch|exploit|bug|cheat", re.I),
    "controls": re.compile(r"\b(button|key|press|hold|combo|input|bind|touch|swipe)\b|L1|R1|LB|RB|RT|LT|A\+D|counter.?strafe", re.I),
    "maps": re.compile(r"\b(map|zone|callout|sightline|a-site|b-site|mid\b|spawn)\b", re.I),
    "tactics": re.compile(r"\b(tactic|strategy|lineup|formation|economy|rotation|setup|push|retake|execute|build order|macro|counter.?play|position|angle)\b", re.I),
    "links": re.compile(r"https?://", re.I),
}

FOOTBALL_MARKER_RX = re.compile(
    r"4-3-3|4-2-3-1|real madrid|mbapp|vinicius|bellingham|haland|haaland|finesse|"
    r"goalkeeper|fullback|winger|striker|penalt", re.I,
)


def ensure_schema() -> None:
    get_db().executescript(TRAINING_SCHEMA)
    get_db().commit()


def classify(kind: str, title: str, body: str) -> str:
    blob = f"{title} {body}"
    for layer in ("glitch", "controls", "maps", "tactics"):
        if LAYER_RX[layer].search(blob):
            return layer
    kind_map = {"glitch": "glitch", "cheat": "glitch", "trick": "tactics", "question": "qa", "qa": "qa"}
    return kind_map.get(kind, "qa")


def dedupe(game_id: str, layer: str, title: str, body: str) -> str:
    h = hashlib.sha1(f"{game_id}::{layer}::{title}::{body[:300]}".encode("utf-8", "replace")).hexdigest()
    return f"{game_id}::{layer}::{h[:16]}"


def _isolate_ok(game_id: str, title: str, body: str) -> bool:
    """Football vocabulary can never enter a non-football game's record."""
    if is_football_game(game_id):
        return True
    return not FOOTBALL_MARKER_RX.search(f"{title} {body}")


def ingest_source_db(limit: int = 0) -> dict[str, Any]:
    """Ingest knowledge_cards from the Node app store. Resumable: stores the
    last source rowid in ingest_state; re-runs pick up only newer rows and
    upsert (idempotent — no duplicates, no data loss)."""
    ensure_schema()
    src_path = os.environ.get(SOURCE_DB_ENV, "/opt/aigameria/.data/aipetros.sqlite")
    if not Path(src_path).exists():
        return {"status": "source-missing", "added": 0, "updated": 0}
    src = sqlite3.connect(f"file:{src_path}?mode=ro", uri=True)
    src.row_factory = sqlite3.Row
    state_row = get_db().execute("SELECT value FROM ingest_state WHERE key = 'last_rowid'").fetchone()
    last_rowid = int(state_row["value"]) if state_row else 0

    clause = "WHERE id > ?" if last_rowid else ""
    params = (last_rowid,) if last_rowid else ()
    limit_clause = f" LIMIT {int(limit)}" if limit else ""
    rows = src.execute(
        f"SELECT id, game_id, kind, title, body, source, url FROM knowledge_cards {clause} ORDER BY id ASC {limit_clause}",
        params,
    ).fetchall()

    added = updated = skipped = 0
    max_rowid = last_rowid
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    batch = []
    for row in rows:
        max_rowid = max(max_rowid, row["id"])
        game_id = str(row["game_id"] or "").lower().strip()
        title = (row["title"] or "").strip()
        body = (row["body"] or "").strip()
        if not game_id or not body:
            skipped += 1
            continue
        if not _isolate_ok(game_id, title, body):
            skipped += 1
            continue
        layer = classify(row["kind"] or "", title, body)
        key = dedupe(game_id, layer, title, body)
        gmeta = get_db().execute(
            "SELECT genre, platforms FROM games WHERE game_id = ?", (game_id,)
        ).fetchone()
        genre = gmeta["genre"] if gmeta else "unknown"
        platforms = gmeta["platforms"] if gmeta else '["pc"]'
        batch.append((
            key, game_id, genre, platforms, layer, title, body,
            str(row["source"] or "knowledge_store"), row["url"] or row["source"] or "", now,
        ))
        if len(batch) >= BATCH_SIZE:
            added += _flush(batch)
            batch = []
            if not can_ingest():
                log.warning("disk budget reached — pausing ingestion")
                break
    added += _flush(batch)
    get_db().execute(
        "INSERT INTO ingest_state (key, value) VALUES ('last_rowid', ?) "
        "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        (str(max_rowid),),
    )
    get_db().commit()
    report = enforce_budget()
    report.update({"status": "ok", "seen": len(rows), "added": added, "updated": updated, "skipped": skipped,
                   "cursor": max_rowid})
    log.info("ingest pass: %s", {k: report[k] for k in ("seen", "added", "skipped", "cursor")})
    return report


def ingest_catalog_pack(path: str) -> dict[str, Any]:
    """Ingest a JSON training pack: [{game_id, layer, title, body, url?, platforms?, genre?}].
    Items with layer "puzzle" (steps_en) are also upserted into puzzle_nodes."""
    ensure_schema()
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    puzzle_items = [it for it in data if it.get("layer") == "puzzle" and it.get("steps_en")]
    if puzzle_items:
        from . import puzzles as _puzzles

        _puzzles.upsert_nodes(puzzle_items)
    added = 0
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    batch = []
    for item in data:
        game_id = str(item.get("game_id", "")).lower().strip()
        body = str(item.get("body", "")).strip()
        if not game_id or not body or not _isolate_ok(game_id, item.get("title", ""), body):
            continue
        layer = item.get("layer") or classify(item.get("kind", ""), item.get("title", ""), body)
        key = dedupe(game_id, layer, item.get("title", ""), body)
        gmeta = get_db().execute("SELECT genre, platforms FROM games WHERE game_id = ?", (game_id,)).fetchone()
        batch.append((
            key, game_id,
            item.get("genre") or (gmeta["genre"] if gmeta else "unknown"),
            json.dumps(item.get("platforms")) if item.get("platforms") else (gmeta["platforms"] if gmeta else '["pc"]'),
            layer, item.get("title", ""), body, item.get("source", "pack"), item.get("url", ""), now,
        ))
        if len(batch) >= BATCH_SIZE:
            added += _flush(batch)
            batch = []
    added += _flush(batch)
    return {"status": "ok", "added": added}


def _flush(batch: list[tuple]) -> int:
    if not batch:
        return 0
    before = get_db().execute(
        f"SELECT COUNT(*) c FROM training_records WHERE dedupe_key IN ({','.join('?' * len(batch))})",
        [b[0] for b in batch],
    ).fetchone()["c"]
    get_db().executemany(
        "INSERT INTO training_records (dedupe_key, game_id, genre, platforms, layer, title, body, "
        "source, url, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) "
        "ON CONFLICT(dedupe_key) DO UPDATE SET title=excluded.title, body=excluded.body, "
        "source=excluded.source, url=excluded.url, updated_at=excluded.updated_at",
        batch,
    )
    get_db().commit()
    return len(batch) - before
