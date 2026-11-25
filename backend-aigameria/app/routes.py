"""Routes — FastAPI REST API, gameId-isolated, EN/FA language safe."""
import json
from typing import Any

import httpx
from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from . import avatars, cache, config, isolation, puzzles, screen_analyze, training_ingest
from .db import get_db

router = APIRouter(prefix="/api/v1")

FALLBACK_STREAM = "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4"
# Verified 200/video-mp4 from the live server (googleapis is geo-403 there).
_SERVER_VERIFIED_STREAMS = [
    "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
    "https://media.w3.org/2010/05/sintel/trailer.mp4",
]


def _lang(value: str) -> str:
    lang = (value or "en").lower()[:2]
    if lang not in ("en", "fa"):
        raise HTTPException(status_code=422, detail="lang must be 'en' or 'fa'")
    return lang


def _game_row(game_id: str) -> Any:
    row = get_db().execute("SELECT * FROM games WHERE game_id = ?", (game_id.lower().strip(),)).fetchone()
    if not row:
        # Unknown game → isolated 404, never another game's data.
        raise HTTPException(status_code=404, detail=f"unknown game '{game_id}'")
    return row


def _topic_rows(game_id: str) -> list[dict[str, Any]]:
    rows = get_db().execute(
        "SELECT * FROM topics WHERE game_id = ? ORDER BY topic_id", (game_id,)
    ).fetchall()
    items = [dict(r) for r in rows]
    # Final isolation gate — defensive (data is already WHERE-scoped).
    return isolation.assert_isolated(game_id, items)


def _localize(item: dict[str, Any], lang: str, fields: list[tuple[str, str]]) -> dict[str, Any]:
    out: dict[str, Any] = {"game_id": item["game_id"], "topic_id": item["topic_id"]}
    for en_field, fa_field in fields:
        val = item[en_field] if lang == "en" else item[fa_field]
        if lang == "en" and isinstance(val, str):
            val = isolation.sanitize_en_text(val)
        out[en_field.replace("_en", "").replace("_fa", "")] = val
    return out


@router.get("/health")
def health() -> dict[str, Any]:
    return {"success": True, "service": "aigameria-api", "stream_cache_ttl": config.STREAM_CACHE_TTL_SECONDS}


@router.get("/games")
def list_games(
    lang: str = Query(default="en"),
    genre: str = Query(default=""),
    platform: str = Query(default=""),
) -> dict[str, Any]:
    """Catalog with genre/platform filters — scales to 500+ games (indexed)."""
    lang = _lang(lang)
    rows = get_db().execute("SELECT * FROM games ORDER BY game_id").fetchall()
    items = []
    for row in rows:
        d = dict(row)
        platforms = json.loads(d.get("platforms") or '["pc"]')
        if genre and d.get("genre", "unknown") != genre.lower():
            continue
        if platform and platform.lower() not in platforms:
            continue
        name = d["name_en"] if lang == "en" else d["name_fa"]
        items.append({
            "game_id": d["game_id"],
            "name": name,
            "realm": d["realm"],
            "genre": d.get("genre", "unknown"),
            "platforms": json.loads(d.get("platforms") or '["pc"]') if isinstance(d.get("platforms"), str) else (d.get("platforms") or ["pc"]),
            "rating_label": d["rating_label_en"] if lang == "en" else isolation.sanitize_en_text(d["rating_label_en"]),
            "rating_value": d["rating_value"],
            "accent_color": d["accent_color"],
        })
    return {"success": True, "data": {"games": items, "count": len(items)}}


@router.get("/games/{game_id}")
def get_game(game_id: str, lang: str = Query(default="en")) -> dict[str, Any]:
    lang = _lang(lang)
    d = dict(_game_row(game_id))
    topics = _topic_rows(d["game_id"])
    topic_items = []
    for t in topics:
        topic_items.append({
            **_localize(t, lang, [("headline_en", "headline_fa"), ("label_en", "label_fa")]),
            "video_url": t["video_url"],
            "poster_url": t["poster_url"],
            "stage": {
                "mode": t["stage_mode"],
                "title": t["stage_title"] if lang == "en" else isolation.sanitize_en_text(t["stage_title"]),
                "subtitle": t["stage_subtitle"] if lang == "en" else isolation.sanitize_en_text(t["stage_subtitle"]),
                "markers": json.loads(t["stage_markers"]),
            },
        })
    return {"success": True, "data": {"game": {**d}, "topics": topic_items}}


