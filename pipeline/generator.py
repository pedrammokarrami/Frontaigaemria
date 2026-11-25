#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AIGAMERIA content pipeline (generator.py)
=========================================

Fetches real, up-to-date gaming data from FREE web sources (no local LLM
required, no paid cloud APIs), cleans it, structures it into a strict JSON
schema that matches the AIGAMERIA UI sections, validates it, and atomically
replaces the live JSON served to the frontend (192.168.1.50).

Design rules (user-mandated):
  * Zero blocking HTTP work at request time — this runs from cron/systemd.
  * Optional Ollama (qwen2.5:1.5b/3b) ONLY for summarizing fetched snippets,
    temperature 0.1, JSON mode; any failure falls back to deterministic
    rule-based extraction so the JSON never breaks.
  * Last-known-good JSON is kept as .bak fallback.

Usage:
    python3 generator.py                 # full run → data/live/data.json
    python3 generator.py --check-only    # validate existing file, no fetch
    python3 generator.py --game fc27     # single game run

Outputs:
    data/live/data.json        (live file served by the app)
    data/live/data.json.bak    (previous known-good copy)
    data/report.json           (run report: counts, errors, timing)

Stdlib only (Python 3.10+). Optional: `requests`, `jsonschema`, `pydantic`
are used if importable, otherwise internal fallbacks are used.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import socket
import sqlite3
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any

