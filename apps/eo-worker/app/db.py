"""Thin DB access for the worker: just the parcel facts it needs to compute."""
from __future__ import annotations

import os
from datetime import datetime, timezone

import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://biocoda:biocoda@localhost:5432/biocoda"
)


def _connect() -> psycopg.Connection:
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def get_parcel_context(parcel_id: str) -> dict | None:
    """Baseline date + target for a parcel, or None if it does not exist."""
    with _connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT p.id,
                   p.baseline_date,
                   t.baseline_condition,
                   t.target_condition,
                   t.by_year
            FROM parcel p
            JOIN target t ON t.parcel_id = p.id
            WHERE p.id = %s
            """,
            (parcel_id,),
        )
        row = cur.fetchone()
    if row is None:
        return None
    bd = row["baseline_date"]
    baseline = datetime(bd.year, bd.month, bd.day, tzinfo=timezone.utc)
    return {
        "parcel_id": row["id"],
        "baseline": baseline,
        "baseline_condition": row["baseline_condition"],
        "target_condition": row["target_condition"],
        "by_year": row["by_year"],
    }
