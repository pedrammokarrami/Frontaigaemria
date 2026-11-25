import json

import pytest

from app.db import get_db
from app.seed_sync import run_sync
from app.seed_data import SEED_TOPICS


@pytest.fixture()
def isolated_db(tmp_path, monkeypatch):
    monkeypatch.setattr("app.config.DB_PATH", str(tmp_path / "sync.sqlite"))
    from app import db as db_mod
    db_mod.reset_db()
    from app import db as db_mod
    db_mod.init_db()
    return get_db()


def test_initial_sync_inserts_all(isolated_db):
    changed = run_sync()
    assert changed["games"] == 25  # 5 deep packs + 20 catalog expansion titles
    assert changed["topics"] == len(SEED_TOPICS)
    count = isolated_db.execute("SELECT COUNT(*) c FROM topics").fetchone()["c"]
    assert count == len(SEED_TOPICS)


def test_second_sync_is_idempotent_no_duplicates(isolated_db):
    run_sync()
    before = isolated_db.execute("SELECT COUNT(*) c FROM topics").fetchone()["c"]
    changed = run_sync()
    after = isolated_db.execute("SELECT COUNT(*) c FROM topics").fetchone()["c"]
    assert changed["topics"] == 0  # nothing new → nothing rewritten
    assert after == before


def test_incremental_update_preserves_structure(isolated_db):
    run_sync()
    # mutate one topic in seed → next sync updates only that row
    topic = dict(SEED_TOPICS[0])
    topic["label_en"] = "Crosshair & aim v2"
    topic["tips_en"] = topic["tips_en"] + ["New incremental tip from upstream."]
    isolated_db.execute(
        "UPDATE topics SET label_en=? WHERE dedupe_key=?",
        ("Crosshair & aim", f"{topic['game_id']}::{topic['topic_id']}"),
    )
    from app import seed_sync as ss

    assert ss._upsert_topic(topic) is True
    row = isolated_db.execute(
        "SELECT * FROM topics WHERE dedupe_key=?", (f"{topic['game_id']}::{topic['topic_id']}",)
    ).fetchone()
    assert row["label_en"] == "Crosshair & aim v2"
    assert "New incremental tip from upstream." in json.loads(row["tips_en"])
    # all other topics untouched
    others = isolated_db.execute(
        "SELECT COUNT(*) c FROM topics WHERE dedupe_key != ?", (f"{topic['game_id']}::{topic['topic_id']}",)
    ).fetchone()["c"]
    assert others == len(SEED_TOPICS) - 1
