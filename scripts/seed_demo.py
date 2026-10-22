#!/usr/bin/env python3
"""Seed the fictional demo data, or reset the local SQLite database.

Usage:
    python scripts/seed_demo.py            # seed only when the database is empty
    python scripts/seed_demo.py --reset    # delete the local SQLite DB and reseed

This script only ever removes a SQLite file at the configured DATABASE_URL.
It refuses to run against non-SQLite databases.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.config import settings  # noqa: E402
from app.database import SessionLocal, init_db  # noqa: E402
from app.services.seed import seed_demo_data  # noqa: E402


def sqlite_path() -> Path:
    if not settings.database_url.startswith("sqlite:///"):
        raise SystemExit(
            "Refusing to reset a non-SQLite database. "
            f"Configured URL: {settings.database_url}"
        )
    raw = settings.database_url.removeprefix("sqlite:///")
    path = Path(raw)
    if not path.is_absolute():
        path = (ROOT / path).resolve()
    return path


def reset_database() -> Path:
    path = sqlite_path()
    if path.name == ":memory:":
        raise SystemExit("Refusing to reset an in-memory database.")
    for candidate in (path, Path(f"{path}-wal"), Path(f"{path}-shm")):
        if candidate.exists():
            candidate.unlink()
    return path


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the Financial Parallelverse demo data.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete the local SQLite database first, then recreate the demo workspace.",
    )
    args = parser.parse_args()

    if args.reset:
        path = reset_database()
        print(f"Removed {path}")

    init_db()
    with SessionLocal() as db:
        created = seed_demo_data(db)

    if created:
        print("Demo workspace seeded: profile, two installments, a purchase plan and a simulation.")
    else:
        print("A profile already exists, so the workspace was left unchanged. Use --reset to start over.")


if __name__ == "__main__":
    main()
