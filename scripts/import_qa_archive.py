#!/usr/bin/env python3
"""Import the 101-games Q&A archive into the AIPETROS knowledge_cards store.

Parses  all_101_games_questions_archive_en.txt  (or any similar archive) and
stores every Q/A as a `qa` card in SQLite with the game's official wiki/guide
URLs preserved as the source. Idempotent (upsert by game+dedupe key).

Usage:
  python3 scripts/import_qa_archive.py --file path/to/archive.txt
  python3 scripts/import_qa_archive.py --file ... --dry-run
"""
import argparse
import json
import re
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_FILE = ROOT / ".data" / "aipetros.sqlite"

GAME_RE = re.compile(r"^GAME #\d+:\s*(.+)$")
FIELD_RE = re.compile(r"^([A-Za-z][A-Za-z ]+):\s*(.*)$")
Q_RE = re.compile(r"^Q\d+:\s*(.+)$")
A_RE = re.compile(r"^A:\s*(.+)$")

# Archive game titles -> our knowledge-engine game ids (slug)
SLUG_OVERRIDES = {
    "VALORANT": "valorant",
    "Counter-Strike 2": "cs2",
    "EA SPORTS FC 27": "fc27",
    "FIFA 27": "fc27",
    "eFootball": "efootball",
    "NBA 2K27": "nba2k",
    "MLB The Show 27": "mlb",
    "F1 25": "f1-25",
    "Call of Duty": "cod",
    "Call of Duty: Modern Warfare": "cod",
    "GTA V": "gta",
    "Grand Theft Auto V": "gta",
    "Grand Theft Auto VI": "gta",
    "Dota 2": "dota2",
    "League of Legends": "league-of-legends",
    "Eugene": "gta",
    "EA SPORTS FC 27 (and EA SPORTS FC 26)": "fc27",
    "EA SPORTS FC 26": "fc27",
    "Call of Duty: Modern Warfare 4 / Warzone HQ": "cod",
    "Forza Horizon 6": "forza-horizon",
    "Farming Simulator 25": "farming-simulator",
    "EA Sports College Football 26": "college-football",
    "Madden NFL 26": "madden-nfl",
    "WWE 2K25": "wwe-2k25",
    "UFC 5": "ufc-5",
    "EA Sports FC 25": "fc27",
    "NBA 2K26": "nba2k",
    "NBA 2K25": "nba2k",
    "eFootball 2026": "efootball",
}


def slugify(name: str) -> str:
    if name in SLUG_OVERRIDES:
        return SLUG_OVERRIDES[name]
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s


def ensure_schema(con):
    con.executescript("""
    CREATE TABLE IF NOT EXISTS knowledge_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL, kind TEXT NOT NULL, dedupe_key TEXT NOT NULL,
      title TEXT NOT NULL, body TEXT NOT NULL, source TEXT NOT NULL, url TEXT DEFAULT '',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ux_knowledge_cards ON knowledge_cards(game_id, kind, dedupe_key);
    """)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    text = Path(args.file).read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()

    games = []  # {title, slug, meta:{}, wiki, guides}
    cur = None
    pending_q = None

    for line in lines:
        line = line.rstrip()
        mg = GAME_RE.match(line)
        if mg:
            title = mg.group(1).strip()
            cur = {"title": title, "slug": slugify(title), "fields": {}, "wiki": "", "guides": ""}
            games.append(cur)
            pending_q = None
            continue
        if cur is None:
            continue
        if line.startswith("Q") and Q_RE.match(line):
            pending_q = Q_RE.match(line).group(1).strip()
            continue
        if line.startswith("A:") and pending_q is not None:
            answer = A_RE.match(line).group(1).strip()
            mf = FIELD_RE.match(line)
            if mf:
                cur["fields"][mf.group(1).strip().lower()] = mf.group(2).strip()
            cur.setdefault("qa", []).append((pending_q, answer))
            pending_q = None
            continue
        mf = FIELD_RE.match(line)
        if mf:
            key = mf.group(1).strip().lower()
            val = mf.group(2).strip()
            if key.startswith("wiki"):
                cur["wiki"] = val
            elif key.startswith("guides"):
                cur["guides"] = val
            else:
                cur["fields"][key] = val

    total_qa = sum(len(g.get("qa", [])) for g in games)
    print(f"[import] parsed {len(games)} games / {total_qa} Q&A pairs")
    if args.dry_run:
        for g in games[:5]:
            print(" -", g["slug"], "|", g["title"], "| qa:", len(g.get("qa", [])))
        return

    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_FILE)
    ensure_schema(con)
    now = "2026-11-22T00:00:00Z"
    inserted = 0
    for g in games:
        source = f"archive:101-games ({g['title']})"
        url = g.get("guides") or g.get("wiki") or ""
        for q, a in g.get("qa", []):
            key = re.sub(r"[^a-z0-9]+", "-", q.lower())[:120]
            body = a
            meta = g.get("fields", {})
            if meta.get("metric"):
                body = f"{a}\n\nPlayer metric (Nov 2026): {meta['metric']} — source: {meta.get('metric source','')}"
            con.execute(
                """INSERT INTO knowledge_cards (game_id, kind, dedupe_key, title, body, source, url, created_at, updated_at)
                   VALUES (?, 'qa', ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(game_id, kind, dedupe_key) DO UPDATE SET
                     body=excluded.body, source=excluded.source, url=excluded.url, updated_at=excluded.updated_at""",
                (g["slug"], key, q, body, source, url, now, now),
            )
            inserted += 1
        # player metric as its own card so the coach can cite it
        if g.get("fields", {}).get("metric"):
            con.execute(
                """INSERT INTO knowledge_cards (game_id, kind, dedupe_key, title, body, source, url, created_at, updated_at)
                   VALUES (?, 'meta', 'player-metric', ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(game_id, kind, dedupe_key) DO UPDATE SET
                     body=excluded.body, updated_at=excluded.updated_at""",
                (g["slug"], f"{g['title']} player metric (Nov 2026)",
                 g["fields"]["metric"] + f" — {g['fields'].get('metric source','')}",
                 source, g["fields"].get("metric source", ""), now, now),
            )
            inserted += 1
    con.commit()
    con.close()
    print(f"[import] stored {inserted} cards in {DB_FILE}")


if __name__ == "__main__":
    main()
