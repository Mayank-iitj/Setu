"""Command-line benchmark runner.

    python -m backend.src.engine.benchmarks.cli            # every shipped instance
    python -m backend.src.engine.benchmarks.cli C101       # one instance
    python -m backend.src.engine.benchmarks.cli C101 --budget 15000
"""
from __future__ import annotations

import argparse
import sys

from .runner import run_instance
from .solomon import available_instances

HEADER = f"{'INSTANCE':<9}{'CUST':>5}{'VEH':>5}{'BKS':>5}{'DISTANCE':>11}{'BKS DIST':>11}{'GAP %':>9}{'TIME':>8}  OK"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run Solomon CVRPTW benchmarks")
    parser.add_argument("instances", nargs="*", help="instance names (default: all)")
    parser.add_argument("--budget", type=int, default=5000, help="ms per instance")
    args = parser.parse_args(argv)

    names = [n.upper() for n in args.instances] or available_instances()
    if not names:
        print("No instances found. Run: python scripts/fetch_solomon.py", file=sys.stderr)
        return 1

    print(HEADER)
    print("-" * len(HEADER))
    worst = 0.0
    for name in names:
        r = run_instance(name, time_budget_ms=args.budget)
        gap = f"{r.gap_pct:+.3f}" if r.gap_pct is not None else "n/a"
        bksv = r.bks_vehicles if r.bks_vehicles is not None else "-"
        bksd = f"{r.bks_distance:.2f}" if r.bks_distance is not None else "-"
        flag = "yes" if r.feasible else "NO"
        print(f"{r.instance:<9}{r.customers:>5}{r.vehicles_used:>5}{bksv:>5}"
              f"{r.distance:>11.2f}{bksd:>11}{gap:>9}{r.solve_time_ms:>7}ms  {flag}")
        for v in r.violations[:3]:
            print(f"          ! {v}")
        if r.gap_pct is not None:
            worst = max(worst, r.gap_pct)
    print(f"\nworst gap: {worst:+.3f}%")
    return 0


if __name__ == "__main__":
    sys.exit(main())
