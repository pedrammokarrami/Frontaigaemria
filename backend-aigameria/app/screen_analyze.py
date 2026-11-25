"""Screen-aware photo/video-frame analysis — phone photo of a TV/monitor.

Lightweight, RAM-safe (2GB budget), zero external AI:
1. Pillow pre-processing: downscale, autocontrast, glare normalization.
2. Screen ROI focus: brightness-projection detection of the bright display
   rectangle inside a dark room background.
3. OCR via pytesseract when the tesseract binary is available (graceful
   degrade to hint-based matching otherwise).
4. Platform prompt detection (PS L3/Circle/Touchpad vs Xbox/PC).
5. Temporary files are ALWAYS deleted in a finally block — never persisted.
"""
import io
import logging
import os
import re
import tempfile
from typing import Any

log = logging.getLogger("aigameria.vision")

MAX_UPLOAD_BYTES = 12 * 1024 * 1024
MAX_DIM = 1000

PS_PROMPTS = ("l3", "r3", "circle", "touchpad", "r2", "l2", "square", "triangle", "cross button")
XBOX_PROMPTS = ("lb", "rb", "rt", "lt", "xbox", "b button", "a button")
PC_PROMPTS = ("wasd", "left click", "right click", "scroll")


def _lazy_pil():
    from PIL import Image, ImageOps

    return Image, ImageOps


def load_and_preprocess(raw: bytes) -> dict[str, Any]:
    """Decode, downscale, autocontrast. RAM-safe: small image only."""
    Image, ImageOps = _lazy_pil()
    img = Image.open(io.BytesIO(raw))
    img = img.convert("RGB")
    if max(img.size) > MAX_DIM:
        img.thumbnail((MAX_DIM, MAX_DIM))
    gray = ImageOps.autocontrast(img.convert("L"), cutoff=2)
    return {"img": img, "gray": gray}


def find_screen_roi(gray) -> dict[str, int]:
    """Locate the bright display rectangle via brightness projections.

    Cheap approach (no numpy): mean brightness per row/column; the screen is
    the contiguous band around the brightest column/row exceeding a threshold.
    """
    w, h = gray.size
    px = gray.load()
    step_x = max(1, w // 200)
    step_y = max(1, h // 200)
    col_mean = [sum(px[x, y] for y in range(0, h, step_y)) / len(range(0, h, step_y)) for x in range(0, w, step_x)]
    row_mean = [sum(px[x, y] for x in range(0, w, step_x)) / len(range(0, w, step_x)) for y in range(0, h, step_y)]
    sxs = list(range(0, w, step_x))
    sys_ = list(range(0, h, step_y))
    thr_c = max(col_mean) * 0.72
    thr_r = max(row_mean) * 0.72
    ci = col_mean.index(max(col_mean))
    ri = row_mean.index(max(row_mean))
    left = ci
    while left > 0 and col_mean[left - 1] >= thr_c:
        left -= 1
    right = ci
    while right < len(col_mean) - 1 and col_mean[right + 1] >= thr_c:
        right += 1
    top = ri
    while top > 0 and row_mean[top - 1] >= thr_r:
        top -= 1
    bottom = ri
    while bottom < len(row_mean) - 1 and row_mean[bottom + 1] >= thr_r:
        bottom += 1
    return {
        "left": sxs[max(0, left - 1)], "top": sys_[max(0, top - 1)],
        "right": sxs[min(len(sxs) - 1, right + 1)], "bottom": sys_[min(len(sys_) - 1, bottom + 1)],
        "found": (right - left) * step_x >= w * 0.25 and (bottom - top) * step_y >= h * 0.2,
    }


def ocr_screen(img, gray) -> str:
    """OCR the screen ROI with glare normalization. Returns '' when OCR is
    unavailable (tesseract not installed) — callers fall back to hints."""
    try:
        import pytesseract
        from PIL import Image, ImageOps
    except Exception:
        log.info("pytesseract/Pillow unavailable — hint-based matching only")
        return ""
    Image, ImageOps = _lazy_pil()
    roi = gray.crop((0, 0, gray.size[0], gray.size[1]))
    norm = ImageOps.equalize(roi)
    try:
        text = pytesseract.image_to_string(norm, config="--psm 6")
        return re.sub(r"\s+", " ", text).strip()
    except Exception as exc:
        log.warning("ocr failed (tesseract missing or errored): %s", exc)
        return ""


def detect_platform_prompt(text: str) -> dict[str, Any]:
    blob = text.lower()
    ps_exclusive = [p for p in ("l3", "r3", "touchpad", "circle") if re.search(rf"\b{p}\b", blob)]
    if ps_exclusive:
        return {"platform": "ps5", "prompt_buttons": ps_exclusive}
    def has(tok: str) -> bool:
        return re.search(rf"\b{re.escape(tok)}\b", blob) is not None
    ps = [p for p in PS_PROMPTS if has(p)]
    xb = [p for p in XBOX_PROMPTS if has(p)]
    pc = [p for p in PC_PROMPTS if has(p)]
    if len(ps) >= len(xb) and len(ps) >= len(pc) and ps:
        return {"platform": "ps5", "prompt_buttons": ps[:6]}
    if xb:
        return {"platform": "xbox", "prompt_buttons": xb[:6]}
    if pc:
        return {"platform": "pc", "prompt_buttons": pc[:6]}
    return {"platform": "", "prompt_buttons": []}


def analyze_photo(raw: bytes, hints: dict[str, str] | None = None) -> dict[str, Any]:
    """Full vision pass. hints: user-supplied free text (chat box), used when
    OCR cannot read the screen. Never writes video files; uploads are kept in
    memory only."""
    hints = hints or {}
    pre = load_and_preprocess(raw)
    roi = find_screen_roi(pre["gray"])
    hud_text = ocr_screen(pre["img"], pre["gray"])
    if not hud_text:
        hud_text = hints.get("text", "")
    prompt = detect_platform_prompt(hud_text + " " + hints.get("text", ""))
    return {
        "screen_roi": roi,
        "hud_text": hud_text[:600],
        "platform": prompt["platform"] or hints.get("platform", ""),
        "prompt_buttons": prompt["prompt_buttons"],
        "ocr_available": bool(hud_text and not hints.get("text") == hud_text),
    }


def cleanup_temp(path: str | None) -> bool:
    """Immediate temp-file removal (uploads never persist)."""
    if not path:
        return False
    try:
        if not os.path.exists(path):
            return False
        os.unlink(path)
        return True
    except OSError:
        return False


def save_temp_upload(raw: bytes) -> str:
    """Only used for oversized uploads that must be spooled to disk; caller
    MUST pass the path to cleanup_temp in a finally block."""
    fd, path = tempfile.mkstemp(suffix=".upload", prefix="aigameria-")
    try:
        with os.fdopen(fd, "wb") as fh:
            fh.write(raw)
    except Exception:
        cleanup_temp(path)
        raise
    return path
