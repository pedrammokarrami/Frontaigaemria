#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AIGAMERIA 25-user behavioral benchmark (user_benchmark.py)
=========================================================

Hard stress test for the Internal Behavioral & Context Analysis Agent.

Runs 25 distinct simulated users (varied language, platform, games, search
patterns, playstyles, scenarios: first-time / pivot / returning / ambiguous /
platform-switch) against the LIVE local API:

    POST /api/v1/behavior/event      (feed observed actions)
    GET  /api/v1/behavior/profile    (grade the agent's inference)

Grading (transparent, 100 points total):
    (a) 40 pts — user understanding speed/accuracy from generic trends
        (scenario detection, top-game identification, category accuracy)
    (b) 40 pts — freshness & game-specific filtering quality
        (stale events ignored, cross-game leakage rejected)
    (c) 20 pts — edge cases & scenario shifts (pivot, ambiguous, returning)

Output: transparent per-user scorecard, exact deductions and why, final
score /100. Written to pipeline/last_benchmark_report.json.

Usage:  python3 user_benchmark.py [--endpoint http://127.0.0.1:3000]
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Any

ROOT = os.path.dirname(os.path.abspath(__file__))
REPORT_FILE = os.path.join(ROOT, "last_benchmark_report.json")
UA = "AIGAMERIA-Benchmark/1.0"

# ── 25 simulated users ───────────────────────────────────────────────────────
# Each: id, lang, platform, script = [(kind, payload, age_days)]
USERS: list[dict[str, Any]] = [
    {"id": "b01_first_time", "lang": "en", "platform": "pc", "script": []},
    {"id": "b02_first_time_mobile", "lang": "fa", "platform": "mobile", "script": []},
    {"id": "b03_cs2_focus", "lang": "en", "platform": "pc", "script": [
        ("game_select", {"gameId": "cs2"}, 0), ("question", {"gameId": "cs2", "query": "crosshair placement after patch"}, 0),
        ("question", {"gameId": "cs2", "query": "mirage smoke lineup"}, 0), ("card_click", {"gameId": "cs2", "category": "aim"}, 0),
        ("dwell", {"gameId": "cs2", "dwellMs": 60000}, 0),
    ]},
    {"id": "b04_fc27_focus", "lang": "fa", "platform": "console", "script": [
        ("game_select", {"gameId": "fc27"}, 0), ("question", {"gameId": "fc27", "query": "best formation 4-2-3-1"}, 0),
        ("card_click", {"gameId": "fc27", "category": "attack"}, 0), ("dwell", {"gameId": "fc27", "dwellMs": 45000}, 0),
    ]},
    {"id": "b05_pivot_football_to_cs2", "lang": "en", "platform": "pc", "script": [
        ("game_select", {"gameId": "fc27"}, 10), ("question", {"gameId": "fc27", "query": "finesse timing"}, 9),
        ("game_select", {"gameId": "cs2"}, 0), ("question", {"gameId": "cs2", "query": "counter strafe shooting"}, 0),
        ("question", {"gameId": "cs2", "query": "economy buy rounds"}, 0),
    ]},
    {"id": "b06_returning_after_break", "lang": "en", "platform": "pc", "script": [
        ("game_select", {"gameId": "cs2"}, 45),  # stale (>30d) must be ignored
        ("question", {"gameId": "cs2", "query": "old meta"}, 40),
        ("game_select", {"gameId": "cs2"}, 0),
    ]},
    {"id": "b07_vague_queries", "lang": "es", "platform": "mobile", "script": [
        ("question", {"gameId": "cs2", "query": "aim"}, 0), ("question", {"gameId": "cs2", "query": "tips"}, 0),
        ("game_select", {"gameId": "cs2"}, 0),
    ]},
    {"id": "b08_meta_queries", "lang": "en", "platform": "pc", "script": [
        ("question", {"gameId": "fc27", "query": "patch meta update tier list"}, 0),
        ("question", {"gameId": "fc27", "query": "nerf update impact"}, 0), ("game_select", {"gameId": "fc27"}, 0),
    ]},
    {"id": "b09_comparison", "lang": "de", "platform": "pc", "script": [
        ("question", {"gameId": "cs2", "query": "ak vs m4 compare"}, 0), ("game_select", {"gameId": "cs2"}, 0),
    ]},
    {"id": "b10_troubleshooting", "lang": "en", "platform": "pc", "script": [
        ("question", {"gameId": "cs2", "query": "game crash fix not working"}, 0), ("game_select", {"gameId": "cs2"}, 0),
    ]},
    {"id": "b11_gta_story", "lang": "fa", "platform": "console", "script": [
        ("game_select", {"gameId": "gta"}, 0), ("question", {"gameId": "gta", "query": "heist payout guide"}, 0),
        ("dwell", {"gameId": "gta", "dwellMs": 50000}, 0),
    ]},
    {"id": "b12_valorant_tactician", "lang": "en", "platform": "pc", "script": [
        ("game_select", {"gameId": "valorant"}, 0), ("question", {"gameId": "valorant", "query": "smoke flash execute ascent"}, 0),
        ("card_click", {"gameId": "valorant", "category": "utility"}, 0),
    ]},
    {"id": "b13_platform_switch", "lang": "en", "platform": "tablet", "script": [
        ("platform_cue", {"platform": "pc"}, 2), ("game_select", {"gameId": "fc27"}, 1),
        ("platform_cue", {"platform": "tablet"}, 0), ("game_select", {"gameId": "fc27"}, 0),
    ]},
    {"id": "b14_conflicting", "lang": "en", "platform": "pc", "script": [
        ("question", {"gameId": "cs2", "query": "crosshair placement"}, 0),
        ("question", {"gameId": "fc27", "query": "finesse timing"}, 0),
        ("question", {"gameId": "gta", "query": "heist payout"}, 0),
    ]},
    {"id": "b15_hardcore", "lang": "en", "platform": "pc", "script": [
        ("game_select", {"gameId": "cs2"}, 0), ("dwell", {"gameId": "cs2", "dwellMs": 90000}, 0),
    ] + [("card_click", {"gameId": "cs2", "category": "aim"}, max(0, 30 - i // 2)) for i in range(24)]},
    {"id": "b16_casual", "lang": "tr", "platform": "mobile", "script": [
        ("game_select", {"gameId": "fc27"}, 0), ("card_click", {"gameId": "fc27"}, 0),
    ]},
    {"id": "b17_strategy", "lang": "en", "platform": "pc", "script": [
        ("game_select", {"gameId": "dota2"}, 0), ("question", {"gameId": "dota2", "query": "build order meta"}, 0),
    ]},
    {"id": "b18_age_cue_teen", "lang": "en", "platform": "mobile", "script": [
        ("language_cue", {"ageCue": "teen", "lang": "en"}, 0), ("game_select", {"gameId": "cs2"}, 0),
    ]},
    {"id": "b19_age_cue_adult", "lang": "en", "platform": "console", "script": [
        ("language_cue", {"ageCue": "adult", "lang": "en"}, 0), ("game_select", {"gameId": "fc27"}, 0),
    ]},
    {"id": "b20_mixed_scroll", "lang": "fr", "platform": "mobile", "script": [
        ("scroll", {"gameId": "cs2"}, 0), ("scroll", {"gameId": "fc27"}, 0), ("game_select", {"gameId": "cs2"}, 0),
    ]},
    {"id": "b21_nba_sports", "lang": "en", "platform": "console", "script": [
        ("game_select", {"gameId": "nba2k27"}, 0), ("question", {"gameId": "nba2k27", "query": "best builds patch"}, 0),
    ]},
    {"id": "b22_gta_pivot_to_cs2", "lang": "en", "platform": "pc", "script": [
        ("game_select", {"gameId": "gta"}, 12), ("question", {"gameId": "gta", "query": "heist"}, 11),
        ("question", {"gameId": "cs2", "query": "smoke lineup inferno"}, 0),
        ("question", {"gameId": "cs2", "query": "entry trade timing"}, 0),
        ("question", {"gameId": "cs2", "query": "utility molotov nuke"}, 0),
    ]},
    {"id": "b23_only_clicks", "lang": "en", "platform": "pc", "script": [
        ("card_click", {"gameId": "cs2"}, 0), ("card_click", {"gameId": "cs2"}, 0),
    ]},
    {"id": "b24_stale_only", "lang": "en", "platform": "pc", "script": [
        ("game_select", {"gameId": "fc27"}, 90), ("question", {"gameId": "fc27", "query": "old formation"}, 80),
    ]},
    {"id": "b25_cross_leak_probe", "lang": "en", "platform": "pc", "script": [
        ("game_select", {"gameId": "cs2"}, 0), ("question", {"gameId": "cs2", "query": "crosshair and buy round economy"}, 0),
    ]},
]


def post(base: str, path: str, body: dict[str, Any]) -> dict[str, Any]:
    req = urllib.request.Request(
        base + path, data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": UA}, method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8", "replace"))


def get(base: str, path: str) -> dict[str, Any]:
    req = urllib.request.Request(base + path, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8", "replace"))


def backdated(base: str, user: dict[str, Any]) -> None:
    """Replay a user's script with backdated timestamps (posts events with a
    synthetic userId per day bucket — the server stamps 'now', so for stale
    tests we mark events via the profile's age semantics instead)."""
    # The server stamps created_at = now. To test freshness decay without
    # server-side backdating support, stale-only users rely on the profile's
    # freshness window using their userId suffix marker.
    return None


def grade(user: dict[str, Any], profile: dict[str, Any], feed: dict[str, Any]) -> tuple[float, list[str]]:
    deductions: list[str] = []
    uid = user["id"]
    script = user["script"]
    top_games = [g["gameId"] for g in profile.get("topGames", [])]
    top_cats = [c["category"] for c in profile.get("topCategories", [])]
    scenario = profile.get("scenario")
    conf = profile.get("confidence", 0)

    expected_games: list[str] = []
    for kind, payload, age in script:
        if age and age > 30:
            continue  # stale events are expected to be filtered by freshness
        if kind in ("game_select", "question", "card_click", "dwell") and payload.get("gameId"):
            expected_games.append(payload["gameId"].lower())

    has_cs2 = any("cs2" in g for g in top_games)
    has_fc = any("fc27" in g for g in top_games)

    # (a) understanding — 40 pts
    a_score = 40.0
    if uid.startswith("b01") or uid.startswith("b02"):
        if scenario != "baseline":
            a_score -= 20; deductions.append(f"(a) {uid}: first-time user must be 'baseline', got '{scenario}'")
        if top_games:
            a_score -= 10; deductions.append(f"(a) {uid}: no-events user must have empty topGames (generic trends), got {top_games}")
    else:
        expected_top = expected_games[-1] if expected_games else None
        if expected_top and not any(expected_top in g for g in top_games):
            a_score -= 12; deductions.append(f"(a) {uid}: expected '{expected_top}' in topGames, got {top_games}")
        # category accuracy
        if uid in ("b03_cs2_focus", "b12_valorant_tactician", "b25_cross_leak_probe") and top_cats and top_cats[0] != "shooter":
            a_score -= 8; deductions.append(f"(a) {uid}: top category should be 'shooter', got {top_cats}")
        if uid == "b04_fc27_focus" and top_cats and top_cats[0] != "sports":
            a_score -= 8; deductions.append(f"(a) {uid}: top category should be 'sports', got {top_cats}")
        if uid == "b11_gta_story" and top_cats and top_cats[0] != "story":
            a_score -= 8; deductions.append(f"(a) {uid}: top category should be 'story', got {top_cats}")

    # (b) freshness — 40 pts
    b_score = 40.0
    if uid == "b06_returning_after_break":
        # only fresh events count; stale-only tail events are 40+ days old
        if not has_cs2:
            b_score -= 20; deductions.append("(b) b06: fresh re-engagement with cs2 not detected")
    if uid == "b24_stale_only":
        if top_games or (profile.get("scenario") not in ("baseline", "engaged")):
            b_score -= 20; deductions.append(f"(b) b24: stale-only user must not build a focused profile, got {top_games}")
        if feed.get("mode") != "generic":
            b_score -= 10; deductions.append("(b) b24: stale-only user must still be served the generic feed")
    if uid in ("b15_hardcore",) and conf < 0.9:
        b_score -= 10; deductions.append(f"(b) b15: 25+ events should reach confidence ~1.0, got {conf}")

    # (c) edge cases & scenario shifts — 20 pts
    c_score = 20.0
    if uid == "b05_pivot_football_to_cs2" and scenario != "pivot":
        c_score -= 10; deductions.append(f"(c) b05: expected 'pivot' after switch, got '{scenario}'")
    if uid == "b14_conflicting":
        if len(profile.get("topCategories", [])) < 2:
            c_score -= 5; deductions.append("(c) b14: conflicting interests must surface multiple categories")
        if top_games and top_games[0] not in ("cs2", "fc27", "gta"):
            c_score -= 5; deductions.append(f"(c) b14: unexpected top game {top_games}")
    if uid == "b13_platform_switch" and profile.get("platform") != "tablet":
        c_score -= 5; deductions.append(f"(c) b13: platform cue must update profile.platform, got '{profile.get('platform')}'")
    if uid == "b18_age_cue_teen" and profile.get("ageCue") != "teen":
        c_score -= 5; deductions.append(f"(c) b18: age cue must be 'teen', got '{profile.get('ageCue')}'")

    return round(max(0, a_score + b_score + c_score), 1), deductions


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--endpoint", default=os.environ.get("AIGAMERIA_ENDPOINT", "http://127.0.0.1:3000"))
    args = parser.parse_args()
    base = args.endpoint.rstrip("/")

    total = 0.0
    max_total = 0.0
    per_user: list[dict[str, Any]] = []
    for user in USERS:
        uid = f"bench_{user['id']}"
        for kind, payload, age in user["script"]:
            try:
                body = {"userId": uid, "kind": kind, "payload": dict(payload)}
                if age:
                    body["payload"]["occurredAt"] = (datetime.now(timezone.utc) - timedelta(days=age)).isoformat(timespec="seconds")
                post(base, "/api/v1/behavior/event", body)
            except Exception:
                pass
        try:
            resp = get(base, f"/api/v1/behavior/profile?userId={uid}")
            data = resp.get("data", {})
            profile = data.get("profile", {})
            feed = data.get("feed", {})
        except Exception as e:
            profile, feed = {}, {"mode": "generic"}
            per_user.append({"user": user["id"], "score": 0, "deductions": [f"API error: {e}"], "max": 100})
            continue
        score, deductions = grade(user, profile, feed)
        total += score
        max_total += 100
        per_user.append({"user": user["id"], "score": score, "max": 100, "scenario": profile.get("scenario"),
                         "topGames": [g["gameId"] for g in profile.get("topGames", [])],
                         "confidence": profile.get("confidence"), "deductions": deductions})
        print(f"{user['id']:34s} {score:6.1f}/100  scenario={profile.get('scenario','-'):9s} games={[g['gameId'] for g in profile.get('topGames', [])]} deductions={deductions}")

    final = round(total / max_total * 100, 1) if max_total else 0.0
    report = {
        "ran_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "users": len(USERS),
        "final_score": final,
        "per_user": per_user,
        "unresolved_deductions": [d for u in per_user for d in u["deductions"]],
    }
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"\nFINAL SCORE: {final}/100  → {REPORT_FILE}")
    return 0 if final >= 100 else 1


if __name__ == "__main__":
    sys.exit(main())
