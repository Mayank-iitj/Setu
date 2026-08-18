"""Independent feasibility checking.

This module re-derives every constraint from the request and the returned
routes. It shares no code with the solver on purpose: a bug in the OR-Tools
model must not be able to hide behind the same bug in the checker.
"""
from __future__ import annotations

from .types import SolveRequest, Solution

TOL = 1e-6


class InfeasibleSolution(Exception):
    """Raised when a solution violates the constraints it claims to satisfy."""


def verify_solution(req: SolveRequest, sol: Solution) -> list[str]:
    violations: list[str] = []
    by_id = {v.id: v for v in req.vehicles}
    stop_by_node = {s.node: s for s in req.stops}
    visited: dict[int, str] = {}

    for route in sol.routes:
        if not route.stops:
            continue

        if route.stops[0] != req.depot or route.stops[-1] != req.depot:
            violations.append(
                f"route {route.vehicle_id} must start and end at depot "
                f"{req.depot}, got {route.stops[0]}..{route.stops[-1]}"
            )

        if len(route.arrivals) != len(route.stops):
            violations.append(
                f"route {route.vehicle_id} has {len(route.stops)} stops but "
                f"{len(route.arrivals)} arrival times"
            )
            continue

        vehicle = by_id.get(route.vehicle_id)
        load = sum(stop_by_node[n].demand for n in route.stops if n in stop_by_node)
        if vehicle is not None and load > vehicle.capacity:
            violations.append(
                f"route {route.vehicle_id} carries {load} over capacity {vehicle.capacity}"
            )

        for node, arrival in zip(route.stops, route.arrivals):
            if node == req.depot:
                continue
            stop = stop_by_node.get(node)
            if stop is None:
                violations.append(f"route {route.vehicle_id} visits unknown node {node}")
                continue
            if arrival > stop.due + TOL:
                violations.append(
                    f"node {node} time window violated on {route.vehicle_id}: "
                    f"arrives {arrival:.2f}, due {stop.due}"
                )
            if node in visited:
                violations.append(
                    f"node {node} served more than once "
                    f"({visited[node]} and {route.vehicle_id})"
                )
            else:
                visited[node] = route.vehicle_id

    for stop in req.stops:
        if stop.node != req.depot and stop.node not in visited:
            violations.append(f"node {stop.node} not served by any route")

    return violations


def assert_feasible(req: SolveRequest, sol: Solution) -> None:
    violations = verify_solution(req, sol)
    if violations:
        raise InfeasibleSolution(
            f"{len(violations)} violation(s): " + "; ".join(violations[:5])
        )
