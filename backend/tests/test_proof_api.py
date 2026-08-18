import pytest
from fastapi.testclient import TestClient
from backend.src.main import app

client = TestClient(app)


def test_get_ablation():
    r = client.get("/api/proof/ablation")
    assert r.status_code == 200
    body = r.json()
    assert "carriers" in body
    assert body["off_total_cost"] > body["on_total_cost"]


def test_get_auction():
    r = client.get("/api/proof/auction")
    assert r.status_code == 200
    body = r.json()
    assert "bundles" in body
    assert "bids" in body


def test_get_scenario():
    r = client.get("/api/proof/scenario")
    assert r.status_code == 200
    body = r.json()
    assert "carriers" in body
    assert "requests" in body


def test_recompute_rejects_out_of_range_budget():
    r = client.post("/api/proof/recompute", json={"seed": 42, "budget_ms": 99})
    assert r.status_code == 422
    r = client.post("/api/proof/recompute", json={"seed": 42, "budget_ms": 5001})
    assert r.status_code == 422


def test_recompute_rejects_out_of_range_seed():
    r = client.post("/api/proof/recompute", json={"seed": 0, "budget_ms": 800})
    assert r.status_code == 422
    r = client.post("/api/proof/recompute", json={"seed": 10000, "budget_ms": 800})
    assert r.status_code == 422


@pytest.mark.slow
def test_recompute_returns_ablation_shaped_result():
    r = client.post("/api/proof/recompute", json={"seed": 42, "budget_ms": 100})
    assert r.status_code == 200
    body = r.json()
    assert "carriers" in body
    assert "total_saving" in body
    assert "shapley_share" in body["carriers"][0]
