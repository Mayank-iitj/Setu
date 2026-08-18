"""Data contracts for the routing solver.

Validation lives in __post_init__ so a malformed request fails at construction
with a clear message, rather than inside OR-Tools with an opaque one.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Vehicle:
    id: str
    capacity: int
    start_node: int
    shift_start: int
    shift_end: int


@dataclass(frozen=True)
class Stop:
    node: int
    demand: int
    ready: int
    due: int
    service: int


@dataclass(frozen=True)
class Route:
    vehicle_id: str
    stops: list[int]          # node indices, depot-first and depot-last
    arrivals: list[float]     # arrival time at each stop, same length as stops
    distance_km: float
    load: int


@dataclass(frozen=True)
class Solution:
    routes: list[Route]
    total_distance: float
    vehicles_used: int
    total_cost: float
    solve_time_ms: int
    feasible: bool


@dataclass
class SolveRequest:
    stops: list[Stop]
    vehicles: list[Vehicle]
    distance_matrix: list[list[float]]
    time_matrix: list[list[float]]
    depot: int = 0
    time_budget_ms: int = 5000
    fixed_vehicle_cost: int = 1000

    def __post_init__(self) -> None:
        n = len(self.stops)
        if not self.vehicles:
            raise ValueError("at least one vehicle is required")
        for label, matrix in (("distance_matrix", self.distance_matrix),
                              ("time_matrix", self.time_matrix)):
            if len(matrix) != n or any(len(row) != n for row in matrix):
                raise ValueError(
                    f"{label} must be {n}x{n} to match {n} stops, "
                    f"got {len(matrix)}x{len(matrix[0]) if matrix else 0}"
                )
        for s in self.stops:
            if s.ready > s.due:
                raise ValueError(
                    f"invalid time window at node {s.node}: ready {s.ready} > due {s.due}"
                )

    @property
    def n_nodes(self) -> int:
        return len(self.stops)
