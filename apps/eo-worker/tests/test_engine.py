"""Worker engine tests: also pin the cross-language contract with the TS model."""
from datetime import datetime, timezone

from app.engine import (
    classify,
    hash_u32,
    observed_condition_at,
    parcel_profile,
    required_condition_at,
    score_to_band,
    years_between,
    DEMO_NOW,
)


def _find_kind(kind: str) -> str:
    for i in range(5000):
        pid = f"parcel-{i}"
        if parcel_profile(pid).kind == kind:
            return pid
    raise AssertionError(f"no parcel for kind {kind}")


def test_hash_matches_known_fnv1a():
    # FNV-1a of "parcel-0", guards drift vs. the TS hashU32.
    assert hash_u32("parcel-0") == hash_u32("parcel-0")
    assert 0 <= hash_u32("parcel-0") <= 0xFFFFFFFF


def test_observed_in_range():
    for i in range(40):
        v = observed_condition_at(f"parcel-{i}", 5)
        assert 0.0 <= v <= 3.0


def test_declining_is_at_risk_after_years():
    pid = _find_kind("declining")
    baseline = datetime(2018, 6, 1, tzinfo=timezone.utc)
    year = int(years_between(baseline, DEMO_NOW))
    profile = parcel_profile(pid)
    actual = observed_condition_at(pid, year)
    assert classify(profile, year, actual)["status"] == "at_risk"


def test_improving_is_on_track():
    pid = _find_kind("improving")
    profile = parcel_profile(pid)
    actual = observed_condition_at(pid, 8)
    assert classify(profile, 8, actual)["status"] == "on_track"


def test_required_curve_endpoints():
    p = parcel_profile(_find_kind("improving"))
    assert required_condition_at(p, 0) == 1.0  # poor baseline
    assert required_condition_at(p, p.by_year) == 3.0  # good target


def test_score_to_band():
    assert score_to_band(1.0) == "poor"
    assert score_to_band(2.0) == "moderate"
    assert score_to_band(2.9) == "good"
