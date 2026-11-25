import re

import pytest
from fastapi.testclient import TestClient

from app import config

PERSIAN_RX = re.compile(r"[\u0600-\u06FF\uFB50-\uFEFF]")


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("lang")
    config.DB_PATH = str(tmp / "lang.sqlite")
    from app import db as db_mod
    db_mod.reset_db()
    from app.main import app

    with TestClient(app) as c:
        yield c


def test_en_output_never_contains_persian_script(client):
    for game_id in ("cs2", "fc27", "warzone", "nba2k", "dota2"):
        resp = client.get(f"/api/v1/games/{game_id}?lang=en")
        assert resp.status_code == 200
        assert not PERSIAN_RX.search(resp.text), f"Persian leaked in EN output for {game_id}"


def test_fa_output_is_persian(client):
    resp = client.get("/api/v1/games/cs2?lang=fa")
    tips = resp.json()["data"]["topics"]
    # FA headline contains Persian script
    coach = client.get("/api/v1/coach/cs2/topics/crosshair-aim?lang=fa").json()["data"]
    assert PERSIAN_RX.search(json_safe(coach["topic"]["headline"]))


def json_safe(d):
    return d if isinstance(d, str) else str(d)


def test_invalid_lang_rejected(client):
    resp = client.get("/api/v1/games/cs2?lang=de")
    assert resp.status_code == 422


def test_unknown_game_error_is_clean(client):
    resp = client.get("/api/v1/games/nope?lang=en")
    assert resp.status_code == 404
    body = resp.json()
    assert "detail" in body and not PERSIAN_RX.search(body["detail"])


def test_gamepad_isolated(client):
    cs2 = client.get("/api/v1/gamepad/cs2?lang=en").json()["data"]
    assert cs2["game_id"] == "cs2"
    assert all("finesse" not in c["skill_id"].lower() for c in cs2["combos"])
    fc = client.get("/api/v1/gamepad/fc27?lang=en").json()["data"]
    assert any("finesse" in c["skill_id"] for c in fc["combos"])


def test_ava_state_synced(client):
    resp = client.get("/api/v1/ava/cs2?topic_id=crosshair-aim&lang=en").json()["data"]
    assert resp["game_id"] == "cs2" and resp["lang"] == "en" and resp["state"] == "coaching"
    assert not PERSIAN_RX.search(resp["text"])
