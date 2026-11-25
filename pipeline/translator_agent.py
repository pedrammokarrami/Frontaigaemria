#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AIGAMERIA translation agent (translator_agent.py)
================================================

Translates the canonical English bundle (/data/api-data.json — the ONLY
source of truth) into any UI language and caches locale bundles at
/data/i18n/api-data.<lang>.json (published to public/data/i18n/ so the
frontend fetches them instantly; cache-hit costs zero CPU/RAM).

Translation strategy (low-resource, zero-cost):
  1. Ollama (if running locally, e.g. qwen2.5:1.5b) — temperature 0.1,
     strict JSON mode.
  2. Free public endpoint (MyMemory) with retry + timeout — no API key.
  3. Final fallback: bundle copied as-is with `"language": "<target>"` and a
     `"translation": "passthrough"` marker — JSON NEVER breaks.

Protected tokens (never translated, restored verbatim after translation):
player names (Mbappé, Vinícius, Bellingham, …), formation codes (4-3-3),
controller buttons (L1, R1, Circle/B, X/A, LT/RT, LS/RS), numbers, and JSON
keys/URLs/roles/x-y coordinates.

RTL languages (fa, ar) get automatic bidi punctuation fixing: Western
punctuation adjacent to RTL text is normalized, and display-level isolation
is the frontend's job (the frontend already sets `dir` on render roots).

Usage:
    python3 translator_agent.py --lang fa        # build one locale bundle
    python3 translator_agent.py --lang fa,ar,es  # several locales
    python3 translator_agent.py --all            # all configured locales
    python3 translator_agent.py --clear-cache    # drop cached bundles
