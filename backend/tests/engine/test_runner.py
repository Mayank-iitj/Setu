import math
import pytest
from backend.src.engine.benchmarks.solomon import SolomonInstance, SolomonNode
from backend.src.engine.benchmarks.runner import to_solve_request, run_instance


def _tiny():
    return SolomonInstance(
        name="TINY", num_vehicles=3, capacity=100,
        nodes=[
            SolomonNode(40, 50, 0, 0, 1000, 0),
            SolomonNode(45, 55, 10, 0, 1000, 10),
            SolomonNode(35, 45, 20, 0, 1000, 10),
        ],
    )


def test_builds_euclidean_distance_matrix():
    req = to_solve_request(_tiny(), 500)
    assert req.n_nodes == 3
    assert req.distance_matrix[0][1] == pytest.approx(math.dist((40, 50), (45, 55)))
    assert req.distance_matrix[1][1] == 0.0


def test_time_matrix_equals_distance_matrix():
    """Solomon convention: travel time == Euclidean distance."""
    req = to_solve_request(_tiny(), 500)
    assert req.time_matrix == req.distance_matrix


def test_creates_one_vehicle_per_declared_vehicle():
    req = to_solve_request(_tiny(), 500)
    assert len(req.vehicles) == 3
    assert all(v.capacity == 100 for v in req.vehicles)


def test_vehicle_shift_matches_depot_window():
    req = to_solve_request(_tiny(), 500)
    assert req.vehicles[0].shift_start == 0
    assert req.vehicles[0].shift_end == 1000


@pytest.mark.slow
def test_run_c101_is_feasible_and_near_best_known():
    r = run_instance("C101", time_budget_ms=5000)
    assert r.feasible, r.violations
    assert r.violations == []
    assert r.customers == 100
    assert r.vehicles_used == 10          # matches best-known
    assert r.gap_pct < 1.0                # verified: ~0.008% at 5s
    assert r.solve_time_ms > 0
