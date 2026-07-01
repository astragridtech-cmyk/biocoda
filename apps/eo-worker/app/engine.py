"""Deterministic habitat-condition + trajectory engine.

This is the EO source of truth for the demo. It MUST stay byte-for-byte
equivalent to the TypeScript model in packages/shared/src/profile.ts and
trajectory.ts so the worker, the seeded DB, and the TS mock adapter never
disagree. Real wiring later swaps this for EarthDaily / Sentinel habitat-
condition classification behind the same HTTP surface.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone

# Reference clock for the demo (mirrors adapters DEMO_NOW).
DEMO_NOW = datetime(2026, 6, 1, tzinfo=timezone.utc)
MS_PER_YEAR = 365.25 * 24 * 60 * 60
AT_RISK_MARGIN = 0.35
MANAGEMENT_PERIOD_YEARS = 30

BAND_SCORE = {"poor": 1.0, "moderate": 2.0, "good": 3.0}
KINDS = ["improving", "plateau", "declining", "stable_good"]
PROFILE_SPEC = {
    "improving": ("poor", "good", 12),
    "plateau": ("poor", "good", 10),
    "declining": ("moderate", "good", 15),
    "stable_good": ("good", "good", 5),
}


def hash_u32(s: str) -> int:
    """FNV-1a 32-bit. Matches hashU32 in profile.ts."""
    h = 0x811C9DC5
    for ch in s:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


@dataclass(frozen=True)
class ParcelProfile:
    kind: str
    baseline_condition: str
    target_condition: str
    by_year: int


def parcel_profile(parcel_id: str) -> ParcelProfile:
    kind = KINDS[hash_u32(parcel_id) % len(KINDS)]
    base, target, by_year = PROFILE_SPEC[kind]
    return ParcelProfile(kind, base, target, by_year)


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def observed_condition_at(parcel_id: str, year: float) -> float:
    """Synthetic EO-estimated condition (0-3). Mirrors observedConditionAt."""
    p = parcel_profile(parcel_id)
    b = BAND_SCORE[p.baseline_condition]
    g = BAND_SCORE[p.target_condition]
    seed = hash_u32(parcel_id)
    wiggle = math.sin(year * 1.7 + (seed % 100) / 10) * 0.05

    if p.kind == "improving":
        frac = min(1.0, year / p.by_year)
        base = b + (g - b) * frac * 1.02
    elif p.kind == "plateau":
        ceiling = b + (g - b) * 0.55
        base = b + (ceiling - b) * min(1.0, year / 6)
    elif p.kind == "declining":
        base = b - 0.06 * year
    else:  # stable_good
        base = g - 0.05
    return _clamp(base + wiggle, 0.0, 3.0)


def required_condition_at(profile: ParcelProfile, year: float) -> float:
    start = BAND_SCORE[profile.baseline_condition]
    end = BAND_SCORE[profile.target_condition]
    ty = max(1, profile.by_year)
    if year <= 0:
        return start
    if year >= ty:
        return end
    return start + (end - start) * year / ty


def score_to_band(score: float) -> str:
    if score < 1.5:
        return "poor"
    if score < 2.5:
        return "moderate"
    return "good"


def years_between(frm: datetime, to: datetime) -> float:
    return (to.timestamp() - frm.timestamp()) / MS_PER_YEAR


def round2(v: float) -> float:
    return round(v * 100) / 100


def classify(profile: ParcelProfile, year: int, observed: float) -> dict:
    required = required_condition_at(profile, year)
    gap = observed - required
    status = "at_risk" if gap < -AT_RISK_MARGIN else "on_track"
    return {"status": status, "required": required, "gap": gap}
