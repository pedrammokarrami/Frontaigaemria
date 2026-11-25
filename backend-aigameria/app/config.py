"""AIGAMERIA API — configuration via environment variables."""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = os.environ.get("AIGAMERIA_DB", str(ROOT / ".data" / "aigameria_api.sqlite"))
STREAM_CACHE_TTL_SECONDS = 28800  # 8-hour cache mandate
LOG_MAX_BYTES = 2 * 1024 * 1024   # rotate app logs beyond 2 MiB
LOG_KEEP = 3                      # keep 3 rotated logs
DISK_BUDGET_BYTES = 20 * 1024 * 1024 * 1024  # hard sanity budget (20 GiB)
