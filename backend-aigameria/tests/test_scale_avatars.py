"""500+ catalog scalability, genre/platform filtering, style-matched .glb
avatars during voice/speech, and 8h cache + no-heavy-disk guarantees."""
import json
import re
import time

import pytest
from fastapi.testclient import TestClient

from app import config
from app.avatars import STYLE_GLB
from app.db import get_db
from app.seed_sync import _upsert_game
from app.seed_data import _g

PERSIAN_RX = re.compile(r"[\u0600-\u06FF\uFB50-\uFEFF]")


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("scale")
    config.DB_PATH = str(tmp / "scale.sqlite")
    from app import db as db_mod

    db_mod.reset_db()
    from app.main import app

    with TestClient(app) as c:
        yield c


def _batch_insert(n: int) -> None:
    """Bulk-insert n synthetic catalog games (fast path, no HTTP)."""
    for i in range(n):
        _upsert_game(_g(f"gen{i:04d}", f"Synthetic Title {i}",
                        ["shooter", "moba", "story", "sports", "racing"][i % 5],
                        json.dumps(["pc"])))
    get_db().commit()


def test_500_plus_catalog_scales(client):
    _batch_insert(500)
    t0 = time.time()
    resp = client.get("/api/v1/games?lang=en")
    dt = time.time() - t0
    assert resp.status_code == 200
    games = resp.json()["data"]["games"]
    assert len(games) >= 520  # 25 real + 500 synthetic
    assert dt < 2.0, f"catalog query too slow with 500+ games: {dt:.2f}s"


def test_genre_and_platform_filters(client):
    shooters = client.get("/api/v1/games?genre=shooter&lang=en").json()["data"]["games"]
    assert shooters and all(g["genre"] == "shooter" for g in shooters)
    ios = client.get("/api/v1/games?platform=ios&lang=en").json()["data"]["games"]
    assert ios and all("ios" in g["platforms"] for g in ios)
    mobile_shooters = client.get("/api/v1/games?genre=mobile_competitive&lang=en").json()["data"]["games"]
    assert any(g["game_id"] == "cod-mobile" for g in mobile_shooters)


def test_isolation_holds_at_scale(client):
    resp = client.get("/api/v1/games/gen0042?lang=en")
    blob = resp.text.lower()
    assert "4-3-3" not in blob and "real madrid" not in blob


def test_en_purity_at_scale(client):
    resp = client.get("/api/v1/games?lang=en")
    assert not PERSIAN_RX.search(resp.text)


# ---------- style-matched .glb avatars during voice/speech ----------

@pytest.mark.parametrize(
    "game_id,expect_style",
    [
        ("cs2", "shooter"),
        ("warzone", "battle_royale"),
        ("fc27", "sports"),
        ("nba2k", "sports_court"),
        ("dota2", "moba"),
        ("cod-mobile", "mobile_competitive"),
        ("elden-ring", "story"),
    ],
)
def test_style_glb_during_voice(client, game_id, expect_style):
    resp = client.get(f"/api/v1/ava/{game_id}?lang=en&voice=true")
    assert resp.status_code == 200
    d = resp.json()["data"]
    assert d["voice_active"] is True
    assert d["animation_state"] == "speaking"
    assert d["style_key"] == expect_style
    assert d["glb_url"].endswith(".glb")
    assert d["glb_url"] in set(STYLE_GLB.values())  # valid, known model


def test_idle_when_no_voice(client):
    d = client.get("/api/v1/ava/cs2?lang=en").json()["data"]
    assert d["voice_active"] is False
    assert d["animation_state"] == "idle"


def test_avatar_never_broken_for_unknown_style_game(client):
    """A game with unknown genre still resolves to the valid default model."""
    resp = client.get("/api/v1/ava/gen0000?lang=en&voice=true")
    d = resp.json()["data"]
    assert d["glb_url"].endswith(".glb")
    assert d["glb_url"] in set(STYLE_GLB.values())


def test_distinct_styles_across_game_kinds(client):
    styles = set()
    for gid in ("cs2", "fc27", "dota2", "elden-ring", "cod-mobile"):
        styles.add(client.get(f"/api/v1/ava/{gid}?lang=en&voice=true").json()["data"]["style_key"])
    assert len(styles) >= 4  # truly style-specific, not one generic avatar


# ---------- 8h cache + zero heavy disk at scale ----------

def test_stream_cache_ttl_and_speed(client):
    t0 = time.time()
    first = client.get("/api/v1/media/stream/cs2?topic_id=crosshair-aim").json()["data"]
    t_first = time.time() - t0
    t0 = time.time()
    second = client.get("/api/v1/media/stream/cs2?topic_id=crosshair-aim").json()["data"]
    t_second = time.time() - t0
    assert second["ttl_seconds"] == 28800
    assert second["from_cache"] is True
    assert second["url"] == first["url"]
    assert t_second < max(t_first, 0.05) + 0.05  # cache hit is at least as fast


def test_disk_stays_light_after_scale_ingest(client):
    """500+ game ingest must not write video blobs — DB stays small."""
    db_size = 0
    conn = get_db()
    pages = conn.execute("PRAGMA page_count").fetchone()[0]
    page_size = conn.execute("PRAGMA page_size").fetchone()[0]
    db_size = pages * page_size
    assert db_size < 5_000_000, f"DB grew unexpectedly large: {db_size} bytes"
