import pytest
from backend.src.engine.routing.types import Vehicle, Stop, SolveRequest, Route, Solution
from backend.src.engine.routing.verify import (
    verify_solution, assert_feasible, InfeasibleSolution,
)

D = [[0.0, 3.0, 4.0], [3.0, 0.0, 5.0], [4.0, 5.0, 0.0]]


def _req(capacity=50):
    return SolveRequest(
        stops=[Stop(0, 0, 0, 1000, 0), Stop(1, 10, 0, 1000, 5), Stop(2, 20, 0, 1000, 5)],
        vehicles=[Vehicle("v0", capacity, 0, 0, 1000)],
        distance_matrix=D, time_matrix=D,
    )


def _sol(stops, arrivals, load=30, dist=12.0):
    return Solution(
        routes=[Route("v0", stops, arrivals, dist, load)],
        total_distance=dist, vehicles_used=1, total_cost=dist,
        solve_time_ms=1, feasible=True,
    )


def test_clean_solution_has_no_violations():
    assert verify_solution(_req(), _sol([0, 1, 2, 0], [0.0, 3.0, 13.0, 22.0])) == []


def test_detects_capacity_violation():
    v = verify_solution(_req(capacity=20), _sol([0, 1, 2, 0], [0.0, 3.0, 13.0, 22.0]))
    assert any("capacity" in x for x in v)


def test_detects_unserved_customer():
    v = verify_solution(_req(), _sol([0, 1, 0], [0.0, 3.0, 6.0], load=10))
    assert any("not served" in x for x in v)


def test_detects_duplicate_visit():
    req = _req()
    sol = Solution(
        routes=[Route("v0", [0, 1, 0], [0.0, 3.0, 6.0], 6.0, 10),
                Route("v1", [0, 1, 2, 0], [0.0, 3.0, 13.0, 22.0], 12.0, 30)],
        total_distance=18.0, vehicles_used=2, total_cost=18.0,
        solve_time_ms=1, feasible=True,
    )
    assert any("more than once" in x for x in verify_solution(req, sol))


def test_detects_time_window_violation():
    req = SolveRequest(
        stops=[Stop(0, 0, 0, 1000, 0), Stop(1, 10, 0, 5, 5), Stop(2, 20, 0, 1000, 5)],
        vehicles=[Vehicle("v0", 50, 0, 0, 1000)],
        distance_matrix=D, time_matrix=D,
    )
    v = verify_solution(req, _sol([0, 1, 2, 0], [0.0, 900.0, 910.0, 920.0]))
    assert any("time window" in x for x in v)


def test_detects_route_not_starting_at_depot():
    v = verify_solution(_req(), _sol([1, 2, 0], [0.0, 10.0, 20.0]))
    assert any("depot" in x for x in v)


def test_assert_feasible_raises_on_violation():
    with pytest.raises(InfeasibleSolution, match="capacity"):
        assert_feasible(_req(capacity=20), _sol([0, 1, 2, 0], [0.0, 3.0, 13.0, 22.0]))


def test_assert_feasible_silent_when_clean():
    assert_feasible(_req(), _sol([0, 1, 2, 0], [0.0, 3.0, 13.0, 22.0]))
