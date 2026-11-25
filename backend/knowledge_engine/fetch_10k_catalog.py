#!/usr/bin/env python3
"""AIPETROS World 10k Games Knowledge Engine — Step 1: catalog fetch.

Zero-cost, keyless first (--source wikidata). IGDB optional via env creds.
Writes backend/knowledge_engine/data/catalog_shard_*.jsonl with one record per
game: {game_id (slug), name, platforms, released, source_url}.

Usage:
  python3 fetch_10k_catalog.py --source wikidata --limit 10000
  python3 fetch_10k_catalog.py --source igdb --limit 10000   # needs IGDB creds in env
"""
import argparse
import hashlib
import json
import os
import re
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
DATA.mkdir(parents=True, exist_ok=True)

WDQS = "https://query.wikidata.org/sparql"
UA = {"User-Agent": "AIPETROS-KnowledgeEngine/1.0 (zero-cost builder)"}

PLATFORM_MAP = {
    "Q1406": "PC", "Q638362": "PC",
    "Q10680": "PS5_console", "Q10683": "PS5_console", "Q10677": "Console_PlayStation",
    "Q133982408": "PS5_console",
    "Q10874": "Console_Xbox", "Q705541": "Console_Xbox",
    "Q1563887": "Console_Switch", "Q115498878": "Console_Switch2",
    "Q48263": "Mobile_Android", "Q48440": "Mobile_iOS",
    "Q48318": "Mobile_Tablet",
}


def normalize_platforms(qids):
    out = set()
    for q in qids or []:
        p = PLATFORM_MAP.get(q.replace("http://www.wikidata.org/entity/", ""))
        if p:
            out.add(p)
    if not out:
        out = {"PC"}
    return sorted(out)


def slugify(name):
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or hashlib.sha1(name.encode()).hexdigest()[:12]


def fetch_wikidata(limit: int):
    query = f"""
SELECT ?game ?gameLabel ?platform ?released WHERE {{
  ?game wdt:P31/wdt:P279* wd:Q7889 .
  ?game rdfs:label ?gameLabel .
  FILTER(LANG(?gameLabel) = "en")
  OPTIONAL {{ ?game wdt:P400 ?platform . }}
  OPTIONAL {{ ?game wdt:P577 ?released . }}
}}
LIMIT {max(200, min(limit, 10000))}
"""
    url = WDQS + "?" + urllib.parse.urlencode({"query": query, "format": "json"})
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = json.load(resp)
    games = {}
    for b in body.get("results", {}).get("bindings", []):
        gid = b.get("game", {}).get("value", "")
        label = b.get("gameLabel", {}).get("value", "")
        if not gid or not label:
            continue
        if label.startswith("Q") and label[1:].isdigit():
            continue  # no real English label — skip
        rec = games.setdefault(gid, {
            "name": label,
            "platforms": set(),
            "released": None,
            "source_url": gid,
        })
        if b.get("platform", {}).get("value"):
            rec["platforms"].add(b["platform"]["value"])
        rel = b.get("released", {}).get("value", "")
        if rel and not rec["released"]:
            rec["released"] = rel[:4]
    rows = []
    for gid, rec in games.items():
        rows.append({
            "game_id": slugify(rec["name"]),
            "name": rec["name"],
            "platforms": normalize_platforms(rec["platforms"]),
            "released": rec["released"] if rec["released"] and rec["released"].isdigit() else None,
            "source_url": rec["source_url"],
        })
    # Prioritize the NEWEST franchise releases first (FC 27 over FC 26, etc.)
    rows.sort(key=lambda r: (r.get("released") or "0000"), reverse=True)
    return rows


def fetch_igdb(limit: int):
    cid, secret = os.environ.get("IGDB_CLIENT_ID"), os.environ.get("IGDB_CLIENT_SECRET")
    if not cid or not secret:
        raise SystemExit("IGDB creds missing: set IGDB_CLIENT_ID / IGDB_CLIENT_SECRET or use --source wikidata")
    body = urllib.parse.urlencode({
        "client_id": cid, "client_secret": secret, "grant_type": "client_credentials"
    }).encode()
    with urllib.request.urlopen(urllib.request.Request("https://id.twitch.tv/oauth2/token", data=body), timeout=30) as r:
        token = json.load(r)["access_token"]
    rows, offset = [], 0
    while len(rows) < limit:
        q = (f"fields name,platforms.name,first_release_date.url; limit 500; offset {offset};"
             f" sort first_release_date desc;")
        req = urllib.request.Request(
            "https://api.igdb.com/v4/games", data=q.encode(),
            headers={"Client-ID": cid, "Authorization": f"Bearer {token}", **UA})
        with urllib.request.urlopen(req, timeout=30) as r:
            batch = json.load(r)
        if not batch:
            break
        for g in batch:
            plats = sorted({("Mobile_" + p["name"]) if p["name"] in ("iOS", "Android") else ("Console_" + p["name"]) if any(x in p["name"] for x in ("PlayStation", "Xbox", "Switch")) else "PC" for p in g.get("platforms", [])})
            rows.append({"game_id": slugify(g["name"]), "name": g["name"], "platforms": plats or ["PC"],
                         "released": (g.get("first_release_date") or {}).get("url", ""), "source_url": f"https://www.igdb.com/games/{slugify(g['name'])}"})
        offset += 500
    return rows[:limit]


def shard_write(rows):
    shard, per = 0, 500
    files = []
    for i in range(0, len(rows), per):
        p = DATA / f"catalog_shard_{shard:03}.jsonl"
        with p.open("w", encoding="utf-8") as f:
            for row in rows[i:i + per]:
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
        files.append(str(p))
        shard += 1
    return files


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", choices=["wikidata", "igdb"], default="wikidata")
    ap.add_argument("--limit", type=int, default=10000)
    args = ap.parse_args()
    rows = fetch_wikidata(args.limit) if args.source == "wikidata" else fetch_igdb(args.limit)
    files = shard_write(rows)
    print(f"[catalog] {len(rows)} games via {args.source} -> {len(files)} shards in {DATA}")


if __name__ == "__main__":
    main()