"""

from __future__ import annotations

import argparse
import copy
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from typing import Any

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


CORE_FILE = os.path.join(ROOT, "data", "live", "data.json")
I18N_DIR = os.path.join(ROOT, "data", "i18n")
APP_I18N_DIR = os.path.join(
    os.environ.get("AIGAMERIA_PUBLIC_DIR", os.path.join(os.path.dirname(ROOT), "public", "data")),
    "i18n",
)

USER_AGENT = "AIGAMERIA-Translator/1.0"

RTL_LANGS = {"fa", "ar", "he", "ur"}
CONFIGURED_LOCALES = ["fa", "ar", "es", "fr", "de", "tr"]

# ── token protection ─────────────────────────────────────────────────────────
TOKEN_RX = re.compile(
    r"("
    r"\b(?:L1|R1|L2|R2|L3|R3|LT|RT|LB|RB|LS|RS|Circle/B|X/A|Cross|Square|Triangle)\b"
    r"|\b\d(?:-\d)+(?:-\d)?\b"                    # formation codes 4-3-3, 4-2-3-1
    r"|\b\d{2,4}\s?ms\b|\b\d+\s?(?:bars?|fps|%\}|percent)\b"
    r"|\b(?:Mbappé|Mbappe|Vinícius|Vinicius|Bellingham|Rüdiger|Militão|Tchouaméni|Rodrygo|Valverde|Courtois|Mendy|Carvajal)\b"
    r"|\b\d+(?:\.\d+)?\b"                          # plain numbers & coordinates
    r"|\b(?:PlayStation|Xbox|PC|Tablet|OVR|CDM|CAM|ST|GK|LB|RB|CB|LW|RW|CM)\b"
    r")"
)

_PLACEHOLDER = "\u2063{}\u2063"  # invisible separator wrap


def protect_tokens(text: str) -> tuple[str, dict[str, str]]:
    mapping: dict[str, str] = {}
    def repl(m: re.Match) -> str:
        token = m.group(0)
        ph = f"\u2063{len(mapping)}\u2063"
        mapping[ph] = token
        return ph
    return TOKEN_RX.sub(repl, text), mapping


def restore_tokens(text: str, mapping: dict[str, str]) -> str:
    for ph, token in mapping.items():
        text = text.replace(ph, token)
    # strip any stray invisible separators
    return text.replace("\u2063", "")


def fix_rtl_punctuation(text: str, lang: str) -> str:
    """Normalize Western punctuation at RTL boundaries; keep bidi stable."""
    if lang not in RTL_LANGS:
        return text
    # isolate trailing Latin punctuation after an RTL run (RLM keeps it attached
    # to the RTL word instead of flipping to the LTR side)
    rlm = "\u200f"
    text = re.sub(r"([\u0600-\u06ff])([.,;:!?])(\s)", lambda m: m.group(1) + rlm + m.group(2) + m.group(3), text)
    return text


# ── translation backends ─────────────────────────────────────────────────────
def ollama_translate(text: str, target: str, model: str, host: str | None = None) -> str:
    host = host or os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434")
    protected, mapping = protect_tokens(text)
    body = json.dumps({
        "model": model,
        "prompt": (
            f"Translate to language code '{target}'. Keep placeholders like "
            f"\u20630\u2063 untouched. Output ONLY the translated text."
            f"\n\n{protected}"
        ),
        "stream": False,
        "options": {"temperature": 0.1},
    }).encode("utf-8")
    try:
        req = urllib.request.Request(
            f"{host}/api/generate", data=body,
            headers={"Content-Type": "application/json", "User-Agent": USER_AGENT},
        )
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode("utf-8", "replace"))
        out = (data.get("response") or "").strip()
        return restore_tokens(out, mapping)
    except Exception:
        return ""


def gtx_translate(text: str, target: str) -> str:
    """Google translate gtx endpoint (free, no key) — primary web fallback.
    Retry ×2 with short timeout; returns '' on any failure."""
    protected, mapping = protect_tokens(text)
    for attempt in range(2):
        try:
            url = (
                "https://translate.googleapis.com/translate_a/single?client=gtx"
                f"&sl=en&tl={target}&dt=t&q=" + urllib.parse.quote(protected[:900])
            )
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode("utf-8", "replace"))
            parts = data[0]
            out = "".join(p[0] for p in parts if p and p[0])
            if out:
                return fix_rtl_punctuation(restore_tokens(out, mapping), target)
        except Exception:
            pass
    return ""




def cloudflare_translate(text: str, target: str) -> str:
    """Cloudflare Workers AI (free quota) — llama-3.2-3b via REST, no Worker proxy needed."""
    import os as _os
    token = _os.environ.get("CLOUDFLARE_AI_TOKEN")
    account = _os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    if not token or not account:
        return ""
    protected, mapping = protect_tokens(text)
    body = json.dumps({
        "messages": [
            {"role": "system", "content": "You translate gaming UI text. Keep placeholders like ⁣0⁣ unchanged. Output ONLY the translation."},
            {"role": "user", "content": protected},
        ],
        "max_tokens": 400,
    }).encode("utf-8")
    for attempt in range(2):
        try:
            req = urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/@cf/meta/llama-3.2-3b-instruct",
                data=body,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json", "User-Agent": USER_AGENT},
            )
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8", "replace"))
            out = (data.get("result", {}) or {}).get("choices", [{}])[0].get("message", {}).get("content", "")
            if out:
                return fix_rtl_punctuation(restore_tokens(out.strip(), mapping), target)
        except Exception:
            pass
    return ""


def freeweb_translate(text: str, target: str) -> str:
    """Free translation chain: gtx → Cloudflare Workers AI → MyMemory → ''."""
    out = gtx_translate(text, target)
    if out:
        return out
    out = cloudflare_translate(text, target)
    if out:
        return out
    protected, mapping = protect_tokens(text)
    for attempt in range(2):
        try:
            url = (
                "https://api.mymemory.translated.net/get?q="
                + urllib.parse.quote(protected[:480])
                + f"&langpair=en|{target}"
            )
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode("utf-8", "replace"))
            out = (data.get("responseData", {}) or {}).get("translatedText", "")
            if out and "MYMEMORY WARNING" not in out:
                return fix_rtl_punctuation(restore_tokens(out, mapping), target)
        except Exception:
            pass
    return ""


def ollama_model_name() -> str | None:
    host = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434")
    try:
        import socket
        socket.create_connection(("127.0.0.1", 11434), timeout=1.0).close()
    except Exception:
        return None
    try:
        with urllib.request.urlopen(f"{host}/api/tags", timeout=3) as resp:
            tags = json.loads(resp.read().decode("utf-8", "replace"))
        models = [m.get("name", "") for m in tags.get("models", [])]
        for want in ("qwen2.5:3b", "qwen2.5:1.5b", "qwen2.5"):
            for m in models:
                if m.startswith(want):
                    return m
        return models[0] if models else None
    except Exception:
        return None


def translate_text(text: str, target: str, model: str | None) -> str:
    if model:
        out = ollama_translate(text, target, model)
        if out:
            return out
    out = freeweb_translate(text, target)
    if out:
        return out
    return ""  # caller falls back to passthrough


# ── bundle translation ───────────────────────────────────────────────────────
TEXT_PATHS: list[tuple[tuple[str, ...], bool]] = [
    # (path, is_player_facing) — only human-facing strings get translated
    (("games",), False),  # marker; real traversal is generic below
]


def walk_strings(node: Any, path: tuple[str, ...] = ()) -> list[tuple[tuple[str, ...], str]]:
    """Collect (path, value) for translatable human-facing string leaves."""
    out: list[tuple[tuple[str, ...], str]] = []
    if isinstance(node, dict):
        for k, v in node.items():
            out.extend(walk_strings(v, path + (str(k),)))
    elif isinstance(node, list):
        for i, v in enumerate(node):
            out.extend(walk_strings(v, path + (f"[{i}]",)))
    elif isinstance(node, str):
        # keys that are never translated
        skip_keys = {"id", "url", "language", "source_tag", "category", "generated_at",
                     "generator", "source", "fetched_at", "role", "buttons", "x", "y",
                     "t_ms", "duration_ms", "ovr", "number", "formation", "game"}
        key = path[-1] if path else ""
        if key in skip_keys:
            return out
        if len(node) >= 4 and re.search(r"[A-Za-z]", node):
            out.append((path, node))
    return out


def apply_translations(bundle: dict[str, Any], pairs: dict[tuple[str, ...], str]) -> dict[str, Any]:
    out = copy.deepcopy(bundle)
    for path, value in pairs.items():
        node: Any = out
        try:
            for step in path[:-1]:
                node = node[step]
            node[path[-1]] = value
        except Exception:
            continue
    return out


def translate_bundle(core: dict[str, Any], target: str, model: str | None) -> dict[str, Any]:
    pairs_list = walk_strings(core)
    translated: dict[tuple[str, ...], str] = {}
    budget = 220  # hard per-run translation budget: keeps runtime bounded
    for path, value in pairs_list:
        if budget <= 0:
            break
        out = translate_text(value, target, model)
        if out:
            translated[path] = out
            budget -= 1
    bundle = apply_translations(core, translated)
    bundle["language"] = target
    bundle["rtl"] = target in RTL_LANGS
    bundle["translation"] = "partial" if translated else "passthrough"
    bundle["translated_strings"] = len(translated)
    bundle["generated_at"] = core.get("generated_at")
    return bundle


def locale_path(target: str) -> str:
    return os.path.join(I18N_DIR, f"api-data.{target}.json")


def build_locale(target: str, force: bool = False) -> tuple[bool, str]:
    try:
        with open(CORE_FILE, encoding="utf-8") as f:
            core = json.load(f)
    except Exception as e:
        return False, f"cannot read core bundle: {e}"

    os.makedirs(I18N_DIR, exist_ok=True)
    os.makedirs(APP_I18N_DIR, exist_ok=True)
    dst = locale_path(target)
    if os.path.exists(dst) and not force:
        try:
            with open(dst, encoding="utf-8") as f:
                cached = json.load(f)
            if cached.get("generated_at") == core.get("generated_at"):
                return True, f"{target}: cache-hit (up to date)"
        except Exception:
            pass

    model = ollama_model_name()
    bundle = translate_bundle(core, target, model)
    tmp = dst + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(bundle, f, ensure_ascii=False, indent=2)
    os.replace(tmp, dst)
    try:
        app_dst = os.path.join(APP_I18N_DIR, f"api-data.{target}.json")
        tmp2 = app_dst + ".tmp"
        with open(tmp2, "w", encoding="utf-8") as f:
            json.dump(bundle, f, ensure_ascii=False, indent=2)
        os.replace(tmp2, app_dst)
    except Exception:
        pass
    engine = "ollama" if model else "freeweb/passthrough"
    return True, f"{target}: built ({engine}, {bundle['translated_strings']} strings, rtl={bundle['rtl']})"


def clear_cache() -> int:
    removed = 0
    for d in (I18N_DIR, APP_I18N_DIR):
        if os.path.isdir(d):
            for name in os.listdir(d):
                if name.startswith("api-data.") and name.endswith(".json"):
                    os.remove(os.path.join(d, name))
                    removed += 1
    print(f"removed {removed} cached locale bundles")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="AIGAMERIA translation agent")
    parser.add_argument("--lang", help="comma-separated locale codes (fa,ar,es,…)")
    parser.add_argument("--all", action="store_true", help="all configured locales")
    parser.add_argument("--force", action="store_true", help="ignore cache")
    parser.add_argument("--clear-cache", action="store_true")
    args = parser.parse_args()

    if args.clear_cache:
        return clear_cache()

    targets = CONFIGURED_LOCALES if args.all else (
        [s.strip() for s in args.lang.split(",")] if args.lang else ["fa"]
    )
    failures = 0
    for target in targets:
        ok, msg = build_locale(target, force=args.force)
        print(("OK " if ok else "FAIL ") + msg)
        if not ok:
            failures += 1
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
