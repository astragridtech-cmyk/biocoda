"""BioCoda EO worker: habitat-condition indicators + trajectory.

Endpoints (all read-only, deterministic, no external keys):

  GET /health
  GET /parcels/{parcel_id}/condition?frm=&to=   -> EO condition series
  GET /parcels/{parcel_id}/trajectory            -> on_track | at_risk verdict
  GET /parcels/{parcel_id}/required-curve        -> required condition by year
"""
from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

from .db import get_parcel_context
from .engine import (
    DEMO_NOW,
    MANAGEMENT_PERIOD_YEARS,
    ParcelProfile,
    classify,
    observed_condition_at,
    required_condition_at,
    round2,
    years_between,
)

app = FastAPI(title="BioCoda EO worker", version="0.1.0")


class ConditionPoint(BaseModel):
    parcelId: str
    metric: str
    value: float
    capturedAt: str
    source: str


class TrajectoryFlag(BaseModel):
    parcelId: str
    status: str
    year: int
    actual: float
    required: float
    gap: float
    detectedAt: str


class CurvePoint(BaseModel):
    year: int
    required: float


def _profile(ctx: dict) -> ParcelProfile:
    return ParcelProfile(
        kind="",  # not needed for required curve
        baseline_condition=ctx["baseline_condition"],
        target_condition=ctx["target_condition"],
        by_year=ctx["by_year"],
    )


def _require_ctx(parcel_id: str) -> dict:
    ctx = get_parcel_context(parcel_id)
    if ctx is None:
        raise HTTPException(status_code=404, detail=f"unknown parcel: {parcel_id}")
    return ctx


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "eo-worker"}


@app.get("/parcels/{parcel_id}/condition", response_model=list[ConditionPoint])
def condition(
    parcel_id: str,
    frm: str | None = Query(default=None, description="ISO start; defaults to baseline"),
    to: str | None = Query(default=None, description="ISO end; defaults to demo now"),
) -> list[ConditionPoint]:
    ctx = _require_ctx(parcel_id)
    baseline = ctx["baseline"]
    start = datetime.fromisoformat(frm) if frm else baseline
    end = datetime.fromisoformat(to) if to else DEMO_NOW
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)

    out: list[ConditionPoint] = []
    step = timedelta(days=365.25 / 4)
    t = start
    while t <= end:
        year = years_between(baseline, t)
        if year >= 0:
            out.append(
                ConditionPoint(
                    parcelId=parcel_id,
                    metric="condition_score",
                    value=round2(observed_condition_at(parcel_id, year)),
                    capturedAt=t.isoformat(),
                    source="eo",
                )
            )
        t += step
    return out


@app.get("/parcels/{parcel_id}/trajectory", response_model=TrajectoryFlag)
def trajectory(parcel_id: str) -> TrajectoryFlag:
    ctx = _require_ctx(parcel_id)
    year = max(0, math.floor(years_between(ctx["baseline"], DEMO_NOW)))
    actual = observed_condition_at(parcel_id, year)
    verdict = classify(_profile(ctx), year, actual)
    return TrajectoryFlag(
        parcelId=parcel_id,
        status=verdict["status"],
        year=year,
        actual=round2(actual),
        required=round2(verdict["required"]),
        gap=round2(verdict["gap"]),
        detectedAt=DEMO_NOW.isoformat(),
    )


@app.get("/parcels/{parcel_id}/required-curve", response_model=list[CurvePoint])
def required_curve(parcel_id: str) -> list[CurvePoint]:
    ctx = _require_ctx(parcel_id)
    profile = _profile(ctx)
    return [
        CurvePoint(year=y, required=round2(required_condition_at(profile, y)))
        for y in range(MANAGEMENT_PERIOD_YEARS + 1)
    ]
