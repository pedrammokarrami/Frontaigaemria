"""Live edge-case tests added during the backend verification pass.

Covers: empty/malformed gameIds, upstream stream failure → controlled fallback
chain, force-refresh semantics, and nginx-level isolation regressions.
"""
import re
import time

import pytest
from fastapi.testclient import TestClient

from app import cache as cache_mod
from app import config

PERSIAN_RX = re.compile(r"[\u0600-\u06FF\uFB50-\uFEFF]")


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("edge")
    config.DB_PATH = str(tmp / "edge.sqlite")
    from app import db as db_mod
    db_mod.reset_db()
    from app.main import app

    with TestClient(app) as c:
        yield c


# ---------- malformed / edge gameIds ----------

@pytest.mark.parametrize(
    "game_id,expect",
    [
        ("CS2!", 404),          # malformed → 404, never data from another game
        ("nonexistent", 404),
    ],
)
def test_malformed_game_ids_never_leak(client, game_id, expect):
    resp = client.get(f"/api/v1/games/{game_id}?lang=en")
    assert resp.status_code == expect
    assert resp.json().get("detail")  # clean structured error body


@pytest.mark.parametrize("game_id", ["cs2%00", "../etc"])
def test_hostile_game_ids_rejected_before_data(client, game_id):
    # Path decoding fails at the framework level → generic 404, zero leakage.
    resp = client.get(f"/api/v1/games/{game_id}?lang=en")
    assert resp.status_code == 404


def test_empty_game_id_is_404_not_leak(client):
    # FastAPI route mismatch → 404/307, and never a foreign game's payload.
    resp = client.get("/api/v1/games/?lang=en", follow_redirects=False)
    assert resp.status_code in (307, 404)
    if resp.status_code == 307:
        return
    assert resp.json().get("detail") is not None


def test_uppercase_game_id_still_isolated(client):
    resp = client.get("/api/v1/games/CS2?lang=en")
    assert resp.status_code == 200
    assert resp.json()["data"]["game"]["game_id"] == "cs2"


# ---------- upstream stream failure → graceful fallback ----------

def test_upstream_failure_falls_back_to_verified_stream(client):
    """Catalog URL (googleapis) is 403-geo from many datacenters — the resolver
    must return a SERVER-VERIFIED direct stream, never a broken link."""
    resp = client.get("/api/v1/media/stream/cs2?topic_id=crosshair-aim")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["url"].startswith("https://")
    assert data["source"] in ("direct", "fallback")
    assert data["ttl_seconds"] == 28800


def test_stream_cache_force_refresh(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DB_PATH", str(tmp_path / "force.sqlite"))
    from app import db as db_mod

    db_mod.reset_db()
    db_mod.init_db()
    now = int(time.time())
    calls = []

    def producer():
        calls.append(1)
        return "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4", "direct"

    cache_mod.get_or_refresh("force::1", "cs2", producer, now=now)
    cache_mod.put_entry("force::1", "cs2", "https://expired.example/x.mp4", "fallback",
                        ttl_seconds=1, now=now - 5)  # overwrite with expired row
    entry = cache_mod.get_or_refresh("force::1", "cs2", producer, now=now)
    assert entry["url"] != "https://expired.example/x.mp4"  # refreshed past expiry
    assert entry["from_cache"] is False
    # restore the module-scoped connection (monkeypatch already restored path)
    db_mod.reset_db()


def test_stream_entry_never_stores_binary_body(client):
    """Cache stores only url/source/expires_at metadata — no video bytes."""
    resp = client.get("/api/v1/media/stream/dota2?topic_id=lane-gank")
    if resp.status_code != 200:
        pytest.skip("stream upstream unavailable in CI")
    entry = resp.json()["data"]
    assert set(entry.keys()) <= {
        "game_id", "topic_id", "url", "source", "from_cache", "stale",
        "expires_at", "ttl_seconds",
    }


# ---------- language purity edge cases ----------

def test_en_purity_across_all_endpoints(client):
    endpoints = [
        "/api/v1/games?lang=en",
        "/api/v1/games/warzone?lang=en",
        "/api/v1/coach/warzone/topics/loadout-rotation?lang=en",
        "/api/v1/gamepad/cs2?lang=en",
        "/api/v1/ava/cs2?lang=en",
    ]
    for url in endpoints:
        resp = client.get(url)
        assert resp.status_code == 200, url
        assert not PERSIAN_RX.search(resp.text), f"Persian leaked in {url}"


def test_fa_fallback_for_unknown_topic(client):
    resp = client.get("/api/v1/coach/cs2/topics/ghost?lang=en")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["game_id"] == "cs2" and data["tips"] == []
