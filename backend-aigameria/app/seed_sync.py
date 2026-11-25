"""Initial + incremental sync pipeline.

- Upsert by dedupe_key (game_id + topic_id) → re-runs never duplicate or
  destroy existing rows; only new/changed records are written.
- Gamepad combos sync the same way.
- Expired cache sweep + log rotation keep the 20 GiB server disk light.
"""
import json
import logging
import os
import time
from pathlib import Path
from typing import Any

from . import config, cache as cache_mod
from .db import get_db
from .seed_data import MOBILE_PC_CATALOG, STORY_CATALOG, SEED_COMBOS, SEED_GAMES, SEED_TOPICS

log = logging.getLogger("aigameria.sync")


def _upsert_game(g: dict[str, Any]) -> bool:
    cur = get_db().execute(
        "SELECT 1 FROM games WHERE game_id = ?", (g["game_id"],)
    ).fetchone()
    platforms_raw = g.get("platforms", ["pc"])
    platforms = platforms_raw if isinstance(platforms_raw, str) else json.dumps(platforms_raw, ensure_ascii=False)
    if cur:
        get_db().execute(
            "UPDATE games SET name_en=?, name_fa=?, realm=?, is_football=?, rating_label_en=?, "
            "rating_value=?, stat_one_label_en=?, stat_one_value=?, stat_two_label_en=?, "
            "stat_two_value=?, accent_color=?, genre=COALESCE(NULLIF(?, ''), genre), "
            "platforms=COALESCE(NULLIF(?, '[]'), platforms), "
            "avatar_override=COALESCE(?, avatar_override) WHERE game_id=?",
            (
                g["name_en"], g["name_fa"], g["realm"], g["is_football"],
                g["rating_label_en"], g["rating_value"], g["stat_one_label_en"],
                g["stat_one_value"], g["stat_two_label_en"], g["stat_two_value"],
                g["accent_color"], g.get("genre", ""), platforms,
                g.get("avatar_override"), g["game_id"],
            ),
        )
        return False
    get_db().execute(
        "INSERT INTO games (game_id, name_en, name_fa, realm, is_football, rating_label_en, "
        "rating_value, stat_one_label_en, stat_one_value, stat_two_label_en, stat_two_value, "
        "accent_color, genre, platforms, avatar_override) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (
            g["game_id"], g["name_en"], g["name_fa"], g["realm"], g["is_football"],
            g["rating_label_en"], g["rating_value"], g["stat_one_label_en"],
            g["stat_one_value"], g["stat_two_label_en"], g["stat_two_value"],
            g["accent_color"], g.get("genre", "unknown"), platforms,
            g.get("avatar_override"),
        ),
    )
    return True


def _upsert_topic(t: dict[str, Any]) -> bool:
    dedupe_key = f"{t['game_id']}::{t['topic_id']}"
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    existing = get_db().execute(
        "SELECT label_en, tips_en, video_url FROM topics WHERE dedupe_key = ?", (dedupe_key,)
    ).fetchone()
    row_vals = (
        dedupe_key, t["game_id"], t["topic_id"], t["label_en"], t["label_fa"],
        t["headline_en"], t["headline_fa"],
        json.dumps(t["tips_en"], ensure_ascii=False), json.dumps(t["tips_fa"], ensure_ascii=False),
        t["video_url"], t["poster_url"], t["stage_mode"], t["stage_title"],
        t["stage_subtitle"], json.dumps(t["stage_markers"], ensure_ascii=False), now,
    )
    changed = (
        not existing
        or existing["label_en"] != t["label_en"]
        or existing["tips_en"] != json.dumps(t["tips_en"], ensure_ascii=False)
        or existing["video_url"] != t["video_url"]
    )
    if not changed:
        return False
    get_db().execute(
        "INSERT INTO topics (dedupe_key, game_id, topic_id, label_en, label_fa, headline_en, "
        "headline_fa, tips_en, tips_fa, video_url, poster_url, stage_mode, stage_title, "
        "stage_subtitle, stage_markers, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) "
        "ON CONFLICT(dedupe_key) DO UPDATE SET label_en=excluded.label_en, label_fa=excluded.label_fa, "
        "headline_en=excluded.headline_en, headline_fa=excluded.headline_fa, tips_en=excluded.tips_en, "
        "tips_fa=excluded.tips_fa, video_url=excluded.video_url, poster_url=excluded.poster_url, "
        "stage_mode=excluded.stage_mode, stage_title=excluded.stage_title, "
        "stage_subtitle=excluded.stage_subtitle, stage_markers=excluded.stage_markers, "
        "updated_at=excluded.updated_at",
        row_vals,
    )
    return True


def _upsert_combo(c: dict[str, Any]) -> bool:
    dedupe_key = f"{c['game_id']}::{c['skill_id']}"
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    existing = get_db().execute(
        "SELECT steps_en FROM combo_moves WHERE dedupe_key = ?", (dedupe_key,)
    ).fetchone()
    new_steps = json.dumps(c["steps_en"], ensure_ascii=False)
    if existing and existing["steps_en"] == new_steps:
        return False
    get_db().execute(
        "INSERT INTO combo_moves (dedupe_key, game_id, skill_id, steps_en, steps_fa, timing_ms, "
        "updated_at) VALUES (?,?,?,?,?,?,?) "
        "ON CONFLICT(dedupe_key) DO UPDATE SET steps_en=excluded.steps_en, steps_fa=excluded.steps_fa, "
        "timing_ms=excluded.timing_ms, updated_at=excluded.updated_at",
        (dedupe_key, c["game_id"], c["skill_id"],
         json.dumps(c["steps_en"], ensure_ascii=False),
         json.dumps(c["steps_fa"], ensure_ascii=False), c["timing_ms"], now),
    )
    return True


def run_sync() -> dict[str, int]:
    """Idempotent incremental sync. Returns counters of what changed."""
    db = get_db()
    changed = {"games": 0, "topics": 0, "combos": 0}
    for g in SEED_GAMES:
        changed["games"] += 1 if _upsert_game(g) else 0
    for g in STORY_CATALOG:
        _upsert_game(g)
    for g in MOBILE_PC_CATALOG:
        changed["games"] += 1 if _upsert_game(g) else 0
    for t in SEED_TOPICS:
        changed["topics"] += 1 if _upsert_topic(t) else 0
    for c in SEED_COMBOS:
        changed["combos"] += 1 if _upsert_combo(c) else 0
    db.commit()
    # Disk hygiene: expired cache sweep.
    swept = cache_mod.sweep_expired()
    log.info("sync done: %s (expired cache entries swept: %s)", changed, swept)
    return changed


def rotate_logs() -> None:
    """Delete old rotated logs beyond LOG_KEEP — disk stays light on the 20G server."""
    log_dir = Path(config.DB_PATH).parent / "logs"
    if not log_dir.exists():
        return
    logs = sorted(log_dir.glob("*.log.*"), key=lambda p: p.stat().st_mtime, reverse=True)
    for old in logs[config.LOG_KEEP:]:
        try:
            os.remove(old)
        except OSError:
            pass