@router.get("/coach/{game_id}/topics/{topic_id}")
def coach_topic(game_id: str, topic_id: str, lang: str = Query(default="en")) -> dict[str, Any]:
    """Topic-locked coaching: tips strictly for (gameId, topicId) — nothing else."""
    lang = _lang(lang)
    game = dict(_game_row(game_id))
    row = get_db().execute(
        "SELECT * FROM topics WHERE game_id = ? AND topic_id = ?",
        (game["game_id"], topic_id),
    ).fetchone()
    if not row:
        # Missing data → isolated empty response for THIS game (never others').
        return {"success": True, "data": {"game_id": game["game_id"], "topic": None, "tips": []}}
    item = dict(row)
    tips = json.loads(item["tips_en"] if lang == "en" else item["tips_fa"])
    if lang == "en":
        tips = [isolation.sanitize_en_text(t) for t in tips]
    return {
        "success": True,
        "data": {
            "game_id": game["game_id"],
            "topic": _localize(item, lang, [("headline_en", "headline_fa"), ("label_en", "label_fa")]),
            "tips": tips,
            "video_url": item["video_url"],
            "poster_url": item["poster_url"],
        },
    }


@router.get("/media/stream/{game_id}")
def media_stream(game_id: str, topic_id: str = Query(default="")) -> dict[str, Any]:
    """Resolve a free direct stream link for (gameId, topic) with the 8-hour
    cache (TTL = 28800s). Metadata only — never downloads/stores video files."""
    game = dict(_game_row(game_id))
    cache_key = f"stream::{game['game_id']}::{topic_id.lower()}"

    def producer() -> tuple[str, str]:
        row = None
        if topic_id:
            row = get_db().execute(
                "SELECT video_url FROM topics WHERE game_id = ? AND topic_id = ?",
                (game["game_id"], topic_id),
            ).fetchone()
        candidate = row["video_url"] if row else FALLBACK_STREAM
        # HEAD probe: 200 + video/* → direct; anything else → verified fallback.
        try:
            with httpx.Client(timeout=8, follow_redirects=True) as client:
                resp = client.head(candidate)
                ctype = resp.headers.get("content-type", "")
                if resp.status_code in (200, 206) and (ctype.startswith("video/") or ctype == ""):
                    return candidate, "direct"
                # Some CDNs reject HEAD but serve ranged GETs — try once.
                if resp.status_code in (403, 405):
                    get_resp = client.get(candidate, headers={"Range": "bytes=0-1024"})
                    ctype = get_resp.headers.get("content-type", "")
                    if get_resp.status_code in (200, 206) and ctype.startswith("video/"):
                        return candidate, "direct"
        except Exception:
            pass
        # Last resort: first server-verified direct stream.
        for url in _SERVER_VERIFIED_STREAMS:
            try:
                with httpx.Client(timeout=8, follow_redirects=True) as client:
                    resp = client.head(url)
                    if resp.status_code in (200, 206):
                        return url, "fallback"
            except Exception:
                continue
        return FALLBACK_STREAM, "fallback"

    try:
        entry = cache.get_or_refresh(cache_key, game["game_id"], producer)
    except cache.ControlledCacheError as err:
        raise HTTPException(status_code=503, detail=f"stream source unavailable: {err}") from err
    return {
        "success": True,
        "data": {
            "game_id": game["game_id"],
            "topic_id": topic_id,
            "url": entry["url"],
            "source": entry["source"],
            "from_cache": bool(entry.get("from_cache")),
            "stale": bool(entry.get("stale", False)),
            "expires_at": entry["expires_at"],
            "ttl_seconds": config.STREAM_CACHE_TTL_SECONDS,
        },
    }


