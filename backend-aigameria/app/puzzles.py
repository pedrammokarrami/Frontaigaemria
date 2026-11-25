"""Puzzle node knowledge: exact, sourced step-by-step solutions per game.

Nodes live in the puzzle_nodes table (idempotent upserts), seeded from
verified public walkthroughs (gamerguides.com / IGN / eurogamer — content
paraphrased, sources recorded per node). The analyzer matches OCR text +
hints against node keywords and returns the exact logic, never filler.
"""
import json
import logging
import re
from typing import Any

from . import isolation
from .db import get_db

log = logging.getLogger("aigameria.puzzles")

SCHEMA = """
CREATE TABLE IF NOT EXISTS puzzle_nodes (
  dedupe_key TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  chapter TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  keywords TEXT NOT NULL DEFAULT '[]',   -- JSON array of match tokens
  steps_en TEXT NOT NULL,                -- JSON array of ordered steps
  buttons_en TEXT NOT NULL DEFAULT '[]', -- JSON array of platform button prompts
  source TEXT NOT NULL DEFAULT 'community',
  updated_at TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_puzzle_game ON puzzle_nodes(game_id);
"""

GAME_HINT_TOKENS: dict[str, list[str]] = {
    "uncharted-4": ["uncharted", "nathan drake", "nate", "sam drake", "henry avery", "libertalia", "a thief's end"],
    "god-of-war": ["god of war", "kratos", "atreus", "mimir", "nornir"],
    "the-last-of-us-2": ["the last of us", "ellie", "abby", "clicker"],
    "red-dead-2": ["red dead", "arthur morgan", "rdr2", "dutch van der linde"],
    "elden-ring": ["elden ring", "grace", "runes", "dectus", "erdtree"],
    "resident-evil-4": ["resident evil", "leon kennedy", "ganado", "los illuminados"],
    "cs2": ["counter-strike", "cs2", "global offensive", "crosshair", "mirage", "dust2"],
    "fc27": ["fc 27", "ultimate team", "career mode", "fifa"],
    "dota2": ["dota", "radiant", "dire", "ancient"],
    "warzone": ["warzone", "verdansk", " Gulag"],
}


def ensure_schema() -> None:
    get_db().executescript(SCHEMA)
    get_db().commit()


def upsert_nodes(nodes: list[dict[str, Any]]) -> int:
    ensure_schema()
    import time

    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    n = 0
    for node in nodes:
        game_id = str(node.get("game_id", "")).lower().strip()
        title = str(node.get("title", "")).strip()
        steps = node.get("steps_en") or []
        if not game_id or not title or not steps:
            continue
        if isolation.is_football_game(game_id) is False and any(
            m in json.dumps(steps).lower() for m in ("4-3-3", "real madrid", "finesse", "winger", "goalkeeper")
        ):
            log.warning("football vocab in non-football puzzle node %s — skipped", title[:40])
            continue
        key = f"puzzle::{game_id}::{title.lower().replace(' ', '-')[:60]}"
        get_db().execute(
            "INSERT INTO puzzle_nodes (dedupe_key, game_id, chapter, title, keywords, steps_en, buttons_en, source, updated_at) "
            "VALUES (?,?,?,?,?,?,?,?,?) "
            "ON CONFLICT(dedupe_key) DO UPDATE SET chapter=excluded.chapter, title=excluded.title, "
            "keywords=excluded.keywords, steps_en=excluded.steps_en, buttons_en=excluded.buttons_en, "
            "source=excluded.source, updated_at=excluded.updated_at",
            (
                key, game_id, node.get("chapter", ""), title,
                json.dumps(node.get("keywords", []), ensure_ascii=False),
                json.dumps(steps, ensure_ascii=False),
                json.dumps(node.get("buttons_en", []), ensure_ascii=False),
                node.get("source", "community"), now,
            ),
        )
        n += 1
    get_db().commit()
    return n


def detect_game(text: str) -> tuple[str, float]:
    """Token-overlap game identification from OCR/hint text."""
    blob = " " + re.sub(r"\s+", " ", text.lower()) + " "
    best, best_hits = "", 0
    for game_id, tokens in GAME_HINT_TOKENS.items():
        hits = sum(1 for t in tokens if t.lower() in blob)
        if hits > best_hits:
            best, best_hits = game_id, hits
    if not best:
        return "", 0.0
    return best, min(1.0, 0.55 + 0.15 * best_hits)


def resolve_puzzle(game_id: str, text: str) -> dict[str, Any]:
    """Best puzzle node for game_id + screen text (keyword scoring)."""
    ensure_schema()
    rows = get_db().execute("SELECT * FROM puzzle_nodes WHERE game_id = ?", (game_id,)).fetchall()
    blob = text.lower()
    best = None
    best_score = 0
    for row in rows:
        kws = json.loads(row["keywords"])
        score = sum(1 for k in kws if k.lower() in blob)
        if score > best_score:
            best, best_score = row, score
    if best is None and rows:
        best = rows[0]  # single-node games resolve directly
        best_score = 0
    if best is None:
        return {"resolved": False}
    return {
        "resolved": True,
        "puzzle_id": best["dedupe_key"],
        "title": best["title"],
        "chapter": best["chapter"],
        "steps_en": json.loads(best["steps_en"]),
        "buttons_en": json.loads(best["buttons_en"]),
        "source": best["source"],
        "confidence": round(min(1.0, 0.5 + 0.15 * best_score), 2),
    }


def nodes_for_game(game_id: str) -> list[dict[str, Any]]:
    ensure_schema()
    rows = get_db().execute("SELECT * FROM puzzle_nodes WHERE game_id = ?", (game_id,)).fetchall()
    return [
        {
            "puzzle_id": r["dedupe_key"], "title": r["title"], "chapter": r["chapter"],
            "steps_en": json.loads(r["steps_en"]), "buttons_en": json.loads(r["buttons_en"]),
            "source": r["source"],
        }
        for r in rows
    ]
