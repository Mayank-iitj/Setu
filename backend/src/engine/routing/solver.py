"""Anytime CVRPTW solver built on OR-Tools routing.

Search: PARALLEL_CHEAPEST_INSERTION for a first solution, then GUIDED_LOCAL_SEARCH until
the time budget expires, returning the best solution found so far. Anytime by
construction — a caller with 200ms and a caller with 30s both get an answer.

OR-Tools works in integers, so every distance and time crosses the model
boundary multiplied by SCALE and is divided back out when results are read.
Mixing scaled and unscaled values is the easiest way to break this file.
"""
from __future__ import annotations

import time

from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from .types import Route, Solution, SolveRequest

SCALE = 100  # two decimal places of precision


def solve(req: SolveRequest) -> Solution | None:
    n = req.n_nodes
    n_vehicles = len(req.vehicles)
    capacities = [v.capacity for v in req.vehicles]

    dist = [[int(round(req.distance_matrix[i][j] * SCALE)) for j in range(n)]
            for i in range(n)]
    travel = [[int(round(req.time_matrix[i][j] * SCALE)) for j in range(n)]
              for i in range(n)]
    demand = [s.demand for s in req.stops]
    service = [s.service for s in req.stops]

    manager = pywrapcp.RoutingIndexManager(n, n_vehicles, req.depot)
    routing = pywrapcp.RoutingModel(manager)

    def distance_cb(from_index: int, to_index: int) -> int:
        return dist[manager.IndexToNode(from_index)][manager.IndexToNode(to_index)]

    distance_idx = routing.RegisterTransitCallback(distance_cb)
    routing.SetArcCostEvaluatorOfAllVehicles(distance_idx)

    # A fixed per-vehicle cost is what makes "use fewer trucks" a real
    # objective rather than an accident of the distance minimisation.
    routing.SetFixedCostOfAllVehicles(req.fixed_vehicle_cost * SCALE)

    def demand_cb(from_index: int) -> int:
        return demand[manager.IndexToNode(from_index)]

    demand_idx = routing.RegisterUnaryTransitCallback(demand_cb)
    routing.AddDimensionWithVehicleCapacity(
        demand_idx, 0, capacities, True, "Capacity"
    )

    # Time accumulates travel plus service at the node being left.
    def time_cb(from_index: int, to_index: int) -> int:
        f = manager.IndexToNode(from_index)
        return travel[f][manager.IndexToNode(to_index)] + service[f] * SCALE

    time_idx = routing.RegisterTransitCallback(time_cb)
    horizon = max(s.due for s in req.stops) * SCALE
    routing.AddDimension(time_idx, horizon, horizon, False, "Time")
    time_dim = routing.GetDimensionOrDie("Time")

    for stop in req.stops:
        if stop.node == req.depot:
            continue
        index = manager.NodeToIndex(stop.node)
        time_dim.CumulVar(index).SetRange(stop.ready * SCALE, stop.due * SCALE)

    for k, vehicle in enumerate(req.vehicles):
        start = routing.Start(k)
        time_dim.CumulVar(start).SetRange(
            vehicle.shift_start * SCALE, vehicle.shift_end * SCALE
        )
        routing.AddVariableMinimizedByFinalizer(time_dim.CumulVar(start))
        routing.AddVariableMinimizedByFinalizer(time_dim.CumulVar(routing.End(k)))

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = (
        # PARALLEL_CHEAPEST_INSERTION, not PATH_CHEAPEST_ARC. The greedy nearest-arc
        # construction cannot build a feasible first solution when time windows are
        # narrow (~10 units on Solomon R1/RC1) and returns nothing at all, even at a
        # 60s budget. Insertion heuristics schedule against the windows as they build.
        # Measured: R101 19 vehicles / +0.17% and RC101 solved, both unsolvable before;
        # C101 unchanged at +0.01%.
        routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION
    )
    params.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    params.time_limit.FromMilliseconds(req.time_budget_ms)

    started = time.perf_counter()
    assignment = routing.SolveWithParameters(params)
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    if assignment is None:
        return None

    routes: list[Route] = []
    total_distance = 0.0
    for k, vehicle in enumerate(req.vehicles):
        index = routing.Start(k)
        if routing.IsEnd(assignment.Value(routing.NextVar(index))):
            continue  # unused vehicle

        nodes: list[int] = []
        arrivals: list[float] = []
        route_distance = 0.0
        route_load = 0
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            nodes.append(node)
            arrivals.append(assignment.Value(time_dim.CumulVar(index)) / SCALE)
            route_load += demand[node]
            nxt = assignment.Value(routing.NextVar(index))
            route_distance += dist[node][manager.IndexToNode(nxt)] / SCALE
            index = nxt
        nodes.append(manager.IndexToNode(index))
        arrivals.append(assignment.Value(time_dim.CumulVar(index)) / SCALE)

        routes.append(Route(vehicle.id, nodes, arrivals, route_distance, route_load))
        total_distance += route_distance

    return Solution(
        routes=routes,
        total_distance=total_distance,
        vehicles_used=len(routes),
        total_cost=total_distance + len(routes) * req.fixed_vehicle_cost,
        solve_time_ms=elapsed_ms,
        feasible=True,
    )