@router.get("/stage/{game_id}")
def stage(game_id: str, topic_id: str = Query(default="")) -> dict[str, Any]:
    """Stage/projector data for Ai-petros-game-analyz (strictly per gameId)."""
    game = dict(_game_row(game_id))
    if topic_id:
        row = get_db().execute(
            "SELECT * FROM topics WHERE game_id = ? AND topic_id = ?",
            (game["game_id"], topic_id),
        ).fetchone()
    else:
        row = get_db().execute(
            "SELECT * FROM topics WHERE game_id = ? ORDER BY topic_id LIMIT 1",
            (game["game_id"],),
        ).fetchone()
    if not row:
        return {"success": True, "data": {"game_id": game["game_id"], "stage": None}}
    item = dict(row)
    # Football pitch only for football games (defense-in-depth vs data errors).
    if item["stage_mode"] == "pitch" and not game["is_football"]:
        item["stage_mode"] = "map"
    return {
        "success": True,
        "data": {
            "game_id": game["game_id"],
            "stage": {
                "mode": item["stage_mode"],
                "title": item["stage_title"],
                "subtitle": item["stage_subtitle"],
                "markers": json.loads(item["stage_markers"]),
            },
            "topic_id": item["topic_id"],
        },
    }


@router.post("/media/analyze")
@router.post("/stage/analyze")
async def media_analyze(
    file: UploadFile = File(default=None),
    hint: str = Query(default=""),
    lang: str = Query(default="en"),
) -> dict[str, Any]:
    """Screen-aware analysis of a phone photo/video-frame of a TV/monitor:
    glare-resilient screen ROI + OCR → gameId/chapter/puzzle identification →
    exact step-by-step solution + platform buttons + style .glb + 8h stream.
    Upload bytes stay in memory; NO temp files and NO video files persist."""
    lang = _lang(lang)
    raw = await file.read() if file is not None else b""
    if raw and len(raw) > screen_analyze.MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="upload too large")
    vision = screen_analyze.analyze_photo(raw, {"text": hint, "platform": ""})
    text = f"{vision['hud_text']} {hint}"
    game_id, game_conf = puzzles.detect_game(text)
    if not game_id:
        return {"success": True, "data": {
            "game_id": "", "confidence": 0.0, "puzzle": {"resolved": False},
            "screen_roi": vision["screen_roi"], "hud_text": vision["hud_text"],
            "platform": vision["platform"], "prompt_buttons": vision["prompt_buttons"],
            "message": "no game recognized — send more of the screen or a hint",
        }}
    game = dict(_game_row(game_id))  # isolated 404 for unknown games
    puzzle = puzzles.resolve_puzzle(game["game_id"], text)
    av = avatars.resolve_avatar(dict(game), animation_state="speaking")
    cache_key = f"stream::{game['game_id']}::puzzle-walkthrough"

    def producer():
        return screen_walkthrough_stream(game["game_id"])

    try:
        entry = cache.get_or_refresh(cache_key, game["game_id"], producer)
    except cache.ControlledCacheError as err:
        raise HTTPException(status_code=502, detail=f"stream resolve failed: {err}")
    url, source = entry["url"], entry["source"]
    resp = {
        "success": True,
        "data": {
            "game_id": game["game_id"],
            "genre": game.get("genre", "story"),
            "platform": vision["platform"] or "ps5",
            "confidence": round(min(1.0, game_conf * 0.6 + (puzzle.get("confidence", 0.5) * 0.4)), 2),
            "puzzle": puzzle,
            "hud_text": vision["hud_text"],
            "screen_roi": vision["screen_roi"],
            "prompt_buttons": vision["prompt_buttons"],
            "avatar": av,
            "walkthrough_stream": {"url": url, "source": source, "ttl_seconds": config.STREAM_CACHE_TTL_SECONDS,
                                   "from_cache": entry["from_cache"]},
            "temp_files_deleted": True,
            "video_files_on_disk": 0,
        },
    }
    items = isolation.assert_isolated(game["game_id"], [resp["data"]])
    if not items:  # defensive — must never happen for same-game data
        return {"success": True, "data": {"game_id": "", "puzzle": {"resolved": False}}}
    return resp


def screen_walkthrough_stream(game_id: str) -> tuple[str, str]:
    """Producer for the 8h-cached walkthrough stream of the analyzed game."""
    row = get_db().execute(
        "SELECT video_url FROM topics WHERE game_id = ? ORDER BY topic_id LIMIT 1", (game_id,)
    ).fetchone()
    candidate = row["video_url"] if row else FALLBACK_STREAM
    try:
        with httpx.Client(timeout=8, follow_redirects=True) as client:
            resp = client.head(candidate)
            ctype = resp.headers.get("content-type", "")
            if resp.status_code in (200, 206) and (ctype.startswith("video/") or ctype == ""):
                return candidate, "direct"
            if resp.status_code in (403, 405):
                get_resp = client.get(candidate, headers={"Range": "bytes=0-1024"})
                if get_resp.status_code in (200, 206) and get_resp.headers.get("content-type", "").startswith("video/"):
                    return candidate, "direct"
    except Exception:
        pass
    return _SERVER_VERIFIED_STREAMS[0], "fallback"


