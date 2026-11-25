#!/usr/bin/env python3
"""AIPETROS World 10k Knowledge Engine — Step 3: build the RAG search DB.

SQLite FTS5 (tokenize porter unicode61) over all harvested chunks.
Exposes query_db(query, platform=None, limit=8) — sub-50ms on 100k+ rows.

Usage:
  python3 build_10k_rag_db.py --build
  python3 build_10k_rag_db.py --query "smoke site a" --platform PC
"""
import argparse
import glob
import json
import sqlite3
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
DB = HERE / "knowledge_10k.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS chunks_meta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL, name TEXT NOT NULL, platform TEXT NOT NULL,
  kind TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
  source_url TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_chunks_game ON chunks_meta(game_id);
CREATE INDEX IF NOT EXISTS ix_chunks_platform ON chunks_meta(platform);
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
  title, body, content='chunks_meta', content_rowid='id',
  tokenize = "porter unicode61"
);
CREATE TRIGGER IF NOT EXISTS trg_chunks_ai AFTER INSERT ON chunks_meta BEGIN
  INSERT INTO chunks_fts(rowid, title, body) VALUES (new.id, new.title, new.body);
END;
"""

PLATFORM_CLASSES = ("PC", "Console", "Mobile")


def build():
    con = sqlite3.connect(DB)
    con.executescript(SCHEMA)
    have = {r[0] for r in con.execute("SELECT m.source_url || '|' || m.title FROM chunks_meta m")}
    n = 0
    for shard in glob.glob(str(DATA / "guides_shard_*.jsonl")):
        with open(shard, encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                c = json.loads(line)
                key = c.get("source_url", "") + "|" + c.get("title", "")
                if key in have:
                    continue
                con.execute(
                    "INSERT INTO chunks_meta (game_id, name, platform, kind, title, body, source_url, updated_at) VALUES (?,?,?,?,?,?,?,?)",
                    (c["game_id"], c["name"], c.get("platform", "PC"), c.get("kind", "guide"),
                     c["title"], c["body"], c.get("source_url", ""), c.get("updated_at", "")),
                )
                n += 1
    con.commit()
    total = con.execute("SELECT COUNT(*) FROM chunks_meta").fetchone()[0]
    con.close()
    print(f"[rag] +{n} new chunks; total {total} in {DB}")


def query_db(query: str, platform: str | None = None, limit: int = 8):
    """Sub-50ms FTS5 lookup. platform in {PC, Console, Mobile, Mobile_Tablet} or None."""
    t0 = time.perf_counter()
    # sanitize FTS5 query: strip operator chars, quote remaining tokens
    import re
    tokens = re.findall(r"[\w؀-ۿ]+", query)
    query = " ".join(f'"{t}"' for t in tokens) or query
    con = sqlite3.connect(DB)
    sql = """
      SELECT m.game_id, m.name, m.platform, m.kind, m.title, m.body, m.source_url,
             bm25(chunks_fts) AS rank
      FROM chunks_fts f JOIN chunks_meta m ON m.id = f.rowid
      WHERE chunks_fts MATCH ?
    """
    params = [query]
    if platform:
        like = platform if platform.startswith(PLATFORM_CLASSES) else f"{platform}%"
        sql += " AND m.platform LIKE ?"
        params.append(f"%{like.split('_')[0]}%")
    sql += " ORDER BY rank LIMIT ?"
    params.append(limit)
    rows = con.execute(sql, params).fetchall()
    took = (time.perf_counter() - t0) * 1000
    con.close()
    return {
        "took_ms": round(took, 2),
        "results": [
            {"game_id": r[0], "name": r[1], "platform": r[2], "kind": r[3],
             "title": r[4], "body": r[5], "source_url": r[6]}
            for r in rows
        ],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--build", action="store_true")
    ap.add_argument("--query", type=str, default=None)
    ap.add_argument("--platform", type=str, default=None)
    args = ap.parse_args()
    if args.build:
        build()
    elif args.query:
        print(json.dumps(query_db(args.query, args.platform), ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
