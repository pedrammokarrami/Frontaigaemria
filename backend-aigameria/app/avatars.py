"""Style taxonomy + style-matched .glb avatar delivery (AVA voice/speech).

Style keys map to distinct avatar models; per-game overrides win when present;
fallback is always a valid style/default .glb — never a broken path.
"""
from typing import Any

from .db import get_db

STYLE_GLB: dict[str, str] = {
    # style_key → self-hosted model path (served from the same origin)
    "shooter": "/models/avatars/Soldier.glb",          # tactical operator
    "battle_royale": "/models/avatars/Soldier.glb",
    "mobile_competitive": "/models/avatars/Xbot.glb",  # agile mobile competitor
    "sports": "/models/avatars/Michelle.glb",          # athletic
    "sports_court": "/models/avatars/Michelle.glb",
    "story": "/models/avatars/Xbot.glb",               # story character rig
    "strategy": "/models/avatars/RobotExpressive.glb", # commander/moba
    "moba": "/models/avatars/RobotExpressive.glb",
    "racing": "/models/avatars/Soldier.glb",
    "default": "/media/avatar.glb",                    # existing generic avatar
}

STYLE_FOR_GENRE: dict[str, str] = {
    "shooter": "shooter",
    "battle_royale": "battle_royale",
    "sports": "sports",
    "sports_court": "sports_court",
    "story": "story",
    "rpg": "story",
    "adventure": "story",
    "strategy": "strategy",
    "moba": "moba",
    "racing": "racing",
    "mobile_competitive": "mobile_competitive",
}


def style_key_for(game: dict[str, Any]) -> str:
    genre = str(game.get("genre", "")).lower()
    if genre in STYLE_FOR_GENRE:
        return STYLE_FOR_GENRE[genre]
    realm = str(game.get("realm", "")).lower()
    if realm in STYLE_FOR_GENRE:
        return STYLE_FOR_GENRE[realm]
    return "default"


def resolve_avatar(game: dict[str, Any], animation_state: str = "idle") -> dict[str, Any]:
    """Style-matched avatar descriptor for AVA voice/speech playback."""
    style = style_key_for(game)
    glb = STYLE_GLB.get(style, STYLE_GLB["default"])
    override = game.get("avatar_override")
    if override:
        glb = override  # per-game custom override wins
    return {
        "style_key": style,
        "glb_url": glb,
        "animation_state": animation_state if animation_state in ("speaking", "listening", "idle") else "idle",
    }
