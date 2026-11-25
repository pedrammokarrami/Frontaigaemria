"""Strict gameId isolation + language safety.

Law: football data can NEVER enter a non-football game's response; every
record is bound to its game_id; unknown game → isolated empty/404 response —
never another game's data.
"""
from typing import Any

PERSIAN_RX = None  # compiled lazily to avoid a global regex dependency

FOOTBALL_GAMES = {"fc27", "fc26", "fc25", "fifa", "efootball"}

GAME_REALMS: dict[str, str] = {
    "cs2": "shooter",
    "warzone": "shooter",
    "valorant": "shooter",
    "apex": "shooter",
    "fc27": "sports",
    "fc26": "sports",
    "efootball": "sports",
    "nba2k": "sports_court",
    "dota2": "strategy",
    "lol": "strategy",
}

# Football vocabulary that must never appear in a non-football response.
FOOTBALL_MARKERS = (
    "4-3-3", "4-2-3-1", "4-3-3 (2)", "real madrid", "madrid", "mbapp", "vinicius",
    "bellingham", "haland", "haaland", "fullback", "winger", "striker", "penalty box",
    "dribl", "header", "finesse", "goalkeeper", "midfield", "press after sideways",
    "sbc", "fut ", "ultimateteam", "ultimate team",
)


def is_football_game(game_id: str) -> bool:
    return game_id.lower().strip() in FOOTBALL_GAMES


def is_known_game(game_id: str) -> bool:
    gid = game_id.lower().strip()
    return gid in GAME_REALMS


def assert_isolated(game_id: str, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Defense-in-depth filter: drop any record whose game_id differs from the
    requested game, and (for non-football games) any record containing
    football vocabulary. Callers use this as the final gate before responses."""
    gid = game_id.lower().strip()
    football = is_football_game(gid)
    out: list[dict[str, Any]] = []
    for item in items:
        if str(item.get("game_id", "")).lower() != gid:
            continue
        if not football:
            blob = " ".join(str(v) for v in item.values() if isinstance(v, str)).lower()
            if any(marker in blob for marker in FOOTBALL_MARKERS):
                continue
        out.append(item)
    return out


def sanitize_en_text(text: str) -> str:
    """EN output must never leak Persian script or raw repo slugs."""
    out = "".join(ch for ch in text if not ("\u0600" <= ch <= "\u06FF" or "\uFB50" <= ch <= "\uFEFF"))
    return " ".join(out.split())
