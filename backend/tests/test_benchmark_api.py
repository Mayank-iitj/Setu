import pytest
from fastapi.testclient import TestClient
from backend.src.main import app

client = TestClient(app)


def test_lists_instances():
    r = client.get("/api/benchmark/instances")
    assert r.status_code == 200
    body = r.json()
    assert any(i["name"] == "C101" for i in body)
    c101 = next(i for i in body if i["name"] == "C101")
    assert c101["bks_vehicles"] == 10
    assert c101["bks_distance"] == pytest.approx(828.94)


def test_run_rejects_unknown_instance():
    r = client.post("/api/benchmark/run", json={"instance": "NOPE999", "time_budget_ms": 500})
    assert r.status_code == 404


def test_run_clamps_excessive_budget():
    r = client.post("/api/benchmark/run", json={"instance": "C101", "time_budget_ms": 999_999})
    assert r.status_code == 422


@pytest.mark.slow
def test_run_c101_returns_a_verified_result():
    r = client.post("/api/benchmark/run", json={"instance": "C101", "time_budget_ms": 5000})
    assert r.status_code == 200
    b = r.json()
    assert b["feasible"] is True
    assert b["violations"] == []
    assert b["vehicles_used"] == 10
    assert b["gap_pct"] < 1.0