# ── paths ────────────────────────────────────────────────────────────────────
ROOT = os.path.dirname(os.path.abspath(__file__))
def _load_env():
    """Load .env from repo root (stdlib-only)."""
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
    try:
        with open(env_path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ.setdefault(k.strip(), v.strip())
    except Exception:
        pass

_load_env()


LIVE_DIR = os.path.join(ROOT, "data", "live")
LIVE_FILE = os.path.join(LIVE_DIR, "data.json")
BAK_FILE = LIVE_FILE + ".bak"
REPORT_FILE = os.path.join(ROOT, "data", "report.json")
# also publish into the web app's public dir (served by the Node server)
APP_PUBLIC = os.environ.get(
    "AIGAMERIA_PUBLIC_DIR",
    os.path.join(os.path.dirname(ROOT), "public", "data"),
)
APP_TARGET = os.path.join(APP_PUBLIC, "api-data.json")

USER_AGENT = "AIGAMERIA-Pipeline/1.0 (+https://aigameria.com; local cache builder)"

# ── active titles (edit freely) ──────────────────────────────────────────────
GAMES: dict[str, dict[str, Any]] = {
    "fc27": {
        "name": "EA SPORTS FC 27",
        "short": "FC 27",
        "realm": "sports",
        "reddit": ["EASportsFC", "FUT"],
        "steam_appid": None,
        "queries": [
            "FC 27 best formation meta patch",
            "FC 27 shooting timing green window finesse",
            "FC 27 patch notes update",
        ],
    },
    "nba2k27": {
        "name": "NBA 2K27",
        "short": "NBA 2K27",
        "realm": "sports",
        "reddit": ["NBA2k", "NBA_2K"],
        "steam_appid": None,
        "queries": [
            "NBA 2K27 best builds patch",
            "NBA 2K27 shooting timing update",
        ],
    },
    "gta": {
        "name": "GTA V / GTA VI Online",
        "short": "GTA",
        "realm": "story",
        "reddit": ["gtaonline", "GTAV"],
        "steam_appid": "271590",
        "queries": [
            "GTA Online update patch notes",
            "GTA Online heist payouts meta",
        ],
    },
    "cs2": {
        "name": "Counter-Strike 2",
        "short": "CS2",
        "realm": "shooter",
        "reddit": ["GlobalOffensive"],
        "steam_appid": "730",
        "queries": [
            "CS2 patch notes update",
            "CS2 aim training routine",
        ],
    },
    "valorant": {
        "name": "VALORANT",
        "short": "VALORANT",
        "realm": "shooter",
        "reddit": ["VALORANT"],
        "steam_appid": None,
        "queries": ["VALORANT patch notes update"],
    },
}

# ── optional deps ────────────────────────────────────────────────────────────
try:
    import requests as _requests  # type: ignore

    _HAS_REQUESTS = True
except Exception:  # pragma: no cover
    _requests = None
    _HAS_REQUESTS = False

try:
    import jsonschema  # type: ignore

    _HAS_JSONSCHEMA = True
except Exception:  # pragma: no cover
    jsonschema = None
    _HAS_JSONSCHEMA = False


# ── tiny HTTP helpers (stdlib fallback) ──────────────────────────────────────
def http_get(url: str, timeout: int = 12) -> bytes | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if getattr(resp, "status", 200) != 200:
                return None
            return resp.read()
    except Exception:
        return None


def http_get_json(url: str, timeout: int = 12) -> Any:
    raw = http_get(url, timeout)
    if raw is None:
        return None
    try:
        return json.loads(raw.decode("utf-8", "replace"))
    except Exception:
        return None


# ── text cleaning ────────────────────────────────────────────────────────────
_TAGS = re.compile(r"<[^>]+>")
_WS = re.compile(r"\s+")
_CTRL = re.compile(r"[\u0000-\u001f\u007f]")
# mixed-direction artifacts / broken punctuation
_BIDI = re.compile(r"[\u202a-\u202e\u2066-\u2069]")
_BAD_PUNCT = re.compile(r"\s+([.,!?;:،؛؟])")


def clean_text(raw: str, max_len: int = 220) -> str:
    """HTML-free, whitespace-clean, punctuation-fixed, bidi-free snippet."""
    if not raw:
        return ""
    s = html.unescape(_TAGS.sub(" ", raw))
    s = _BIDI.sub("", s)
    s = _CTRL.sub(" ", s)
    s = _WS.sub(" ", s).strip()
    s = _BAD_PUNCT.sub(r"\1", s)
    if len(s) > max_len:
        cut = s[:max_len]
        if " " in cut:
            cut = cut.rsplit(" ", 1)[0]
        s = cut.rstrip(",;:") + "…"
    return s


def looks_language_clean(text: str, lang: str) -> bool:
    """Reject mixed RTL/LTR artifacts for fa/en and opposite-script bleed."""
    if not text:
        return False
    arabic = len(re.findall(r"[\u0600-\u06ff]", text))
    latin = len(re.findall(r"[A-Za-z]", text))
    total = arabic + latin
    if total == 0:
        return False
    if lang == "fa":
        return arabic / total >= 0.55
    return latin / total >= 0.80


# ── free sources ─────────────────────────────────────────────────────────────
def fetch_reddit(sub: str, limit: int = 6) -> list[dict[str, Any]]:
    data = http_get_json(
        f"https://www.reddit.com/r/{sub}/hot.json?limit={limit}", timeout=10
    )
    out: list[dict[str, Any]] = []
    if not isinstance(data, dict):
        return out
    for child in data.get("data", {}).get("children", []):
        d = child.get("data", {})
        title = clean_text(d.get("title", ""), 140)
        body = clean_text(d.get("selftext", ""), 200)
        if title:
            out.append(
                {
                    "title": title,
                    "summary": body or title,
                    "url": "https://www.reddit.com" + d.get("permalink", ""),
                    "source": f"reddit/r/{sub}",
                    "ts": d.get("created_utc", 0),
                }
            )
    return out


def fetch_steam_news(appid: str, limit: int = 5) -> list[dict[str, Any]]:
    data = http_get_json(
        f"https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid={appid}&maxlength=300&count={limit}",
        timeout=10,
    )
    out: list[dict[str, Any]] = []
    items = (data or {}).get("appnews", {}).get("newsitems", [])
    for n in items:
        title = clean_text(n.get("title", ""), 140)
        body = clean_text(n.get("contents", ""), 200)
        if title:
            out.append(
                {
                    "title": title,
                    "summary": body or title,
                    "url": n.get("url", ""),
                    "source": "steam-news",
                    "ts": n.get("date", 0),
                }
            )
    return out


def fetch_duckduckgo(query: str, limit: int = 5) -> list[dict[str, Any]]:
    """DDG lite HTML endpoint — no API key. Returns title/summary/url."""
    url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(query)
    raw = http_get(url, timeout=12)
    out: list[dict[str, Any]] = []
    if raw is None:
        return out
    text = raw.decode("utf-8", "replace")
    # result blocks: <a rel="nofollow" class="result__a" href="...">TITLE</a>
    # snippet: class="result__snippet" ... </a>
    for m in re.finditer(
        r'class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>(?:(?!class="result__a").)*?class="result__snippet"[^>]*>(.*?)</a>',
        text,
        re.S,
    ):
        href, title_html, snip_html = m.group(1), m.group(2), m.group(3)
        title = clean_text(title_html, 140)
        summary = clean_text(snip_html, 200)
        if title and looks_language_clean(title, "en"):
            out.append(
                {
                    "title": title,
                    "summary": summary,
                    "url": href,
                    "source": "duckduckgo",
                    "ts": time.time(),
                }
            )
        if len(out) >= limit:
            break
    return out


def gather_snippets(game_key: str, lang: str = "en") -> list[dict[str, Any]]:
    g = GAMES[game_key]
    seen_urls: set[str] = set()
    out: list[dict[str, Any]] = []
    for sub in g.get("reddit", []):
        for item in fetch_reddit(sub):
            if item["url"] not in seen_urls:
                seen_urls.add(item["url"])
                out.append(item)
    appid = g.get("steam_appid")
    if appid:
        for item in fetch_steam_news(appid):
            if item["url"] not in seen_urls:
                seen_urls.add(item["url"])
                out.append(item)
    for q in g.get("queries", []):
        for item in fetch_duckduckgo(q):
            if item["url"] not in seen_urls:
                seen_urls.add(item["url"])
                out.append(item)
    return out


# ── optional Ollama summarizer (strict, tiny, JSON mode) ─────────────────────
def ollama_available() -> str | None:
    """Return model name if a small qwen is served on localhost, else None."""
    host = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434")
    try:
        conn = socket.create_connection(("127.0.0.1", 11434), timeout=1.5)
        conn.close()
    except Exception:
        return None
    tags = http_get_json(f"{host}/api/tags", timeout=3) or {}
    models = [m.get("name", "") for m in tags.get("models", [])]
    for want in ("qwen2.5:3b", "qwen2.5:1.5b", "qwen2.5"):
        for m in models:
            if m.startswith(want):
                return m
    return models[0] if models else None


def ollama_summarize(prompt: str, model: str, host: str | None = None) -> str:
    """Ask Ollama for a strict-JSON summary. Returns raw text or ''."""
    host = host or os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434")
    body = json.dumps(
        {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {"temperature": 0.1, "num_predict": 512},
            "system": (
                "You are a JSON-only summarizer. Summarize the given gaming "
                "snippets. Output ONLY a JSON object with keys 'title' "
                "(string) and 'summary' (string). No extra keys, no markdown."
            ),
        }
    ).encode("utf-8")
    try:
        req = urllib.request.Request(
            f"{host}/api/generate",
            data=body,
            headers={"Content-Type": "application/json", "User-Agent": USER_AGENT},
        )
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode("utf-8", "replace"))
            return (data.get("response") or "").strip()
    except Exception:
        return ""


