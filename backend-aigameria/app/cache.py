"""8-hour stream/query cache (TTL = 28800s) with fallback + stale-if-error.

Storage: SQLite table stream_cache (metadata rows only — never video files).
"""
import time
from typing import Any, Callable

from . import config
from .db import get_db


class ControlledCacheError(RuntimeError):
    """Raised when a source fails and no stale/fallback value exists — the
    frontend receives a clean 503 JSON instead of crashing."""


def get_entry(cache_key: str) -> dict[str, Any] | None:
    row = get_db().execute(
        "SELECT cache_key, game_id, url, source, expires_at FROM stream_cache WHERE cache_key = ?",
        (cache_key,),
    ).fetchone()
    if not row:
        return None
    return dict(row)


def get_fresh(cache_key: str, now: int | None = None) -> dict[str, Any] | None:
    """Return the entry only when it is within its TTL (expires_at > now)."""
    entry = get_entry(cache_key)
    if not entry:
        return None
    now = now if now is not None else int(time.time())
    if entry["expires_at"] > now:
        return entry
    return None


def put_entry(
    cache_key: str,
    game_id: str,
    url: str,
    source: str,
    ttl_seconds: int = config.STREAM_CACHE_TTL_SECONDS,
    now: int | None = None,
) -> dict[str, Any]:
    now = now if now is not None else int(time.time())
    expires_at = now + ttl_seconds
    get_db().execute(
        "INSERT INTO stream_cache (cache_key, game_id, url, source, expires_at) "
        "VALUES (?, ?, ?, ?, ?) "
        "ON CONFLICT(cache_key) DO UPDATE SET url=excluded.url, source=excluded.source, "
        "expires_at=excluded.expires_at, game_id=excluded.game_id",
        (cache_key, game_id, url, source, expires_at),
    )
    get_db().commit()
    return {"cache_key": cache_key, "game_id": game_id, "url": url, "source": source, "expires_at": expires_at}


def sweep_expired(now: int | None = None) -> int:
    now = now if now is not None else int(time.time())
    cur = get_db().execute("DELETE FROM stream_cache WHERE expires_at <= ?", (now,))
    get_db().commit()
    return cur.rowcount


def get_or_refresh(
    cache_key: str,
    game_id: str,
    producer: Callable[[], tuple[str, str]],
    ttl_seconds: int = config.STREAM_CACHE_TTL_SECONDS,
    allow_stale_on_error: bool = True,
    now: int | None = None,
) -> dict[str, Any]:
    """Cache-aside: fresh entry served with zero external calls; expired →
    refresh via producer; producer failure → stale entry (if any) or a
    controlled error. TTL defaults to the 8-hour mandate (28800s)."""
    fresh = get_fresh(cache_key, now=now)
    if fresh:
        return {**fresh, "from_cache": True}
    try:
        url, source = producer()
    except Exception as err:
        stale = get_entry(cache_key)
        if allow_stale_on_error and stale:
            return {**stale, "from_cache": True, "stale": True}
        raise ControlledCacheError(str(err)) from err
    return {**put_entry(cache_key, game_id, url, source, ttl_seconds), "from_cache": False}
