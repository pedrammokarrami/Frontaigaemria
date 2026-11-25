import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import config


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    # Isolated DB per test module run.
    tmp = tmp_path_factory.mktemp("data")
    config.DB_PATH = str(tmp / "media.sqlite")
    from app import db as db_mod
    db_mod.reset_db()
    from app.main import app

    with TestClient(app) as c:
        yield c


def _iter_files(root: Path) -> list[tuple[str, int]]:
    out = []
    for p in root.rglob("*"):
        if p.is_file():
            out.append((str(p), p.stat().st_size))
    return out


def test_stream_resolution_writes_no_heavy_video_files(client, tmp_path):
    """Metadata-only mandate: resolving/caching a stream must never write a
    large video file anywhere on the server disk."""
    before = set(_iter_files(tmp_path))
    resp = client.get("/api/v1/media/stream/cs2?topic_id=crosshair-aim")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["ttl_seconds"] == 28800
    assert data["url"].lower().endswith(".mp4")
    after = _iter_files(tmp_path)
    for path, size in after:
        if path in {p for p, _ in before}:
            continue
        assert size < 1_000_000, f"heavy file written: {path} ({size} bytes)"


def test_stream_cache_hit_then_refresh(client):
    first = client.get("/api/v1/media/stream/warzone?topic_id=loadout-rotation").json()["data"]
    second = client.get("/api/v1/media/stream/warzone?topic_id=loadout-rotation").json()["data"]
    assert first["from_cache"] is False or first["source"] in ("direct", "fallback")
    assert second["from_cache"] is True
    assert second["url"] == first["url"]
