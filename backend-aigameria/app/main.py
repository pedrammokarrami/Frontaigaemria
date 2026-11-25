"""AIGAMERIA API — FastAPI entrypoint (Linux systemd / Docker ready)."""
import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path

from fastapi import FastAPI

from . import config, db
from .routes import router
from .seed_sync import run_sync

LOG_DIR = Path(config.DB_PATH).parent / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
handler = RotatingFileHandler(
    LOG_DIR / "api.log", maxBytes=config.LOG_MAX_BYTES, backupCount=config.LOG_KEEP
)
logging.basicConfig(level=logging.INFO, handlers=[handler, logging.StreamHandler()])

app = FastAPI(title="AIGAMERIA API", version="1.0.0")
app.include_router(router)


@app.on_event("startup")
def startup() -> None:
    db.init_db()
    # Initial + idempotent sync (upsert by dedupe_key; safe to re-run).
    inserted = run_sync()
    # Expired cache sweep — disk hygiene on every boot.
    from . import cache as cache_mod

    cache_mod.sweep_expired()
    logging.getLogger("aigameria").info("startup sync done, topics upserted: %s", inserted)


@app.get("/api/v1")
def root() -> dict:
    return {"success": True, "service": "aigameria-api", "docs": "/docs"}
