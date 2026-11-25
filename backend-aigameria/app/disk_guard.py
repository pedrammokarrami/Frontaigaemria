"""Disk quota guardrail for the ~20 GB server budget.

Continuous usage tracking during ingestion; prunes low-priority stale cache
entries and old rotated logs as the ceiling approaches; pauses ingestion at
the hard ceiling so the server never runs out of space.
"""
import logging
import shutil
import time
from pathlib import Path

from . import config
from .db import get_db

log = logging.getLogger("aigameria.disk")

SOFT_LIMIT_BYTES = 18 * 1024**3   # 18 GiB → start pruning
HARD_LIMIT_BYTES = 20 * 1024**3   # 20 GiB → pause ingestion


def data_dir_bytes() -> int:
    total = 0
    data_dir = Path(config.DB_PATH).parent
    if data_dir.exists():
        for p in data_dir.rglob("*"):
            if p.is_file():
                total += p.stat().st_size
    return total


def filesystem_free_bytes() -> int:
    return shutil.disk_usage(Path(config.DB_PATH).parent).free


def usage_report() -> dict:
    used = data_dir_bytes()
    return {
        "data_dir_bytes": used,
        "soft_limit": SOFT_LIMIT_BYTES,
        "hard_limit": HARD_LIMIT_BYTES,
        "free_on_disk": filesystem_free_bytes(),
        "over_soft": used > SOFT_LIMIT_BYTES,
        "over_hard": used > HARD_LIMIT_BYTES,
    }


def prune_stale_cache(now: int | None = None) -> int:
    """Delete expired stream-cache rows (metadata only, tiny anyway)."""
    now = now if now is not None else int(time.time())
    cur = get_db().execute("DELETE FROM stream_cache WHERE expires_at <= ?", (now,))
    get_db().commit()
    return cur.rowcount


def prune_old_logs() -> int:
    """Drop rotated logs beyond LOG_KEEP (never touches videos — none exist)."""
    removed = 0
    log_dir = Path(config.DB_PATH).parent / "logs"
    if log_dir.exists():
        logs = sorted(log_dir.glob("*.log.*"), key=lambda p: p.stat().st_mtime, reverse=True)
        for old in logs[config.LOG_KEEP:]:
            try:
                old.unlink()
                removed += 1
            except OSError:
                pass
    return removed


def enforce_budget() -> dict:
    """Called per ingestion batch: prune when over soft limit; report hard."""
    report = usage_report()
    pruned = 0
    if report["over_soft"]:
        pruned += prune_stale_cache()
        pruned += prune_old_logs()
        report = usage_report()
    report["pruned_entries"] = pruned
    if report["over_hard"]:
        log.warning("HARD disk budget exceeded — ingestion must pause")
    return report


def can_ingest() -> bool:
    return not usage_report()["over_hard"]


def checkpoint_age_seconds() -> float:
    return time.time()
