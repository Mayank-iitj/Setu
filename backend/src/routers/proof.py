"""Proof endpoints — collaborative freight exchange evidence.

Serves the precomputed ablation / auction / scenario payloads that back the
dashboard's "collaboration is worth it" story, plus a live recompute. The
recompute is CPU-bound (exact Shapley settlement over a demo scenario) and
would block the asyncio event loop — freezing the 2Hz telemetry broadcast the
whole dashboard depends on — so it runs in a process pool, exactly like the
benchmark router.
"""
import asyncio
import json
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/proof", tags=["proof"])

_DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "demo"
_CACHE: dict[str, Any] = {}
_pool = ProcessPoolExecutor(max_workers=2)

MIN_BUDGET_MS = 100
MAX_BUDGET_MS = 5000
MIN_SEED = 1
MAX_SEED = 9999


def _load(name: str) -> Any:
    """Lazily load and cache a precomputed demo payload. Never crashes at import time."""
    if name not in _CACHE:
        path = _DATA_DIR / f"{name}.json"
        if not path.exists():
            raise HTTPException(
                503,
                f"{name}.json not found — run `python scripts/precompute_demo.py` "
                "to generate the demo payloads.",
            )
        with path.open() as f:
            _CACHE[name] = json.load(f)
    return _CACHE[name]


def _recompute_ablation(seed: int, budget_ms: int) -> dict:
    """Runs in a worker process — must be a top-level function so it can pickle."""
    from ..engine.exchange.ablation import run_ablation
    from ..engine.exchange.model import generate_scenario

    carriers, requests = generate_scenario(seed=seed)
    result, _settlement = run_ablation(carriers, requests, budget_ms=budget_ms)
    return result.to_dict()


class RecomputeRequest(BaseModel):
    seed: int = 42
    budget_ms: int = 800


@router.get("/ablation")
async def get_ablation():
    return _load("ablation")


@router.get("/auction")
async def get_auction():
    return _load("auction")


@router.get("/scenario")
async def get_scenario():
    return _load("scenario")


@router.post("/recompute")
async def recompute(req: RecomputeRequest):
    if not MIN_BUDGET_MS <= req.budget_ms <= MAX_BUDGET_MS:
        raise HTTPException(422, f"budget_ms must be {MIN_BUDGET_MS}..{MAX_BUDGET_MS}")
    if not MIN_SEED <= req.seed <= MAX_SEED:
        raise HTTPException(422, f"seed must be {MIN_SEED}..{MAX_SEED}")

    loop = asyncio.get_running_loop()
    payload = await loop.run_in_executor(
        _pool, _recompute_ablation, req.seed, req.budget_ms
    )
    return payload