def extract_json_object(text: str) -> dict[str, Any] | None:
    """Best-effort strict JSON object extraction from a model reply."""
    if not text:
        return None
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text).rstrip("`").strip()
    try:
        obj = json.loads(text)
        return obj if isinstance(obj, dict) else None
    except Exception:
        pass
    m = re.search(r"\{.*\}", text, re.S)
    if m:
        try:
            obj = json.loads(m.group(0))
            return obj if isinstance(obj, dict) else None
        except Exception:
            return None
    return None


# ── local knowledge store (SQLite, zero network) ─────────────────────────────
def knowledge_cards(game_key: str, limit: int = 40, english_only: bool = True) -> list[dict[str, Any]]:
    """Read the app's own knowledge_cards store — real harvested content.
    english_only=True drops Persian/mixed legacy cards at the source."""
    db_path = os.environ.get(
        "AIGAMERIA_KB",
        os.path.join(os.path.dirname(ROOT), ".data", "aipetros.sqlite"),
    )
    out: list[dict[str, Any]] = []
    try:
        con = sqlite3.connect(db_path)
        rows = con.execute(
            "SELECT kind, title, body, url FROM knowledge_cards "
            "WHERE (game_id LIKE ? OR game_id LIKE ?) AND kind IN ('qa','trick','glitch') "
            "ORDER BY CASE kind WHEN 'qa' THEN 0 WHEN 'trick' THEN 1 ELSE 2 END, updated_at DESC LIMIT ?",
            (f"%{game_key}%", f"%{game_key.upper()}%", limit),
        ).fetchall()
        con.close()
        for kind, title, body, url in rows:
            t_clean = clean_text(title, 140)
            s_clean = clean_text(body or title, 200)
            if english_only and not (looks_language_clean(t_clean, "en") and looks_language_clean(s_clean, "en")):
                continue  # Persian/mixed legacy scraps never enter the core
            out.append(
                {
                    "title": t_clean,
                    "summary": s_clean,
                    "url": url or "",
                    "source": f"kb:{kind}",
                    "ts": time.time(),
                }
            )
    except Exception:
        pass
    return out


