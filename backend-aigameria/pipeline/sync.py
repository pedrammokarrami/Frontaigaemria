"""Standalone pipeline entry: python pipeline/sync.py"""
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import config  # noqa: E402
from app.db import init_db  # noqa: E402
from app.seed_sync import rotate_logs, run_sync  # noqa: E402
from app.training_ingest import ingest_source_db  # noqa: E402

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    config  # touch import for env-driven DB path
    init_db()
    changed = run_sync()
    # resumable + idempotent multi-source training ingestion (knowledge store
    # + JSON packs in ingest/); disk-guarded, never stores video binaries.
    training = ingest_source_db()
    ingest_dir = Path(__file__).resolve().parent.parent / "ingest"
    if ingest_dir.exists():
        for pack in sorted(ingest_dir.glob("*.json")):
            try:
                from app.training_ingest import ingest_catalog_pack

                pack_report = ingest_catalog_pack(str(pack))
                logging.getLogger("aigameria.ingest").info("pack %s: %s", pack.name, pack_report)
            except Exception as exc:  # rate-limit/broken pack must not kill the run
                logging.getLogger("aigameria.ingest").warning("pack %s failed: %s", pack.name, exc)
    rotate_logs()
    print(changed, "| training:", {k: training[k] for k in ("seen", "added", "skipped", "cursor")})
