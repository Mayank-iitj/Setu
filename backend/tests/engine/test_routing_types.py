import pytest
from backend.src.engine.routing.types import Vehicle, Stop, SolveRequest, Route, Solution


def _req(**kw):
    base = dict(
        stops=[Stop(0, 0, 0, 100, 0), Stop(1, 10, 0, 100, 5)],
        vehicles=[Vehicle("v0", 50, 0, 0, 100)],
        distance_matrix=[[0.0, 3.0], [3.0, 0.0]],
        time_matrix=[[0.0, 3.0], [3.0, 0.0]],
    )
    base.update(kw)
    return SolveRequest(**base)


def test_n_nodes_matches_stops():
    assert _req().n_nodes == 2


def test_defaults():
    r = _req()
    assert r.depot == 0
    assert r.time_budget_ms == 5000
    assert r.fixed_vehicle_cost == 1000


def test_rejects_non_square_distance_matrix():
    with pytest.raises(ValueError, match="distance_matrix"):
        _req(distance_matrix=[[0.0, 3.0]])


def test_rejects_matrix_not_matching_stop_count():
    with pytest.raises(ValueError, match="distance_matrix"):
        _req(
            stops=[Stop(0, 0, 0, 100, 0)],
            distance_matrix=[[0.0, 3.0], [3.0, 0.0]],
            time_matrix=[[0.0, 3.0], [3.0, 0.0]],
        )


def test_rejects_empty_vehicles():
    with pytest.raises(ValueError, match="vehicle"):
        _req(vehicles=[])


def test_rejects_time_window_with_ready_after_due():
    with pytest.raises(ValueError, match="time window"):
        _req(stops=[Stop(0, 0, 0, 100, 0), Stop(1, 10, 90, 20, 5)])


def test_solution_is_constructible():
    s = Solution(
        routes=[Route("v0", [0, 1, 0], [0.0, 3.0, 6.0], 6.0, 10)],
        total_distance=6.0, vehicles_used=1, total_cost=1006.0,
        solve_time_ms=12, feasible=True,
    )
    assert s.vehicles_used == 1
    assert s.routes[0].stops == [0, 1, 0]
