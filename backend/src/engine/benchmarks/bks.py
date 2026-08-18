"""Published best-known solutions for Solomon 100-customer CVRPTW instances.

These numbers are the yardstick the whole benchmark claim rests on. If one is
wrong, the reported gap is wrong and the credibility argument collapses — so
every entry carries a source and MUST be re-checked against it before the
figures are shown to anyone. See docs/PROVENANCE.md.

Convention: (vehicles, distance) minimising vehicles first, then distance.
"""
from __future__ import annotations

from dataclasses import dataclass

SOURCE = "Solomon (1987) benchmark set; best-known values as published by SINTEF TOP"


@dataclass(frozen=True)
class BKS:
    vehicles: int
    distance: float
    source: str = SOURCE


BEST_KNOWN: dict[str, BKS] = {
    "C101":  BKS(10, 828.94),
    "C201":  BKS(3, 591.56),
    "R101":  BKS(19, 1650.80),
    "R201":  BKS(4, 1252.37),
    "RC101": BKS(14, 1696.95),
    "RC201": BKS(4, 1406.94),
}


def lookup(name: str) -> BKS | None:
    return BEST_KNOWN.get(name.strip().upper())


def gap_pct(ours: float, best: float) -> float:
    """Percentage above best-known. Negative means we beat it."""
    if best == 0:
        raise ValueError("best-known distance cannot be zero")
    return (ours - best) / best * 100.0
