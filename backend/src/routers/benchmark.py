"""Benchmark endpoints.

Solves are CPU-bound and would block the asyncio event loop, freezing the 2Hz
telemetry broadcast the whole dashboard depends on. Every solve therefore runs
in a process pool (spec §3.3).
"""
import asyncio
import dataclasses
from concurrent.futures import ProcessPoolExecutor

from fastapi import APIRouter, HTTPException

from ..engine.benchmarks.bks import lookup
from ..engine.benchmarks.runner import run_instance
from ..engine.benchmarks.solomon import available_instances, load_instance
from ..models import BenchmarkInstanceInfo, BenchmarkRunRequest, BenchmarkRunResult

router = APIRouter(prefix="/api/benchmark", tags=["benchmark"])

MAX_BUDGET_MS = 60_000
_pool = ProcessPoolExecutor(max_workers=2)


@router.get("/instances", response_model=list[BenchmarkInstanceInfo])
async def list_instances():
    out = []
    for name in available_instances():
        best = lookup(name)
        out.append(BenchmarkInstanceInfo(
            name=name,
            customers=load_instance(name).num_customers,
            bks_vehicles=best.vehicles if best else None,
            bks_distance=best.distance if best else None,
        ))
    return out


@router.post("/run", response_model=BenchmarkRunResult)
async def run(req: BenchmarkRunRequest):
    if req.instance.upper() not in available_instances():
        raise HTTPException(404, f"unknown instance {req.instance}")
    if not 100 <= req.time_budget_ms <= MAX_BUDGET_MS:
        raise HTTPException(422, f"time_budget_ms must be 100..{MAX_BUDGET_MS}")

    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        _pool, run_instance, req.instance.upper(), req.time_budget_ms
    )
    # BenchmarkResult is a frozen dataclass — asdict(), not __dict__.
    return BenchmarkRunResult(**dataclasses.asdict(result))
