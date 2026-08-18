"""Runs public Solomon instances and reports the gap to best-known.

This is the answer to the judge's question "how do I know your routes are
actually good and not just plausible lines on a map?" — public instances,
published optima, our gap, our runtime, reproducible on their laptop.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

from ..routing.solver import solve
from ..routing.types import SolveRequest, Stop, Vehicle
from ..routing.verify import verify_solution
from .bks import gap_pct, lookup
from .solomon import SolomonInstance, load_instance


@dataclass(frozen=True)
class BenchmarkResult:
    instance: str
    customers: int
    vehicles_used: int
    distance: float
    bks_vehicles: int | None
    bks_distance: float | None
    gap_pct: float | None
    solve_time_ms: int
    feasible: bool
    violations: list[str] = field(default_factory=list)


def to_solve_request(inst: SolomonInstance, time_budget_ms: int) -> SolveRequest:
    """Solomon instances are Euclidean and travel time equals distance."""
    pts = [(n.x, n.y) for n in inst.nodes]
    matrix = [[math.dist(a, b) for b in pts] for a in pts]

    stops = [
        Stop(node=i, demand=n.demand, ready=n.ready, due=n.due, service=n.service)
        for i, n in enumerate(inst.nodes)
    ]
    depot = inst.nodes[0]
    vehicles = [
        Vehicle(id=f"v{k}", capacity=inst.capacity, start_node=0,
                shift_start=depot.ready, shift_end=depot.due)
        for k in range(inst.num_vehicles)
    ]
    return SolveRequest(
        stops=stops, vehicles=vehicles,
        distance_matrix=matrix, time_matrix=[row[:] for row in matrix],
        depot=0, time_budget_ms=time_budget_ms,
    )


def run_instance(name: str, time_budget_ms: int = 5000) -> BenchmarkResult:
    inst = load_instance(name)
    req = to_solve_request(inst, time_budget_ms)
    sol = solve(req)

    if sol is None:
        return BenchmarkResult(
            instance=inst.name, customers=inst.num_customers, vehicles_used=0,
            distance=0.0, bks_vehicles=None, bks_distance=None, gap_pct=None,
            solve_time_ms=time_budget_ms, feasible=False,
            violations=["solver returned no solution within the time budget"],
        )

    violations = verify_solution(req, sol)
    best = lookup(inst.name)
    return BenchmarkResult(
        instance=inst.name,
        customers=inst.num_customers,
        vehicles_used=sol.vehicles_used,
        distance=round(sol.total_distance, 2),
        bks_vehicles=best.vehicles if best else None,
        bks_distance=best.distance if best else None,
        gap_pct=round(gap_pct(sol.total_distance, best.distance), 3) if best else None,
        solve_time_ms=sol.solve_time_ms,
        feasible=not violations,
        violations=violations,
    )
