"""Training ingestion pipeline tests: source-db ingest, layer classification,
idempotent re-runs, resume cursor, disk guardrail, training API isolation."""

import sqlite3
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import config
from app.db import get_db
from app.training_ingest import classify, dedupe, ingest_source_db


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("train")
    config.DB_PATH = str(tmp / "train.sqlite")
    from app import db as db_mod

    db_mod.reset_db()
    from app.main import app

    with TestClient(app) as c:
        yield c


@pytest.fixture()
def source_db(tmp_path):
    path = tmp_path / "source.sqlite"
    src = sqlite3.connect(path)
    src.execute("CREATE TABLE knowledge_cards (id INTEGER PRIMARY KEY, game_id TEXT, kind TEXT, title TEXT, body TEXT, source TEXT, url TEXT)")
    rows = [
        ("cs2", "qa", "Counter-strafe basics", "Counter-strafe (A+D tap) before every shot. Press and hold W then tap S+D... button timing wins aim duels.", "reddit", "https://reddit.com/r/cs2/x"),
        ("cs2", "trick", "Mirage A-site smoke lineup", "Stand mid window corner, lineup crosshair with the tower edge. Map angle: CT spawn rotator sees this smoke early.", "guide", "https://wiki.example/cs2"),
        ("cs2", "glitch", "Legacy bunny hop exploit (patched)", "This glitch is patched; awareness-only. Chain jump binds would skip velocity checks.", "forum", "https://forum.example/bhop"),
        ("fc27", "trick", "Finesse shot timing", "Real Madrid winger finesse from the edge of the box works when L1+R1 pressed together.", "reddit", "https://reddit.com/r/fc27/x"),
        ("dota2", "qa", "Stack timing", "Neutral stack every :53. Build order advice for position 4 rotation strategy.", "guide", "https://wiki.example/dota"),
    ]
    src.executemany("INSERT INTO knowledge_cards (game_id, kind, title, body, source, url) VALUES (?,?,?,?,?,?)", rows)
    src.commit()
    src.close()
    return str(path)


def test_layer_classification():
    assert classify("qa", "Counter-strafe", "press A+D button") == "controls"
    assert classify("qa", "Mirage smoke", "A-site lineup map angle") == "maps"
    assert classify("glitch", "x", "exploit bug") == "glitch"
    assert classify("qa", "stack timing", "build order rotation strategy") == "tactics"
    assert classify("qa", "misc", "plain question") == "qa"


def test_ingest_from_source_db(client, source_db, monkeypatch):
    monkeypatch.setenv("AIGAMERIA_NODE_DB", source_db)
    report = ingest_source_db()
    assert report["status"] == "ok"
    assert report["added"] >= 4
    counts = get_db().execute("SELECT game_id, COUNT(*) n FROM training_records GROUP BY game_id").fetchall()
    d = {r["game_id"]: r["n"] for r in counts}
    assert d.get("cs2", 0) >= 3
    assert d.get("dota2", 0) >= 1


def test_football_isolation_in_training(client, source_db, monkeypatch):
    monkeypatch.setenv("AIGAMERIA_NODE_DB", source_db)
    ingest_source_db()
    resp = client.get("/api/v1/training/cs2?lang=en")
    blob = resp.text.lower()
    assert "real madrid" not in blob and "finesse" not in blob and "winger" not in blob
    assert resp.status_code == 200


def test_training_api_layer_filter(client):
    resp = client.get("/api/v1/training/cs2?layer=maps&lang=en")
    data = resp.json()["data"]
    assert data["records"] and all(r["layer"] == "maps" for r in data["records"])


def test_training_api_en_purity(client):
    resp = client.get("/api/v1/training/cs2?lang=en")
    assert "\u0627" not in resp.text  # no Persian letter 'alef' anywhere


def test_idempotent_and_resumable(client, source_db, monkeypatch):
    monkeypatch.setenv("AIGAMERIA_NODE_DB", source_db)
    r1 = ingest_source_db()
    before = get_db().execute("SELECT COUNT(*) n FROM training_records").fetchone()["n"]
    r2 = ingest_source_db()  # same source, no new rows → nothing added
    after = get_db().execute("SELECT COUNT(*) n FROM training_records").fetchone()["n"]
    assert after == before
    assert r2["added"] == 0
    assert r2["cursor"] >= r1["cursor"]
    # simulate upstream growth: append a new row, re-run picks it up
    src = sqlite3.connect(source_db)
    src.execute("INSERT INTO knowledge_cards (game_id, kind, title, body, source, url) VALUES ('cs2','trick','New angle guide','Spawn angle and sightline positioning tip.','guide','https://x.example/new')")
    src.commit()
    src.close()
    r3 = ingest_source_db()
    assert r3["added"] == 1


def test_disk_guard_prunes_stale_cache(client, monkeypatch):
    from app import disk_guard
    import time as _time
    now = int(_time.time())
    get_db().execute("INSERT INTO stream_cache (cache_key, game_id, url, source, expires_at) VALUES ('k1','cs2','u','fallback',?)", (now - 100,))
    get_db().commit()
    pruned = disk_guard.prune_stale_cache(now=now)
    assert pruned >= 1
    assert disk_guard.usage_report()["data_dir_bytes"] < disk_guard.HARD_LIMIT_BYTES