# ── deterministic structuring (fallback & always-on shaper) ──────────────────
def _card_id(game: str, i: int) -> str:
    return f"{game}-card-{i + 1:02d}"


def build_cards(game_key: str, snippets: list[dict[str, Any]], lang: str = "en") -> list[dict[str, Any]]:
    """cards: id, category, source_tag, title, summary, language.

    STRICT ENGLISH-ONLY CORE: any snippet that is not clean natural English
    (Persian scraps, mixed RTL/LTR legacy data) is excluded here. Target
    languages are handled by pipeline/translator_agent.py, never inline.
    """
    assert lang == "en", "canonical pipeline is English-only; use translator_agent for locales"
    cat_map = [
        ("update", re.compile(r"patch|update|note|balance|title update|hotfix", re.I)),
        ("meta", re.compile(r"meta|best|tier|formation|build|strategy|loadout", re.I)),
        ("trick", re.compile(r"trick|glitch|exploit|tutorial|timing|timing window|guide", re.I)),
    ]
    cards: list[dict[str, Any]] = []
    used_titles: set[str] = set()
    for snip in snippets[:24]:
        title = snip["title"]
        if title.lower() in used_titles:
            continue
        # English purity gate — non-English scraps are dropped, not kept mixed
        if not looks_language_clean(title, "en"):
            continue
        summary = snip["summary"] or title
        if not looks_language_clean(summary, "en"):
            continue
        blob = f"{title} {summary}"
        category = "general"
        for name, rx in cat_map:
            if rx.search(blob):
                category = name
                break
        summary = snip["summary"] or title
        if not looks_language_clean(summary, lang if lang == "fa" else "en"):
            # keep raw English (sources are English); fa UI handles translation
            summary = summary
        cards.append(
            {
                "id": _card_id(game_key, len(cards)),
                "category": category,
                "source_tag": snip["source"],
                "title": title,
                "summary": summary,
                "language": "en",
                "url": snip.get("url", ""),
                "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            }
        )
        used_titles.add(title.lower())
        if len(cards) >= 10:
            break
    if not cards:
        # deterministic evergreen fallback (English-only, honest about source)
        evergreen = [
            ("meta", "Check this week's official patch notes before queueing", "Balance changes rotate the meta every patch — verify your custom tactics against the latest notes."),
            ("training", "Green-window timing drill", "Practice 15 minutes daily on green timing windows; consistency beats full power."),
            ("meta", "Current formation meta snapshot", "Builds and formations shift with each patch — keep one flexible setup."),
        ]
        for cat, t, s in evergreen:
            cards.append(
                {
                    "id": _card_id(game_key, len(cards)),
                    "category": cat,
                    "source_tag": "evergreen",
                    "title": t,
                    "summary": s,
                    "language": "en",
                    "url": "",
                    "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                }
            )
    return cards


def build_coach_session(game_key: str, snippets: list[dict[str, Any]], lang: str = "en") -> dict[str, Any]:
    """English-only canonical coach session (locales via translator_agent)."""
    assert lang == "en", "canonical pipeline is English-only"
    g = GAMES[game_key]
    tips: list[str] = []
    timing_rx = re.compile(r"\b(timing|window|ms|second|bars?|45|angle|position)\b", re.I)
    for snip in snippets:
        s = snip["summary"]
        if timing_rx.search(s) and len(s) > 40 and looks_language_clean(s, "en"):
            tips.append(s)
        if len(tips) >= 5:
            break
    if not tips:
        # deterministic, sourced-from-KB or generic concrete fallbacks (EN only)
        kb = knowledge_cards(game_key)
        tips = [s["summary"] for s in kb[:8] if s["summary"] and looks_language_clean(s["summary"], "en")][:5]
    if not tips:
        tips = [
            "Green timing window beats full power on every shot type.",
            "First touch control, second touch shot — open goal only.",
        ]
    metrics = {"ovr": 88, "composure": 73, "risk_discipline": 79, "meta_awareness": 91}
    return {
        "title": f"{g['short']} — Pro coach class",
        "ovr": metrics["ovr"],
        "metrics": metrics,
        "suggested_questions": [
            f"What is the best formation for {g['short']} right now?",
            f"{g['short']} shooting timing after the latest patch?",
            f"Top mistakes to avoid in {g['short']} this week?",
        ],
        "tactical_tips": tips,
    }


def build_formation_board(game_key: str, snippets: list[dict[str, Any]], lang: str) -> dict[str, Any]:
    g = GAMES[game_key]
    formation = "4-2-3-1"
    for snip in snippets:
        m = re.search(r"\b(\d-\d-\d(?:-\d)?)\b", snip["title"] + " " + snip["summary"])
        if m:
            formation = m.group(1)
            break
    layout = {
        "4-2-3-1": [("GK", 50, 92), ("LB", 15, 72), ("CB", 36, 76), ("CB", 62, 76), ("RB", 85, 72),
                     ("CDM", 36, 56), ("CDM", 62, 56), ("LW", 22, 34), ("CAM", 50, 34), ("RW", 78, 34), ("ST", 50, 14)],
        "4-3-3": [("GK", 50, 92), ("LB", 15, 72), ("CB", 36, 76), ("CB", 62, 76), ("RB", 85, 72),
                  ("CM", 30, 54), ("CDM", 50, 58), ("CM", 70, 54), ("LW", 20, 30), ("ST", 50, 14), ("RW", 80, 30)],
        "3-5-2": [("GK", 50, 92), ("CB", 30, 76), ("CB", 50, 78), ("CB", 70, 76),
                  ("LM", 10, 52), ("CM", 32, 52), ("CDM", 50, 58), ("CM", 68, 52), ("RM", 90, 52),
                  ("ST", 40, 18), ("ST", 60, 18)],
        "4-4-1-1": [("GK", 50, 92), ("LB", 15, 72), ("CB", 36, 76), ("CB", 62, 76), ("RB", 85, 72),
                    ("LM", 20, 52), ("CM", 40, 56), ("CM", 60, 56), ("RM", 80, 52),
                    ("CAM", 50, 36), ("ST", 50, 16)],
    }
    slots = layout.get(formation, layout["4-2-3-1"])
    names = ["Courtois", "Mendy", "Rüdiger", "Militão", "Carvajal", "Tchouaméni",
             "Valverde", "Bellingham", "Vinícius", "Mbappé", "Rodrygo"]
    players = [
        {"name": names[i % len(names)], "number": i + 1, "role": role, "x": x, "y": y}
        for i, (role, x, y) in enumerate(slots)
    ]
    arrows = [
        {"from": players[5]["role"], "to": players[8]["role"], "type": "pass", "label": "line break"},
        {"from": players[8]["role"], "to": players[9]["role"], "type": "run", "label": "cut inside"},
    ]
    return {
        "team": g["name"],
        "formation": formation,
        "style": "Vertical counter-press",
        "description": "Auto-built from the freshest web meta snippets; roles follow the current patch meta.",
        "players": players,
        "tactical_arrows": arrows,
    }


def build_controller_combos(game_key: str, lang: str) -> dict[str, Any]:
    """Controller drill combos — deterministic, exact button sequences."""
    combos_by_realm = {
        "sports": {
            "drill_name": "Green-window finesse finishing",
            "duration_ms": 5200,
            "timeline_inputs": [
                {"t_ms": 0, "buttons": ["L1"], "note": "aim inside the box"},
                {"t_ms": 1800, "buttons": ["Left stick"], "note": "45° angle toward far post"},
                {"t_ms": 3600, "buttons": ["R1 + Circle/B"], "note": "hold to 2-3 bars, release on green"},
            ],
        },
        "shooter": {
            "drill_name": "Crosshair placement & peek timing",
            "duration_ms": 4800,
            "timeline_inputs": [
                {"t_ms": 0, "buttons": ["L1"], "note": "pre-aim head level"},
                {"t_ms": 1600, "buttons": ["R1"], "note": "2-3 round burst"},
                {"t_ms": 3200, "buttons": ["L2 + R1"], "note": "counter-strafe reset"},
            ],
        },
        "story": {
            "drill_name": "Heist approach timing",
            "duration_ms": 5600,
            "timeline_inputs": [
                {"t_ms": 0, "buttons": ["L2"], "note": "aim mode steady"},
                {"t_ms": 2000, "buttons": ["L1 + R2"], "note": "cover swap"},
                {"t_ms": 4000, "buttons": ["R3"], "note": "vehicle swap"},
            ],
        },
    }
    realm = GAMES[game_key]["realm"]
    base = combos_by_realm.get(realm, combos_by_realm["shooter"])
    out = {"game": GAMES[game_key]["name"]}
    out.update(base)
    out["platforms"] = ["PlayStation", "Xbox", "PC", "Tablet"]
    return out


# ── schema validation ────────────────────────────────────────────────────────
SCHEMA: dict[str, Any] = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "AIGAMERIA content bundle",
    "type": "object",
    "required": ["generated_at", "games"],
    "properties": {
        "generated_at": {"type": "string"},
        "generator": {"type": "string"},
        "games": {
            "type": "object",
            "minProperties": 1,
            "additionalProperties": {
                "type": "object",
                "required": ["cards", "coach_session", "formation_board", "controller_combos"],
                "properties": {
                    "cards": {
                        "type": "array",
                        "minItems": 1,
                        "items": {
                            "type": "object",
                            "required": ["id", "category", "source_tag", "title", "summary", "language"],
                            "properties": {
                                "id": {"type": "string"},
                                "category": {"type": "string"},
                                "source_tag": {"type": "string"},
                                "title": {"type": "string", "minLength": 3},
                                "summary": {"type": "string", "minLength": 3},
                                "language": {"enum": ["fa", "en"]},
                                "url": {"type": "string"},
                                "fetched_at": {"type": "string"},
                            },
                        },
                    },
                    "coach_session": {
                        "type": "object",
                        "required": ["title", "ovr", "metrics", "suggested_questions", "tactical_tips"],
                        "properties": {
                            "title": {"type": "string"},
                            "ovr": {"type": "integer", "minimum": 0, "maximum": 100},
                            "metrics": {"type": "object"},
                            "suggested_questions": {"type": "array", "items": {"type": "string"}},
                            "tactical_tips": {"type": "array", "minItems": 1, "items": {"type": "string", "minLength": 10}},
                        },
                    },
                    "formation_board": {
                        "type": "object",
                        "required": ["team", "formation", "style", "description", "players", "tactical_arrows"],
                        "properties": {
                            "team": {"type": "string"},
                            "formation": {"type": "string"},
                            "style": {"type": "string"},
                            "description": {"type": "string"},
                            "players": {
                                "type": "array",
                                "minItems": 1,
                                "items": {
                                    "type": "object",
                                    "required": ["name", "number", "x", "y"],
                                    "properties": {
                                        "name": {"type": "string"},
                                        "number": {"type": "integer", "minimum": 1},
                                        "role": {"type": "string"},
                                        "x": {"type": "number", "minimum": 0, "maximum": 100},
                                        "y": {"type": "number", "minimum": 0, "maximum": 100},
                                    },
                                },
                            },
                            "tactical_arrows": {"type": "array"},
                        },
                    },
                    "controller_combos": {
                        "type": "object",
                        "required": ["game", "drill_name", "duration_ms", "platforms", "timeline_inputs"],
                        "properties": {
                            "game": {"type": "string"},
                            "drill_name": {"type": "string"},
                            "duration_ms": {"type": "integer", "minimum": 100},
                            "platforms": {
                                "type": "array",
                                "items": {"enum": ["PlayStation", "Xbox", "PC", "Tablet"]},
                            },
                            "timeline_inputs": {
                                "type": "array",
                                "minItems": 1,
                                "items": {
                                    "type": "object",
                                    "required": ["t_ms", "buttons"],
                                    "properties": {
                                        "t_ms": {"type": "integer", "minimum": 0},
                                        "buttons": {"type": "array", "items": {"type": "string"}},
                                        "note": {"type": "string"},
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
}


def validate_bundle(bundle: dict[str, Any]) -> tuple[bool, str]:
    if _HAS_JSONSCHEMA:
        try:
            jsonschema.validate(bundle, SCHEMA)
            return True, "jsonschema OK"
        except jsonschema.ValidationError as e:  # type: ignore[attr-defined]
            return False, f"schema error at {list(e.absolute_path or ['<root>'])}: {e.message}"
        except Exception as e:
            return False, f"jsonschema failed: {e}"
    # stdlib fallback validator
    try:
        if not isinstance(bundle.get("games"), dict) or not bundle["games"]:
            return False, "games object missing"
        for gkey, g in bundle["games"].items():
            assert isinstance(g, dict), gkey
            assert len(g.get("cards", [])) >= 1, f"{gkey}: cards empty"
            for c in g["cards"]:
                assert {"id", "category", "source_tag", "title", "summary", "language"} <= set(c), f"{gkey}: card fields"
                assert c["language"] in ("fa", "en")
                assert len(c["title"]) >= 3 and len(c["summary"]) >= 3
            cs = g["coach_session"]
            assert {"title", "ovr", "metrics", "suggested_questions", "tactical_tips"} <= set(cs), f"{gkey}: coach_session fields"
            assert 0 <= cs["ovr"] <= 100
            assert cs["tactical_tips"] and all(len(t) >= 10 for t in cs["tactical_tips"])
            fb = g["formation_board"]
            assert {"team", "formation", "style", "description", "players", "tactical_arrows"} <= set(fb), f"{gkey}: formation fields"
            assert fb["players"] and all(0 <= p["x"] <= 100 and 0 <= p["y"] <= 100 for p in fb["players"])
            cc = g["controller_combos"]
            assert {"game", "drill_name", "duration_ms", "platforms", "timeline_inputs"} <= set(cc), f"{gkey}: combos fields"
            assert cc["timeline_inputs"] and all(isinstance(i["t_ms"], int) and i["t_ms"] >= 0 for i in cc["timeline_inputs"])
        return True, "stdlib validator OK"
    except AssertionError as e:
        return False, f"schema error: {e}"
    except Exception as e:
        return False, f"validator failed: {e}"


# ── pipeline ─────────────────────────────────────────────────────────────────
def build_bundle(game_keys: list[str], lang: str = "en") -> tuple[dict[str, Any], list[str]]:
    """Canonical bundle is ALWAYS English (lang param kept for CLI compat).
    Locale bundles are produced by pipeline/translator_agent.py."""
    lang = "en"
    ollama_model = ollama_available()
    host = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434")
    errors: list[str] = []
    games: dict[str, Any] = {}

    for key in game_keys:
        if key not in GAMES:
            errors.append(f"unknown game key {key}")
            continue
        snippets = gather_snippets(key)
        if not snippets:
            snippets = knowledge_cards(key)
        cards = build_cards(key, snippets, lang)

        coach = build_coach_session(key, snippets, lang)
        if ollama_model and snippets:
            sample = json.dumps(snippets[:6], ensure_ascii=False)[:3000]
            reply = ollama_summarize(
                "Summarize these snippets into one title and one summary for "
                f"{GAMES[key]['name']}. Snippets: {sample}",
                ollama_model,
                host,
            )
            obj = extract_json_object(reply)
            if obj and obj.get("title"):
                coach["tactical_tips"] = (
                    [f"{obj.get('summary', '')}"] + coach["tactical_tips"]
                )[:5]
            else:
                errors.append(f"{key}: ollama reply rejected, used rule-based")

        games[key] = {
            "cards": cards,
            "coach_session": coach,
            "formation_board": build_formation_board(key, snippets, lang),
            "controller_combos": build_controller_combos(key, lang),
        }

    bundle = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "generator": "aigameria-generator 1.0 (rule-based" + (f" + {ollama_model})" if ollama_model else ")"),
        "games": games,
    }
    return bundle, errors


def publish(bundle: dict[str, Any]) -> tuple[bool, str]:
    ok, msg = validate_bundle(bundle)
    if not ok:
        return False, msg
    os.makedirs(LIVE_DIR, exist_ok=True)
    tmp = LIVE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(bundle, f, ensure_ascii=False, indent=2)
    if os.path.exists(LIVE_FILE):
        # rotate: previous live becomes .bak fallback
        try:
            os.replace(LIVE_FILE, BAK_FILE)
        except Exception:
            pass
    os.replace(tmp, LIVE_FILE)
    # publish for the web app (frontend at 192.168.1.50 reads /data/api-data.json)
    try:
        os.makedirs(APP_PUBLIC, exist_ok=True)
        tmp2 = APP_TARGET + ".tmp"
        with open(tmp2, "w", encoding="utf-8") as f:
            json.dump(bundle, f, ensure_ascii=False, indent=2)
        os.replace(tmp2, APP_TARGET)
    except Exception as e:
        return True, f"live OK (app publish skipped: {e})"
    return True, msg


def main() -> int:
    parser = argparse.ArgumentParser(description="AIGAMERIA content generator")
    parser.add_argument("--check-only", action="store_true", help="validate existing data.json")
    parser.add_argument("--game", action="append", help="limit to specific game key(s)")
    parser.add_argument("--lang", default="en", choices=["fa", "en"])
    args = parser.parse_args()

    if args.check_only:
        try:
            with open(LIVE_FILE, encoding="utf-8") as f:
                bundle = json.load(f)
        except Exception as e:
            print(f"FAIL cannot read {LIVE_FILE}: {e}")
            return 2
        ok, msg = validate_bundle(bundle)
        print(("OK " if ok else "FAIL ") + msg)
        return 0 if ok else 1

    t0 = time.time()
    keys = args.game or list(GAMES.keys())
    bundle, errors = build_bundle(keys, args.lang)
    ok, msg = publish(bundle)
    report = {
        "ran_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "duration_s": round(time.time() - t0, 1),
        "games": {k: len(v["cards"]) for k, v in bundle["games"].items()},
        "published": ok,
        "validator": msg,
        "errors": errors,
    }
    os.makedirs(os.path.dirname(REPORT_FILE), exist_ok=True)
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(json.dumps(report, ensure_ascii=False))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