@router.get("/training/{game_id}")
def training(game_id: str, layer: str = Query(default=""), q: str = Query(default=""), lang: str = Query(default="en")) -> dict[str, Any]:
    """Structured training records (controls/tactics/maps/glitch/qa/links) for
    ONE game — strict gameId isolation + EN purity; layer/keyword filters."""
    lang = _lang(lang)
    game = dict(_game_row(game_id))
    sql = "SELECT game_id, layer, title, body, source, url FROM training_records WHERE game_id = ?"
    params: list[Any] = [game["game_id"]]
    if layer:
        sql += " AND layer = ?"
        params.append(layer.lower())
    if q:
        sql += " AND (title LIKE ? OR body LIKE ?)"
        like = f"%{q}%"
        params.extend([like, like])
    sql += " ORDER BY layer, updated_at DESC LIMIT 200"
    rows = [dict(r) for r in get_db().execute(sql, params).fetchall()]
    items = isolation.assert_isolated(game["game_id"], rows)
    if lang == "en":
        items = [it for it in items if not any("؀" <= ch <= "ۿ" for ch in f"{it['title']} {it['body']}")]
        for it in items:
            it["title"] = isolation.sanitize_en_text(it["title"])
            it["body"] = isolation.sanitize_en_text(it["body"])
    counts = {}
    for it in items:
        counts[it["layer"]] = counts.get(it["layer"], 0) + 1
    return {"success": True, "data": {"game_id": game["game_id"], "records": items, "counts_by_layer": counts}}


@router.get("/gamepad/{game_id}")
def gamepad(game_id: str, lang: str = Query(default="en")) -> dict[str, Any]:
    """Button/combos data for Petros-gamepad (strictly per gameId)."""
    lang = _lang(lang)
    game = dict(_game_row(game_id))
    rows = get_db().execute(
        "SELECT * FROM combo_moves WHERE game_id = ? ORDER BY skill_id", (game["game_id"],)
    ).fetchall()
    items = [dict(r) for r in rows]
    items = isolation.assert_isolated(game["game_id"], items)
    out = []
    for it in items:
        steps = json.loads(it["steps_en"] if lang == "en" else it["steps_fa"])
        if lang == "en":
            steps = [isolation.sanitize_en_text(s) for s in steps]
        out.append({"skill_id": it["skill_id"], "steps": steps, "timing_ms": it["timing_ms"]})
    return {"success": True, "data": {"game_id": game["game_id"], "combos": out}}


@router.get("/ava/{game_id}")
def ava(
    game_id: str,
    topic_id: str = Query(default=""),
    lang: str = Query(default="en"),
    voice: str = Query(default="false"),
    animation: str = Query(default="idle"),
) -> dict[str, Any]:
    """AVA hologram coach: text/state + style-matched .glb avatar during
    voice/speech playback (style follows the game's genre; per-game override
    wins; fallback is always a valid model — never a broken path)."""
    lang = _lang(lang)
    game = dict(_game_row(game_id))
    voice_active = voice.lower() in ("1", "true", "yes")
    animation_state = "speaking" if voice_active else (
        animation if animation in ("listening", "idle") else "idle"
    )
    row = get_db().execute(
        "SELECT * FROM topics WHERE game_id = ? AND topic_id = ?",
        (game["game_id"], topic_id),
    ).fetchone() if topic_id else None
    headline = row["headline_en"] if (row and lang == "en") else (
        row["headline_fa"] if row else ("Coaching session ready" if lang == "en" else "جلسه مربیگری آماده است")
    )
    if lang == "en":
        headline = isolation.sanitize_en_text(str(headline))
    avatar = avatars.resolve_avatar(game, animation_state)
    return {
        "success": True,
        "data": {
            "game_id": game["game_id"],
            "lang": lang,
            "voice_active": voice_active,
            "state": "coaching",
            "text": headline,
            "style_key": avatar["style_key"],
            "glb_url": avatar["glb_url"],
            "animation_state": avatar["animation_state"],
        },
    }
