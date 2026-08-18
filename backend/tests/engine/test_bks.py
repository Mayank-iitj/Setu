import pytest
from backend.src.engine.benchmarks.bks import BEST_KNOWN, gap_pct, lookup, BKS


def test_c101_best_known_present():
    b = lookup("C101")
    assert b is not None
    assert b.vehicles == 10
    assert b.distance == pytest.approx(828.94)


def test_lookup_is_case_insensitive():
    assert lookup("c101") == lookup("C101")


def test_lookup_returns_none_for_unknown():
    assert lookup("NOPE999") is None


def test_every_entry_has_a_source_citation():
    for name, b in BEST_KNOWN.items():
        assert b.source, f"{name} has no source — an uncited BKS is worthless"


def test_gap_is_zero_when_matching():
    assert gap_pct(828.94, 828.94) == pytest.approx(0.0)


def test_gap_is_positive_when_worse():
    assert gap_pct(850.0, 828.94) == pytest.approx(2.541, abs=1e-3)


def test_gap_is_negative_when_better():
    assert gap_pct(800.0, 828.94) < 0


def test_gap_rejects_zero_best():
    with pytest.raises(ValueError):
        gap_pct(10.0, 0.0)
