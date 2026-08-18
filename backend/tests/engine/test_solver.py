import math
from backend.src.engine.routing.types import Vehicle, Stop, SolveRequest
from backend.src.engine.routing.solver import solve, SCALE
from backend.src.engine.routing.verify import verify_solution


def _grid_request(n=8, capacity=100, vehicles=4, budget=2000):
    """n customers on a circle around a central depot; wide time windows."""
    pts = [(50.0, 50.0)] + [
        (50 + 20 * math.cos(2 * math.pi * i / n), 50 + 20 * math.sin(2 * math.pi * i / n))
        for i in range(n)
    ]
    m = [[math.dist(a, b) for b in pts] for a in pts]
    stops = [Stop(0, 0, 0, 10_000, 0)] + [Stop(i, 10, 0, 10_000, 5) for i in range(1, n + 1)]
    vs = [Vehicle(f"v{k}", capacity, 0, 0, 10_000) for k in range(vehicles)]
    return SolveRequest(stops=stops, vehicles=vs, distance_matrix=m, time_matrix=m,
                        time_budget_ms=budget)


def test_returns_a_solution():
    sol = solve(_grid_request())
    assert sol is not None
    assert sol.feasible


def test_solution_passes_independent_verification():
    req = _grid_request()
    assert verify_solution(req, solve(req)) == []


def test_serves_every_customer_exactly_once():
    req = _grid_request(n=10)
    sol = solve(req)
    served = [n for r in sol.routes for n in r.stops if n != 0]
    assert sorted(served) == list(range(1, 11))


def test_respects_capacity_by_forcing_multiple_vehicles():
    # 8 customers x 10 demand = 80; capacity 30 => at least 3 vehicles needed
    req = _grid_request(n=8, capacity=30, vehicles=6)
    sol = solve(req)
    assert verify_solution(req, sol) == []
    assert sol.vehicles_used >= 3


def test_respects_tight_time_windows():
    req = _grid_request(n=6)
    tightened = list(req.stops)
    tightened[1] = Stop(1, 10, 0, 25, 5)     # must be served early
    req.stops = tightened
    sol = solve(req)
    assert verify_solution(req, sol) == []


def test_fixed_vehicle_cost_reduces_fleet_size():
    cheap = _grid_request(n=10, vehicles=10)
    cheap.fixed_vehicle_cost = 0
    dear = _grid_request(n=10, vehicles=10)
    dear.fixed_vehicle_cost = 10_000
    assert solve(dear).vehicles_used <= solve(cheap).vehicles_used


def test_reports_solve_time_and_distance():
    sol = solve(_grid_request())
    assert sol.solve_time_ms >= 0
    assert sol.total_distance > 0
    assert math.isclose(
        sol.total_distance, sum(r.distance_km for r in sol.routes), rel_tol=1e-6
    )


def test_scale_is_one_hundred():
    assert SCALE == 100
