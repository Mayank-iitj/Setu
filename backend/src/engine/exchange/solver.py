"""Multi-depot CVRPTW with optional request dropping.

Each carrier in a coalition contributes its own depot and its own vehicles, so
a coalition is genuinely a pooled fleet rather than one carrier absorbing
another's work.

Requests may go unserved at a price (`DROP_PENALTY_INR`). Without that, a single
time-window-infeasible hub makes a whole coalition infeasible, v(S) becomes
infinite, and the Shapley value is undefined — which is exactly what happened
the first time this was run.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from .model import (
    AVG_KMH, COST_PER_KM, DROP_PENALTY_INR, FIXED_VEHICLE_COST,
    HANDLING_COST_INR, HUBS, SERVICE_MINUTES, Carrier, Request, haversine_km,
    CIRCUITY,
)

SCALE = 100
HORIZON_MIN = 24 * 60


@dataclass
class PlanResult:
    cost: float
    vehicles_used: int
    distance_km: float
    served: int
    dropped: int
    assignment: dict[str, str] = field(default_factory=dict)   # request id -> carrier id
    routes: list[dict] = field(default_factory=list)
    feasible: bool = True

    @property
    def routing_cost(self) -> float:
        """Cost excluding drop penalties — the operational number."""
        return self.cost - self.dropped * DROP_PENALTY_INR


def solve_multidepot(
    carriers: list[Carrier], requests: list[Request], budget_ms: int = 800
) -> PlanResult:
    if not requests:
        return PlanResult(0.0, 0, 0.0, 0, 0)

    depots = [c.depot for c in carriers]
    n_depots = len(depots)
    coords = [HUBS[d] for d in depots] + [HUBS[r.hub] for r in requests]
    n = len(coords)

    dist = [[haversine_km(coords[i], coords[j]) * CIRCUITY for j in range(n)]
            for i in range(n)]
    idist = [[int(round(d * SCALE)) for d in row] for row in dist]

    vehicle_depot: list[int] = []
    caps: list[int] = []
    for ci, c in enumerate(carriers):
        vehicle_depot += [ci] * c.n_vehicles
        caps += [c.capacity] * c.n_vehicles

    mgr = pywrapcp.RoutingIndexManager(n, len(vehicle_depot), vehicle_depot, vehicle_depot)
    routing = pywrapcp.RoutingModel(mgr)

    def distance_cb(fi, ti):
        return idist[mgr.IndexToNode(fi)][mgr.IndexToNode(ti)]

    dcb = routing.RegisterTransitCallback(distance_cb)
    routing.SetArcCostEvaluatorOfAllVehicles(dcb)
    routing.SetFixedCostOfAllVehicles(int(FIXED_VEHICLE_COST / COST_PER_KM * SCALE))

    demands = [0] * n_depots + [r.demand for r in requests]

    def demand_cb(fi):
        return demands[mgr.IndexToNode(fi)]

    routing.AddDimensionWithVehicleCapacity(
        routing.RegisterUnaryTransitCallback(demand_cb), 0, caps, True, "Capacity"
    )

    def time_cb(fi, ti):
        f, t = mgr.IndexToNode(fi), mgr.IndexToNode(ti)
        travel = dist[f][t] / AVG_KMH * 60.0
        service = SERVICE_MINUTES if f >= n_depots else 0
        return int(round((travel + service) * SCALE))

    routing.AddDimension(
        routing.RegisterTransitCallback(time_cb),
        HORIZON_MIN * SCALE, HORIZON_MIN * SCALE, True, "Time"
    )
    tdim = routing.GetDimensionOrDie("Time")
    for k, r in enumerate(requests):
        tdim.CumulVar(mgr.NodeToIndex(n_depots + k)).SetRange(
            int(r.ready * SCALE), int(r.due * SCALE)
        )

    drop_cost = int(round(DROP_PENALTY_INR / COST_PER_KM * SCALE))
    for k in range(len(requests)):
        routing.AddDisjunction([mgr.NodeToIndex(n_depots + k)], drop_cost)

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
    params.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH)
    params.time_limit.FromMilliseconds(budget_ms)

    sol = routing.SolveWithParameters(params)
    if sol is None:
        return PlanResult(float("inf"), 0, 0.0, 0, len(requests), feasible=False)

    total_km = 0.0
    used = 0
    served = 0
    assignment: dict[str, str] = {}
    routes: list[dict] = []

    for v in range(len(vehicle_depot)):
        index = routing.Start(v)
        if routing.IsEnd(sol.Value(routing.NextVar(index))):
            continue
        used += 1
        carrier_id = carriers[vehicle_depot[v]].id
        hubs: list[str] = [depots[vehicle_depot[v]]]
        route_km = 0.0
        while not routing.IsEnd(index):
            node = mgr.IndexToNode(index)
            if node >= n_depots:
                req = requests[node - n_depots]
                served += 1
                assignment[req.id] = carrier_id
                hubs.append(req.hub)
            nxt = sol.Value(routing.NextVar(index))
            route_km += dist[node][mgr.IndexToNode(nxt)]
            index = nxt
        hubs.append(depots[vehicle_depot[v]])
        total_km += route_km
        routes.append({"carrier_id": carrier_id, "hubs": hubs,
                       "distance_km": round(route_km, 1)})

    dropped = len(requests) - served
    cost = (total_km * COST_PER_KM + used * FIXED_VEHICLE_COST
            + served * HANDLING_COST_INR + dropped * DROP_PENALTY_INR)

    return PlanResult(cost=cost, vehicles_used=used, distance_km=round(total_km, 1),
                      served=served, dropped=dropped, assignment=assignment,
                      routes=routes)
