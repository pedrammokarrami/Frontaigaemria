import time

import pytest

from app import cache as cache_mod
from app import config
from app.db import get_db

# ---------- 8-hour cache (TTL = 28800s) ----------


def test_service_ttl_is_28800():
    assert config.STREAM_CACHE_TTL_SECONDS == 28800


def test_put_entry_sets_expires_at_plus_28800(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DB_PATH", str(tmp_path / "t.sqlite"))
    from app import db as db_mod
    db_mod.reset_db()
    db_mod.init_db()
    now = int(time.time())
    entry = cache_mod.put_entry("k1", "cs2", "https://x/v.mp4", "direct", now=now)
    assert entry["expires_at"] - now == 28800


def test_fresh_entry_served_from_cache_before_expiry(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DB_PATH", str(tmp_path / "t.sqlite"))
    from app import db as db_mod
    db_mod.reset_db()
    db_mod.init_db()
    now = int(time.time())
    calls = []

    def producer():
        calls.append(1)
        return "https://x/v.mp4", "direct"

    first = cache_mod.get_or_refresh("k2", "cs2", producer, now=now)
    second = cache_mod.get_or_refresh("k2", "cs2", producer, now=now + 100)
    assert first["from_cache"] is False
    assert second["from_cache"] is True   # zero producer calls while fresh
    assert len(calls) == 1
    assert second["url"] == first["url"]


def test_expired_entry_refreshes_via_producer(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DB_PATH", str(tmp_path / "t.sqlite"))
    from app import db as db_mod
    db_mod.reset_db()
    db_mod.init_db()
    now = int(time.time())
    calls = []

    def producer():
        calls.append(1)
        return "https://x/refreshed.mp4", "direct"

    cache_mod.get_or_refresh("k3", "cs2", producer, now=now)
    after = cache_mod.get_or_refresh("k3", "cs2", producer, now=now + 28801)  # TTL elapsed
    assert len(calls) == 2  # producer ran again after expiry
    assert after["url"] == "https://x/refreshed.mp4"
    assert after["from_cache"] is False


def test_producer_failure_returns_stale_not_crash(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DB_PATH", str(tmp_path / "t.sqlite"))
    from app import db as db_mod
    db_mod.reset_db()
    db_mod.init_db()
    now = int(time.time())

    def good():
        return "https://x/v.mp4", "direct"

    def bad():
        raise RuntimeError("source down")

    cache_mod.get_or_refresh("k4", "cs2", good, now=now)
    stale = cache_mod.get_or_refresh("k4", "cs2", bad, now=now + 28801)
    assert stale["url"] == "https://x/v.mp4"
    assert stale["stale"] is True


def test_sweep_expired_deletes_only_expired(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DB_PATH", str(tmp_path / "t.sqlite"))
    from app import db as db_mod
    db_mod.reset_db()
    db_mod.init_db()
    now = int(time.time())
    cache_mod.put_entry("fresh", "cs2", "https://x/a.mp4", "direct", now=now)
    cache_mod.put_entry("old", "cs2", "https://x/b.mp4", "direct", ttl_seconds=10, now=now - 100)
    swept = cache_mod.sweep_expired(now=now)
    assert swept == 1
    assert cache_mod.get_fresh("fresh", now=now) is not None
    assert cache_mod.get_fresh("old", now=now) is None
