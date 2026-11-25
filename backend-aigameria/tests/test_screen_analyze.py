"""Off-screen TV-photo analysis tests: synthetic phone-photo of a monitor
(glare, dark room) showing an Uncharted 4 PS5 puzzle screen → exact puzzle
solution, story .glb avatar, platform buttons, EN purity, temp cleanup."""
import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageFont

from app import config
from app.puzzles import detect_game, resolve_puzzle, upsert_nodes
from app.screen_analyze import analyze_photo, detect_platform_prompt, find_screen_roi
from app.db import get_db


def _make_tv_photo(text_lines: list[str]) -> bytes:
    """Synthetic phone photo: dark room background + bright screen rectangle
    with on-screen text (glare band simulated by a white overlay)."""
    img = Image.new("RGB", (960, 540), (18, 14, 10))  # dark room
    screen = Image.new("RGB", (760, 430), (24, 20, 26))
    draw = ImageDraw.Draw(screen)
    y = 30
    for line in text_lines:
        draw.text((30, y), line, fill=(240, 240, 240))
        y += 44
    # glare spot
    for i in range(60):
        draw.ellipse([560 - i, 40 - i // 2, 560 + i, 40 + i // 2], fill=(255, 255, 255))
    img.paste(screen, (100, 55))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("vision")
    config.DB_PATH = str(tmp / "vision.sqlite")
    from app import db as db_mod

    db_mod.reset_db()
    from app.main import app

    with TestClient(app) as c:
        yield c


@pytest.fixture()
def seed_puzzles():
    import json
    from pathlib import Path

    pack_path = str(Path(__file__).resolve().parent.parent / "ingest" / "story_puzzle_pack.json")
    from app.training_ingest import ingest_catalog_pack

    # game rows first
    from app.seed_sync import run_sync

    run_sync()
    ingest_catalog_pack(pack_path)
    return True


def test_game_detection_from_hud_text():
    game, conf = detect_game("UNCHARTED 4 constellation ORION crosses Dismas Jesus Getas")
    assert game == "uncharted-4"
    assert conf > 0.5


def test_platform_prompt_ps5():
    prompt = detect_platform_prompt("Press L3 to examine, hold Circle to back out, use Touchpad for journal")
    assert prompt["platform"] == "ps5"
    assert "l3" in prompt["prompt_buttons"] and "circle" in prompt["prompt_buttons"]


def test_screen_roi_finds_bright_rect():
    photo = _make_tv_photo(["UNCHARTED 4", "Chapter 8"])
    pre = analyze_photo(photo)
    roi = pre["screen_roi"]
    assert roi["found"] is True
    # ROI roughly centered on the pasted screen (100..860 of 960 wide)
    assert roi["left"] < 200 and roi["right"] > 700


def test_analyze_photo_full_pipeline():
    photo = _make_tv_photo([
        "UNCHARTED 4 - Chapter 8",
        "Align the crosses: Orion",
        "Dismas  Jesus  Getas",
        "L3 examine   Circle back",
    ])
    result = analyze_photo(photo)
    assert result["platform"] in ("ps5", "xbox", "pc", "")
    assert "screen_roi" in result
    assert result["hud_text"] is not None


def test_uncharted4_puzzle_exact_solution(client, seed_puzzles):
    text = "UNCHARTED 4 crosses ORION constellation Dismas Jesus Getas beam stars cathedral"
    puzzle = resolve_puzzle("uncharted-4", text)
    assert puzzle["resolved"] is True
    assert "Orion" in puzzle["title"]
    steps = puzzle["steps_en"]
    assert len(steps) >= 6
    blob = json_steps = " ".join(steps).lower()
    assert "dismas" in blob and "jesus" in blob and "getas" in blob
    assert "orion" in blob
    assert "lamp" in blob  # exact mechanic: light the lamp behind the crosses
    assert "second star from the bottom" in blob  # exact star assignment
    assert puzzle["buttons_en"]


def test_ava_story_avatar_is_xbot(client):
    resp = client.get("/api/v1/ava/uncharted-4?lang=en&voice=true")
    d = resp.json()["data"]
    assert d["style_key"] == "story"
    assert d["glb_url"].endswith("Xbot.glb")
    assert d["animation_state"] == "speaking"


def test_analyze_endpoint_uncharted4(client, seed_puzzles):
    photo = _make_tv_photo([
        "UNCHARTED 4 - Chapter 8",
        "Cathedral crosses ORION",
        "Dismas Jesus Getas",
        "L3 to examine",
    ])
    resp = client.post(
        "/api/v1/media/analyze?hint=uncharted%204%20orion%20crosses",
        files={"file": ("tv.jpg", photo, "image/jpeg")},
    )
    assert resp.status_code == 200
    d = resp.json()["data"]
    assert d["game_id"] == "uncharted-4"
    assert d["genre"] == "story"
    assert d["puzzle"]["resolved"] is True
    assert len(d["puzzle"]["steps_en"]) >= 6
    assert "orion" in " ".join(d["puzzle"]["steps_en"]).lower()
    assert d["avatar"]["glb_url"].endswith("Xbot.glb")
    assert d["temp_files_deleted"] is True
    assert d["video_files_on_disk"] == 0
    assert d["walkthrough_stream"]["ttl_seconds"] == 28800


def test_analyze_unknown_game_isolated(client, seed_puzzles):
    resp = client.post(
        "/api/v1/media/analyze?hint=unknown%20screensaver",
        files={"file": ("tv.jpg", _make_tv_photo(["HELLO SCREEN"]), "image/jpeg")},
    )
    assert resp.status_code == 200
    d = resp.json()["data"]
    assert d["game_id"] == "" and d["confidence"] == 0.0


def test_analyze_no_cross_game_leakage(client, seed_puzzles):
    resp = client.post(
        "/api/v1/media/analyze?hint=uncharted%204%20crosses%20orion",
        files={"file": ("tv.jpg", _make_tv_photo(["UNCHARTED 4"]), "image/jpeg")},
    )
    blob = resp.text.lower()
    assert "real madrid" not in blob and "finesse" not in blob


def test_analyze_en_purity(client, seed_puzzles):
    resp = client.post(
        "/api/v1/media/analyze?hint=uncharted%204%20orion",
        files={"file": ("tv.jpg", _make_tv_photo(["UNCHARTED 4"]), "image/jpeg")},
    )
    assert "\u0627" not in resp.text


def test_temp_cleanup_util():
    from app.screen_analyze import cleanup_temp, save_temp_upload

    path = save_temp_upload(b"x")
    assert cleanup_temp(path) is True
    assert cleanup_temp(path) is False  # already gone


def test_gamepad_ps5_steps_for_uncharted4(client):
    resp = client.get("/api/v1/gamepad/uncharted-4?lang=en")
    assert resp.status_code == 200
