#!/usr/bin/env python3
"""AIPETROS World 10k Knowledge Engine — Step 2: guide harvest.

Resumable, keyless. For each catalog game:
  * speedrun.com API -> real guides list (title + URL) [official community guides]
  * Wikipedia REST   -> gameplay/overview extract
Chunks are written to data/guides_shard_*.jsonl:
  {game_id, name, platform, kind, title, body, source_url, updated_at}

Usage:
  python3 harvest_10k_guides.py --max-games 500 --delay 0.35
"""
import argparse
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
CATALOG = sorted(DATA.glob("catalog_shard_*.jsonl"))
GUIDES = DATA / "guides_shard_000.jsonl"
PROGRESS = DATA / "harvest_progress.json"
UA = {"User-Agent": "AIPETROS-KnowledgeEngine/1.0"}


def get_json(url, timeout=15):
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.load(r)
    except Exception:
        return None


def strategywiki(title: str):
    """StrategyWiki MediaWiki API — real walkthroughs, maps, controls, strategies."""
    try:
        params = urllib.parse.urlencode({
            "action": "query", "list": "search", "srsearch": title,
            "srlimit": 3, "format": "json"})
        data = get_json(f"https://strategywiki.org/w/api.php?{params}")
        hits = (data or {}).get("query", {}).get("search", [])
        if not hits:
            return None
        top = hits[0]["title"]
        eparams = urllib.parse.urlencode({
            "action": "query", "prop": "extracts", "explaintext": "1",
            "exchars": "2500", "titles": top, "format": "json"})
        edata = get_json(f"https://strategywiki.org/w/api.php?{eparams}")
        pages = (edata or {}).get("query", {}).get("pages", {})
        for _, p in pages.items():
            extract = (p.get("extract") or "").strip()
            if extract:
                url = "https://strategywiki.org/wiki/" + urllib.parse.quote(top.replace(" ", "_"))
                return {"title": top, "url": url, "extract": extract}
    except Exception:
        return None
    return None


def srd_game(name):
    d = get_json("https://www.speedrun.com/api/v1/games?max=1&name=" + urllib.parse.quote(name))
    return ((d or {}).get("data") or [None])[0]


def srd_guides(game_id):
    d = get_json(f"https://www.speedrun.com/api/v1/games/{game_id}/guides?max=20")
    return (d or {}).get("data") or []


def wiki_extract(name):
    d = get_json("https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(name.replace(" ", "_")))
    if not d:
        return None
    return {"title": d.get("title", name), "body": (d.get("extract") or "")[:600],
            "url": d.get("content_urls", {}).get("desktop", {}).get("page", "")}


# Priority franchises — newest release first, harvested before the long tail
PRIORITY_GAMES = [
    "EA Sports FC 27", "eFootball 2027", "NBA 2K27", "MLB The Show 27", "F1 25",
    "Counter-Strike 2", "Valorant", "Call of Duty: Modern Warfare III", "Call of Duty: Black Ops 7",
    "Apex Legends", "Fortnite", "PUBG: Battlegrounds", "Overwatch 2", "Rainbow Six Siege",
    "Dota 2", "League of Legends", "Dota Underlords", "StarCraft II",
    "Elden Ring", "Grand Theft Auto V", "Grand Theft Auto VI", "Red Dead Redemption 2",
    "The Legend of Zelda: Breath of the Wild", "Super Mario Odyssey", "Mario Kart 8 Deluxe",
    "The Witcher 3: Wild Hunt", "Cyberpunk 2077", "Baldur's Gate 3", "Minecraft",
    "Rocket League", "Madden NFL 26", "UFC 5", "WWE 2K25", "Forza Horizon 5", "Gran Turismo 7",
    "Hearthstone", "Clash Royale", "Clash of Clans", "PUBG Mobile", "Genshin Impact",
]

def load_progress():
    try:
        return json.loads(PROGRESS.read_text(encoding="utf-8"))
    except Exception:
        return {"done": []}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-games", type=int, default=500)
    ap.add_argument("--delay", type=float, default=0.35)
    args = ap.parse_args()

    catalog = []
    seen_ids = set()
    # priority franchises first (newest releases), then the full long tail
    for name in PRIORITY_GAMES:
        gid = name.lower().replace(" ", "-")[:60]
        if gid in seen_ids:
            continue
        seen_ids.add(gid)
        catalog.append({"game_id": gid, "name": name, "platforms": ["PC"], "released": "2026", "source_url": ""})
    for shard in CATALOG:
        with shard.open(encoding="utf-8") as f:
            for line in f:
                rec = json.loads(line)
                if rec["game_id"] not in seen_ids:
                    seen_ids.add(rec["game_id"])
                    catalog.append(rec)
    progress = load_progress()
    done = set(progress["done"])

    out = GUIDES.open("a", encoding="utf-8")
    processed = 0
    for rec in catalog:
        if processed >= args.max_games:
            break
        if rec["game_id"] in done:
            continue
        chunks = []
        # StrategyWiki — real walkthroughs / maps / controls / strategies (keyless)
        sw = strategywiki(rec["name"])
        if sw:
            chunks.append({
                "game_id": rec["game_id"], "name": rec["name"], "platform": ",".join(rec["platforms"]),
                "kind": "strategy_guide", "title": sw["title"], "body": sw["extract"][:2500],
                "source_url": sw["url"], "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            })
            time.sleep(args.delay)
        # speedrun.com guides — official community guides with stable URLs
        g = srd_game(rec["name"])
        if g:
            for gd in srd_guides(g.get("id", "")):
                chunks.append({
                    "game_id": rec["game_id"], "name": rec["name"], "platform": ",".join(rec["platforms"]),
                    "kind": "guide", "title": gd.get("name", "guide"),
                    "body": (gd.get("text", "") or "official speedrun guide")[:500],
                    "source_url": gd.get("video", "") or g.get("weblink", ""),
                    "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                })
            time.sleep(args.delay)
        # Wikipedia overview (always available)
        w = wiki_extract(rec["name"])
        if w and w["body"]:
            chunks.append({
                "game_id": rec["game_id"], "name": rec["name"], "platform": ",".join(rec["platforms"]),
                "kind": "overview", "title": w["title"], "body": w["body"],
                "source_url": w["url"], "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            })
        for c in chunks:
            out.write(json.dumps(c, ensure_ascii=False) + "\n")
        done.add(rec["game_id"])
        processed += 1
        progress["done"] = sorted(done)
        PROGRESS.write_text(json.dumps(progress), encoding="utf-8")
        time.sleep(args.delay)
    out.close()
    print(f"[harvest] processed {processed} new games this pass; total done {len(done)}")


if __name__ == "__main__":
    main()
