import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


# ---------- 1. gameId isolation ----------

def test_cs2_never_returns_football_data(client):
    resp = client.get("/api/v1/games/cs2?lang=en")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["game"]["game_id"] == "cs2"
    blob = httpx.Response(200, content=resp.content).text.lower()
    for marker in ("4-3-3", "real madrid", "mbapp", "finesse", "goalkeeper", "4-2-3-1"):
        assert marker not in blob, f"football marker leaked into CS2: {marker}"


def test_every_topic_isolated_to_requested_game(client):
    resp = client.get("/api/v1/games/cs2?lang=en")
    for topic in resp.json()["data"]["topics"]:
        assert topic["game_id"] == "cs2"


def test_fc27_topics_dont_leak_into_cs2(client):
    fc = client.get("/api/v1/games/fc27?lang=en").json()["data"]["topics"]
    cs = client.get("/api/v1/games/cs2?lang=en").json()["data"]["topics"]
    fc_ids = {t["topic_id"] for t in fc}
    cs_ids = {t["topic_id"] for t in cs}
    assert fc_ids.isdisjoint(cs_ids)


def test_unknown_game_isolated_404(client):
    resp = client.get("/api/v1/games/nonexistent-game?lang=en")
    assert resp.status_code == 404
    assert "unknown game" in resp.json()["detail"]


def test_missing_topic_returns_isolated_empty_for_same_game(client):
    resp = client.get("/api/v1/coach/cs2/topics/nope-topic?lang=en")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["game_id"] == "cs2"
    assert data["topic"] is None and data["tips"] == []


def test_unknown_game_coach_isolated_404(client):
    resp = client.get("/api/v1/coach/ghost-game/topics/anything?lang=en")
    assert resp.status_code == 404


# ---------- 2. stage isolation (pitch never for non-football) ----------

def test_stage_pitch_guard(client):
    cs2 = client.get("/api/v1/stage/cs2").json()["data"]["stage"]
    assert cs2["mode"] != "pitch"
    fc = client.get("/api/v1/stage/fc27").json()["data"]["stage"]
    assert fc["mode"] == "pitch"  # football game keeps its pitch
