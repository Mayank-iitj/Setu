# Plan 1 — Foundation, Solver & Benchmark — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dead solver stubs with a real, verified OR-Tools CVRPTW solver, and ship a benchmark page that runs public Solomon instances live and reports gap-to-best-known.

**Architecture:** A new pure-Python `backend/src/engine/` package that imports nothing from FastAPI, so the mathematics is testable without a server. The solver is wrapped by a benchmark runner exposed over new REST endpoints and a React page. The existing WebSocket contract is untouched — this plan adds surface, it does not change any shape the frontend already consumes.

**Tech Stack:** Python 3.14, OR-Tools 9.15.6755, pytest, NumPy, FastAPI (existing), React 19 + Vite + Tailwind (existing).

**Spec:** `docs/superpowers/specs/2026-08-17-samanvay-real-engine-design.md` (§4 M2, M3; §6; §8 items 1–5)

## Global Constraints

- Python **3.14.0**, arm64 macOS. Verified working: `ortools==9.15.6755` — the **only** version with 3.14 wheels. Do not upgrade or downgrade without re-verifying.
- OR-Tools routing API is `from ortools.constraint_solver import pywrapcp, routing_enums_pb2`. The `ortools.routing` module does **not** exist in 9.15.
- `backend/src/engine/**` MUST NOT import `fastapi`, `starlette`, or anything from `backend.src.routers`. Enforced by a test in Task 1.
- OR-Tools requires integer costs. All distances/times are scaled by `SCALE = 100` (2 decimal places) at the model boundary and divided back out when reading results. Never mix scaled and unscaled values.
- Solomon instances use **Euclidean** distance from raw coordinates, and travel time **equals** distance. Never use road distances for benchmarks — it invalidates the BKS comparison.
- Existing frontend contracts in `backend/src/models.py` are frozen. This plan adds new models only.
- Tailwind design tokens: `utomic.dark #0a0a0a`, `utomic.card #1a1a1a`, `utomic.border #333333`, `utomic.accent #00f0ff`, `utomic.text #ffffff`, `utomic.muted #a3a3a3`. Fonts: `font-display` (Sora), `font-sans` (Inter).
- Every commit must leave `pytest backend/tests` green and the app bootable.

---

## File Structure

**Created:**

| Path | Responsibility |
|---|---|
| `backend/src/engine/__init__.py` | Package marker |
| `backend/src/engine/routing/types.py` | `Vehicle`, `Stop`, `SolveRequest`, `Route`, `Solution` dataclasses |
| `backend/src/engine/routing/solver.py` | `solve()` — the OR-Tools CVRPTW core |
| `backend/src/engine/routing/verify.py` | `verify_solution()` — independent feasibility re-check |
| `backend/src/engine/benchmarks/solomon.py` | Solomon format parser → `SolomonInstance` |
| `backend/src/engine/benchmarks/bks.py` | Published best-known solutions + `gap_pct()` |
| `backend/src/engine/benchmarks/runner.py` | `run_instance()` → `BenchmarkResult` |
| `backend/src/engine/benchmarks/cli.py` | `python -m backend.src.engine.benchmarks.cli C101` |
| `backend/src/engine/matrix/road_matrix.py` | `RoadMatrix` — cached road distances + geometry (Plan 2 prep) |
| `backend/src/routers/benchmark.py` | `GET /api/benchmark/instances`, `POST /api/benchmark/run` |
| `frontend/src/pages/BenchmarkPage.jsx` | The judge-facing benchmark page |
| `scripts/fetch_solomon.py` | One-time instance download |
| `scripts/build_matrix.py` | One-time OSRM matrix + geometry build |
| `backend/tests/engine/*` | Tests mirroring the engine tree |
| `pytest.ini` | pytest rootdir config |

**Modified:** `backend/requirements.txt`, `docker-compose.yml`, `Makefile`, `backend/src/main.py`, `backend/src/models.py`, `frontend/src/App.jsx`

**Deleted** (dead stubs, never imported — verified by grep; git preserves history):
`backend/src/solver/`, `backend/src/packing/`, `backend/src/benchmarks/`, `backend/src/exchange/`, `backend/src/infra/`, `backend/src/contracts.py`

> `packing/` and `exchange/` are rebuilt properly under `engine/` in Plans 2 and 4. Deleting the stubs now prevents importing them by accident.

---

## Task 1: Repo cleanup, dependencies, and engine skeleton

**Files:**
- Create: `backend/src/engine/__init__.py`, `backend/src/engine/routing/__init__.py`, `backend/src/engine/benchmarks/__init__.py`, `backend/src/engine/matrix/__init__.py`, `pytest.ini`
- Create: `backend/tests/__init__.py`, `backend/tests/engine/__init__.py`, `backend/tests/engine/test_engine_purity.py`
- Modify: `backend/requirements.txt`, `docker-compose.yml`, `Makefile`
- Delete: `backend/src/solver/`, `backend/src/packing/`, `backend/src/benchmarks/`, `backend/src/exchange/`, `backend/src/infra/`, `backend/src/contracts.py`

**Interfaces:**
- Consumes: nothing
- Produces: importable `backend.src.engine` package; working `pytest backend/tests`; `make dev` that runs on macOS

- [ ] **Step 1: Confirm the deletions are genuinely dead code**

Run:
```bash
cd /Users/pareshvyas/Setu/backend
grep -rn "solver\|packing\|benchmarks\|exchange.pool\|infra\|contracts" src/main.py src/simulator.py src/models.py src/routers/
```
Expected: only `src/routers/__init__.py:2: from .exchange import router as exchange_router`, which refers to `src/routers/exchange.py` (a keeper), **not** `src/exchange/`. Any other hit means stop and re-check before deleting.

- [ ] **Step 2: Delete the dead stubs**

```bash
cd /Users/pareshvyas/Setu
git rm -r --quiet backend/src/solver backend/src/packing backend/src/benchmarks backend/src/exchange backend/src/infra backend/src/contracts.py
```

- [ ] **Step 3: Add dependencies**

Replace `backend/requirements.txt` with:
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
pydantic==2.7.1
python-multipart==0.0.9
ortools==9.15.6755
numpy==2.3.4
pytest==8.4.2
pytest-asyncio==1.2.0
httpx==0.28.1
```
Removed: `asyncpg`, `SQLAlchemy`, `redis`, `confluent-kafka` — nothing imports them. Postgres persistence arrives in Plan 3 (spec §M7) and re-adds `asyncpg` then.

- [ ] **Step 4: Create the venv and install**

```bash
cd /Users/pareshvyas/Setu
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r backend/requirements.txt
./venv/bin/python -c "from ortools.constraint_solver import pywrapcp; print('ortools OK')"
```
Expected: `ortools OK`

- [ ] **Step 5: Create the engine package skeleton**

Create four empty-but-documented `__init__.py` files:

`backend/src/engine/__init__.py`:
```python
"""SAMANVAY optimisation engine.

Pure Python. This package MUST NOT import FastAPI or any web-layer module —
that rule is what makes the mathematics testable without a server running,
and it is enforced by backend/tests/engine/test_engine_purity.py.
"""
```
`backend/src/engine/routing/__init__.py`:
```python
"""Vehicle routing: the CVRPTW/PDPTW solver core and its feasibility verifier."""
```
`backend/src/engine/benchmarks/__init__.py`:
```python
"""Public-benchmark harness: Solomon instances, best-known solutions, gap reporting."""
```
`backend/src/engine/matrix/__init__.py`:
```python
"""Cached real-road distance, duration and geometry lookups."""
```

- [ ] **Step 6: Add pytest config**

Create `pytest.ini` at the repo root:
```ini
[pytest]
testpaths = backend/tests
python_files = test_*.py
addopts = -v --tb=short
```

- [ ] **Step 7: Write the failing purity test**

Create `backend/tests/__init__.py` and `backend/tests/engine/__init__.py` as empty files, then `backend/tests/engine/test_engine_purity.py`:
```python
"""The engine must stay free of web-layer imports (spec §3.1)."""
import ast
import pathlib

# parents[0]=engine  [1]=tests  [2]=backend  -> backend/src/engine
ENGINE = pathlib.Path(__file__).resolve().parents[2] / "src" / "engine"
FORBIDDEN = {"fastapi", "starlette", "uvicorn", "pydantic"}


def _imported_roots(path: pathlib.Path) -> set[str]:
    tree = ast.parse(path.read_text())
    roots: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            roots.update(a.name.split(".")[0] for a in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
            roots.add(node.module.split(".")[0])
    return roots


def test_engine_directory_exists():
    assert ENGINE.is_dir(), f"engine package missing at {ENGINE}"


def test_engine_imports_no_web_layer():
    offenders = {}
    for py in ENGINE.rglob("*.py"):
        bad = _imported_roots(py) & FORBIDDEN
        if bad:
            offenders[str(py.relative_to(ENGINE))] = sorted(bad)
    assert not offenders, f"engine must not import web-layer modules: {offenders}"
```

- [ ] **Step 8: Run the tests**

Run: `./venv/bin/pytest backend/tests -v`
Expected: 2 passed. (If `test_engine_directory_exists` fails, Step 5 was skipped.)

- [ ] **Step 9: Strip docker-compose to three services**

Replace `docker-compose.yml` with:
```yaml
services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_USER: samanvay
      POSTGRES_PASSWORD: samanvay
      POSTGRES_DB: samanvay
    ports: ["5432:5432"]
    volumes: ["postgres_data:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U samanvay"]
      interval: 5s
      timeout: 3s
      retries: 10

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports: ["8000:8000"]
    depends_on:
      postgres: {condition: service_healthy}
    volumes: ["./backend:/app/backend", "./data:/app/data"]

  web:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports: ["5173:5173"]
    depends_on: [api]

volumes:
  postgres_data:
```
Dropped: `timescale`, `redis`, `zookeeper`, `kafka`, `keycloak`, `minio`, `metabase`, `osrm` — eight unused services (spec §6).

> The `api` and `web` Dockerfiles do not exist yet. They are written in Plan 3, Task "clean-clone deployment". Until then `make dev` runs both locally; `docker compose up postgres` is the only compose usage.

- [ ] **Step 10: Fix the Makefile for POSIX**

The current Makefile uses `./venv/Scripts/` and `start`, which are Windows-only and cannot run on this machine. Replace `Makefile` with:
```makefile
.PHONY: setup dev api web test bench down clean

VENV := ./venv/bin

setup:
	cp -n .env.example .env || true
	python3 -m venv venv
	$(VENV)/pip install --upgrade pip
	$(VENV)/pip install -r backend/requirements.txt
	cd frontend && npm install

api:
	$(VENV)/uvicorn backend.src.main:app --reload --port 8000

web:
	cd frontend && npm run dev

dev:
	@echo "Run 'make api' and 'make web' in two terminals."

test:
	$(VENV)/pytest backend/tests

bench:
	$(VENV)/python -m backend.src.engine.benchmarks.cli C101

down:
	docker compose down -v

clean:
	rm -rf venv frontend/node_modules
```

- [ ] **Step 11: Verify the app still boots**

Run: `./venv/bin/uvicorn backend.src.main:app --port 8000` then in another terminal `curl -s localhost:8000/health`
Expected: JSON with `"status":"ok"` and `"vehicles":40`. Stop the server afterwards.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: remove dead stubs, add engine skeleton, fix POSIX toolchain

Deletes solver/, packing/, benchmarks/, exchange/, infra/ and contracts.py —
all verified unimported. Strips 8 unused compose services. Rewrites the
Windows-only Makefile for POSIX. Adds ortools 9.15.6755 (only version with
Python 3.14 wheels) and a purity test keeping the engine free of FastAPI."
```

---

## Task 2: Solomon instance parser

**Files:**
- Create: `backend/src/engine/benchmarks/solomon.py`, `scripts/fetch_solomon.py`
- Test: `backend/tests/engine/test_solomon.py`

**Interfaces:**
- Consumes: nothing
- Produces: `SolomonInstance(name: str, num_vehicles: int, capacity: int, nodes: list[SolomonNode])` and `parse_solomon(text: str) -> SolomonInstance`, `load_instance(name: str) -> SolomonInstance`. `SolomonNode` has fields `x: float, y: float, demand: int, ready: int, due: int, service: int`. Node index 0 is always the depot.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/engine/test_solomon.py`:
```python
import pytest
from backend.src.engine.benchmarks.solomon import parse_solomon, SolomonInstance

SAMPLE = """C101

VEHICLE
NUMBER     CAPACITY
  25         200

CUSTOMER
CUST NO.  XCOORD.   YCOORD.    DEMAND   READY TIME  DUE DATE   SERVICE   TIME

    0      40         50          0          0       1236          0
    1      45         68         10        912        967         90
    2      45         70         30        825        870         90
"""


def test_parses_header():
    inst = parse_solomon(SAMPLE)
    assert isinstance(inst, SolomonInstance)
    assert inst.name == "C101"
    assert inst.num_vehicles == 25
    assert inst.capacity == 200


def test_parses_depot_as_node_zero():
    depot = parse_solomon(SAMPLE).nodes[0]
    assert (depot.x, depot.y) == (40.0, 50.0)
    assert depot.demand == 0
    assert (depot.ready, depot.due) == (0, 1236)


def test_parses_customers():
    inst = parse_solomon(SAMPLE)
    assert len(inst.nodes) == 3          # depot + 2 customers
    c2 = inst.nodes[2]
    assert (c2.x, c2.y) == (45.0, 70.0)
    assert c2.demand == 30
    assert (c2.ready, c2.due, c2.service) == (825, 870, 90)


def test_ignores_blank_and_short_lines():
    noisy = SAMPLE + "\n   \n  \n"
    assert len(parse_solomon(noisy).nodes) == 3


def test_rejects_input_without_customer_section():
    with pytest.raises(ValueError, match="CUSTOMER"):
        parse_solomon("C101\n\nVEHICLE\nNUMBER CAPACITY\n 25 200\n")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/pytest backend/tests/engine/test_solomon.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'backend.src.engine.benchmarks.solomon'`

- [ ] **Step 3: Implement the parser**

Create `backend/src/engine/benchmarks/solomon.py`:
```python
"""Parser for the Solomon CVRPTW benchmark format.

File layout:

    <NAME>

    VEHICLE
    NUMBER     CAPACITY
      25         200

    CUSTOMER
    CUST NO.  XCOORD.  YCOORD.  DEMAND  READY TIME  DUE DATE  SERVICE TIME
        0      40       50        0         0         1236        0
        ...

Node 0 is the depot. Distances are Euclidean over the raw coordinates and
travel time equals distance — that convention is what makes results
comparable with published best-known solutions, so do not substitute road
distances here.
"""
from __future__ import annotations

import pathlib
from dataclasses import dataclass

DATA_DIR = pathlib.Path(__file__).resolve().parents[4] / "data" / "solomon"


@dataclass(frozen=True)
class SolomonNode:
    x: float
    y: float
    demand: int
    ready: int
    due: int
    service: int


@dataclass(frozen=True)
class SolomonInstance:
    name: str
    num_vehicles: int
    capacity: int
    nodes: list[SolomonNode]

    @property
    def num_customers(self) -> int:
        return len(self.nodes) - 1


def _find(lines: list[str], token: str) -> int:
    for i, line in enumerate(lines):
        if line.strip().upper().startswith(token):
            return i
    raise ValueError(f"malformed Solomon instance: no {token} section found")


def parse_solomon(text: str) -> SolomonInstance:
    lines = text.splitlines()
    if not lines or not lines[0].strip():
        raise ValueError("malformed Solomon instance: missing name on line 1")
    name = lines[0].strip()

    vehicle_at = _find(lines, "VEHICLE")
    num_vehicles, capacity = (int(v) for v in lines[vehicle_at + 2].split()[:2])

    customer_at = _find(lines, "CUSTOMER")
    nodes: list[SolomonNode] = []
    for line in lines[customer_at + 1:]:
        parts = line.split()
        if len(parts) < 7:
            continue                      # header row, blank line, or trailing noise
        try:
            _, x, y, demand, ready, due, service = (float(p) for p in parts[:7])
        except ValueError:
            continue                      # the column-header row
        nodes.append(SolomonNode(x, y, int(demand), int(ready), int(due), int(service)))

    if not nodes:
        raise ValueError("malformed Solomon instance: no customer rows parsed")
    return SolomonInstance(name, num_vehicles, capacity, nodes)


def load_instance(name: str) -> SolomonInstance:
    path = DATA_DIR / f"{name.upper()}.txt"
    if not path.exists():
        raise FileNotFoundError(
            f"instance {name} not found at {path}. Run: python scripts/fetch_solomon.py"
        )
    return parse_solomon(path.read_text())


def available_instances() -> list[str]:
    if not DATA_DIR.is_dir():
        return []
    return sorted(p.stem for p in DATA_DIR.glob("*.txt"))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/pytest backend/tests/engine/test_solomon.py -v`
Expected: 5 passed

- [ ] **Step 5: Write the instance fetch script**

Create `scripts/fetch_solomon.py`:
```python
"""One-time download of Solomon CVRPTW benchmark instances.

Run once: python scripts/fetch_solomon.py
Instances are committed to the repo so the demo needs no internet (spec §2 goal 5).
"""
import pathlib
import sys
import urllib.request

BASE = "https://raw.githubusercontent.com/iRB-Lab/py-ga-VRPTW/master/data/text"
INSTANCES = ["C101", "C201", "R101", "R201", "RC101", "RC201"]
OUT = pathlib.Path(__file__).resolve().parents[1] / "data" / "solomon"


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    failures = []
    for name in INSTANCES:
        dest = OUT / f"{name}.txt"
        if dest.exists():
            print(f"  skip {name} (already present)")
            continue
        try:
            with urllib.request.urlopen(f"{BASE}/{name}.txt", timeout=30) as r:
                body = r.read().decode()
        except Exception as exc:
            failures.append((name, exc))
            print(f"  FAIL {name}: {exc}")
            continue
        if "<!DOCTYPE" in body[:200] or not body.strip():
            failures.append((name, "got HTML, not an instance file"))
            print(f"  FAIL {name}: got HTML, not an instance file")
            continue
        dest.write_text(body)
        print(f"  got  {name} ({len(body.splitlines())} lines)")
    if failures:
        print(f"\n{len(failures)} instance(s) failed. See docs for alternate mirrors.")
        return 1
    print(f"\nAll instances in {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 6: Fetch the instances and verify against the real parser**

```bash
./venv/bin/python scripts/fetch_solomon.py
./venv/bin/python -c "
from backend.src.engine.benchmarks.solomon import load_instance, available_instances
print('available:', available_instances())
i = load_instance('C101')
print(i.name, i.num_customers, 'customers,', i.num_vehicles, 'vehicles, cap', i.capacity)
assert i.num_customers == 100, i.num_customers
assert i.capacity == 200
print('real-instance parse OK')
"
```
Expected: `available: ['C101', 'C201', 'R101', 'R201', 'RC101', 'RC201']` then `C101 100 customers, 25 vehicles, cap 200` and `real-instance parse OK`.

> The mirror above was verified reachable on 2026-08-17. If it 404s, search for another `py-ga-VRPTW` or `VRPTW` instance mirror; the format is standard. Do **not** hand-write instances — the BKS comparison is only meaningful against the canonical files.

- [ ] **Step 7: Commit**

```bash
git add backend/src/engine/benchmarks/solomon.py backend/tests/engine/test_solomon.py scripts/fetch_solomon.py data/solomon
git commit -m "feat: Solomon benchmark instance parser

Real parser replacing the stub that returned one hardcoded node. Ships the
6 canonical 100-customer instances so the benchmark runs offline."
```

---

## Task 3: Routing types

**Files:**
- Create: `backend/src/engine/routing/types.py`
- Test: `backend/tests/engine/test_routing_types.py`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `Vehicle(id: str, capacity: int, start_node: int, shift_start: int, shift_end: int)`
  - `Stop(node: int, demand: int, ready: int, due: int, service: int)`
  - `SolveRequest(stops, vehicles, distance_matrix, time_matrix, depot=0, time_budget_ms=5000, fixed_vehicle_cost=1000)`
  - `Route(vehicle_id: str, stops: list[int], arrivals: list[float], distance_km: float, load: int)`
  - `Solution(routes: list[Route], total_distance: float, vehicles_used: int, total_cost: float, solve_time_ms: int, feasible: bool)`
  - `SolveRequest.n_nodes -> int`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/engine/test_routing_types.py`:
```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/pytest backend/tests/engine/test_routing_types.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'backend.src.engine.routing.types'`

- [ ] **Step 3: Implement the types**

Create `backend/src/engine/routing/types.py`:
```python
"""Data contracts for the routing solver.

Validation lives in __post_init__ so a malformed request fails at construction
with a clear message, rather than inside OR-Tools with an opaque one.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Vehicle:
    id: str
    capacity: int
    start_node: int
    shift_start: int
    shift_end: int


@dataclass(frozen=True)
class Stop:
    node: int
    demand: int
    ready: int
    due: int
    service: int


@dataclass(frozen=True)
class Route:
    vehicle_id: str
    stops: list[int]          # node indices, depot-first and depot-last
    arrivals: list[float]     # arrival time at each stop, same length as stops
    distance_km: float
    load: int


@dataclass(frozen=True)
class Solution:
    routes: list[Route]
    total_distance: float
    vehicles_used: int
    total_cost: float
    solve_time_ms: int
    feasible: bool


@dataclass
class SolveRequest:
    stops: list[Stop]
    vehicles: list[Vehicle]
    distance_matrix: list[list[float]]
    time_matrix: list[list[float]]
    depot: int = 0
    time_budget_ms: int = 5000
    fixed_vehicle_cost: int = 1000

    def __post_init__(self) -> None:
        n = len(self.stops)
        if not self.vehicles:
            raise ValueError("at least one vehicle is required")
        for label, matrix in (("distance_matrix", self.distance_matrix),
                              ("time_matrix", self.time_matrix)):
            if len(matrix) != n or any(len(row) != n for row in matrix):
                raise ValueError(
                    f"{label} must be {n}x{n} to match {n} stops, "
                    f"got {len(matrix)}x{len(matrix[0]) if matrix else 0}"
                )
        for s in self.stops:
            if s.ready > s.due:
                raise ValueError(
                    f"invalid time window at node {s.node}: ready {s.ready} > due {s.due}"
                )

    @property
    def n_nodes(self) -> int:
        return len(self.stops)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/pytest backend/tests/engine/test_routing_types.py -v`
Expected: 7 passed

- [ ] **Step 5: Commit**

```bash
git add backend/src/engine/routing/types.py backend/tests/engine/test_routing_types.py
git commit -m "feat: routing solver data contracts with construction-time validation"
```

---

## Task 4: Independent feasibility verifier

Written **before** the solver deliberately. "The solver said it was feasible" is not evidence; this module is what turns a claim into a check, and it is what the demo's credibility rests on.

**Files:**
- Create: `backend/src/engine/routing/verify.py`
- Test: `backend/tests/engine/test_verify.py`

**Interfaces:**
- Consumes: `types.SolveRequest`, `types.Solution`, `types.Route` (Task 3)
- Produces: `verify_solution(req: SolveRequest, sol: Solution) -> list[str]` returning a list of human-readable violations (empty ⇒ feasible), and `assert_feasible(req, sol) -> None` which raises `InfeasibleSolution` on any violation.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/engine/test_verify.py`:
```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/pytest backend/tests/engine/test_verify.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'backend.src.engine.routing.verify'`

- [ ] **Step 3: Implement the verifier**

Create `backend/src/engine/routing/verify.py`:
```python
"""Independent feasibility checking.

This module re-derives every constraint from the request and the returned
routes. It shares no code with the solver on purpose: a bug in the OR-Tools
model must not be able to hide behind the same bug in the checker.
"""
from __future__ import annotations

from .types import SolveRequest, Solution

TOL = 1e-6


class InfeasibleSolution(Exception):
    """Raised when a solution violates the constraints it claims to satisfy."""


def verify_solution(req: SolveRequest, sol: Solution) -> list[str]:
    violations: list[str] = []
    by_id = {v.id: v for v in req.vehicles}
    stop_by_node = {s.node: s for s in req.stops}
    visited: dict[int, str] = {}

    for route in sol.routes:
        if not route.stops:
            continue

        if route.stops[0] != req.depot or route.stops[-1] != req.depot:
            violations.append(
                f"route {route.vehicle_id} must start and end at depot "
                f"{req.depot}, got {route.stops[0]}..{route.stops[-1]}"
            )

        if len(route.arrivals) != len(route.stops):
            violations.append(
                f"route {route.vehicle_id} has {len(route.stops)} stops but "
                f"{len(route.arrivals)} arrival times"
            )
            continue

        vehicle = by_id.get(route.vehicle_id)
        load = sum(stop_by_node[n].demand for n in route.stops if n in stop_by_node)
        if vehicle is not None and load > vehicle.capacity:
            violations.append(
                f"route {route.vehicle_id} carries {load} over capacity {vehicle.capacity}"
            )

        for node, arrival in zip(route.stops, route.arrivals):
            if node == req.depot:
                continue
            stop = stop_by_node.get(node)
            if stop is None:
                violations.append(f"route {route.vehicle_id} visits unknown node {node}")
                continue
            if arrival > stop.due + TOL:
                violations.append(
                    f"node {node} time window violated on {route.vehicle_id}: "
                    f"arrives {arrival:.2f}, due {stop.due}"
                )
            if node in visited:
                violations.append(
                    f"node {node} served more than once "
                    f"({visited[node]} and {route.vehicle_id})"
                )
            else:
                visited[node] = route.vehicle_id

    for stop in req.stops:
        if stop.node != req.depot and stop.node not in visited:
            violations.append(f"node {stop.node} not served by any route")

    return violations


def assert_feasible(req: SolveRequest, sol: Solution) -> None:
    violations = verify_solution(req, sol)
    if violations:
        raise InfeasibleSolution(
            f"{len(violations)} violation(s): " + "; ".join(violations[:5])
        )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/pytest backend/tests/engine/test_verify.py -v`
Expected: 8 passed

- [ ] **Step 5: Commit**

```bash
git add backend/src/engine/routing/verify.py backend/tests/engine/test_verify.py
git commit -m "feat: independent solution feasibility verifier

Shares no code with the solver by design, so a modelling bug cannot hide
behind the same bug in the checker."
```

---

## Task 5: The CVRPTW solver

**Files:**
- Create: `backend/src/engine/routing/solver.py`
- Test: `backend/tests/engine/test_solver.py`

**Interfaces:**
- Consumes: `types.SolveRequest`, `types.Solution`, `types.Route` (Task 3); `verify.verify_solution` (Task 4, tests only)
- Produces: `solve(req: SolveRequest) -> Solution | None` (returns `None` when OR-Tools finds no solution) and the module constant `SCALE = 100`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/engine/test_solver.py`:
```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/pytest backend/tests/engine/test_solver.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'backend.src.engine.routing.solver'`

- [ ] **Step 3: Implement the solver**

Create `backend/src/engine/routing/solver.py`. This model is verified working — it reaches 10 vehicles / 829.01 on the real Solomon C101 (best-known: 10 / 828.94).

```python
"""Anytime CVRPTW solver built on OR-Tools routing.

Search: PATH_CHEAPEST_ARC for a first solution, then GUIDED_LOCAL_SEARCH until
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
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/pytest backend/tests/engine/test_solver.py -v`
Expected: 8 passed (allow ~20s total — several tests run real searches)

- [ ] **Step 5: Run the whole suite**

Run: `./venv/bin/pytest backend/tests -v`
Expected: all passed

- [ ] **Step 6: Commit**

```bash
git add backend/src/engine/routing/solver.py backend/tests/engine/test_solver.py
git commit -m "feat: anytime CVRPTW solver on OR-Tools

PATH_CHEAPEST_ARC then guided local search under a hard time budget, with
capacity, time windows and a fixed per-vehicle cost. Every test solution is
checked by the independent verifier, not by the solver's own claim."
```

---

## Task 6: Best-known solutions and gap computation

**Files:**
- Create: `backend/src/engine/benchmarks/bks.py`
- Test: `backend/tests/engine/test_bks.py`

**Interfaces:**
- Consumes: nothing
- Produces: `BEST_KNOWN: dict[str, BKS]` where `BKS(vehicles: int, distance: float, source: str)`; `gap_pct(ours: float, best: float) -> float`; `lookup(name: str) -> BKS | None`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/engine/test_bks.py`:
```python
import pytest
from backend.src.engine.benchmarks.bks import BEST_KNOWN, gap_pct, lookup, BKS


def test_c101_best_known_present():
    b = lookup("C101")
    assert b is not None
    assert b.vehicles == 10
    assert b.distance == pytest.approx(828.94)


def test_lookup_is_case_insensitive():
    assert lookup("c101") == lookup("C101")


def test_lookup_returns_none_for_unknown():
    assert lookup("NOPE999") is None


def test_every_entry_has_a_source_citation():
    for name, b in BEST_KNOWN.items():
        assert b.source, f"{name} has no source — an uncited BKS is worthless"


def test_gap_is_zero_when_matching():
    assert gap_pct(828.94, 828.94) == pytest.approx(0.0)


def test_gap_is_positive_when_worse():
    assert gap_pct(850.0, 828.94) == pytest.approx(2.541, abs=1e-3)


def test_gap_is_negative_when_better():
    assert gap_pct(800.0, 828.94) < 0


def test_gap_rejects_zero_best():
    with pytest.raises(ValueError):
        gap_pct(10.0, 0.0)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/pytest backend/tests/engine/test_bks.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement**

Create `backend/src/engine/benchmarks/bks.py`:
```python
"""Published best-known solutions for Solomon 100-customer CVRPTW instances.

These numbers are the yardstick the whole benchmark claim rests on. If one is
wrong, the reported gap is wrong and the credibility argument collapses — so
every entry carries a source and MUST be re-checked against it before the
figures are shown to anyone. See docs/PROVENANCE.md.

Convention: (vehicles, distance) minimising vehicles first, then distance.
"""
from __future__ import annotations

from dataclasses import dataclass

SOURCE = "Solomon (1987) benchmark set; best-known values as published by SINTEF TOP"


@dataclass(frozen=True)
class BKS:
    vehicles: int
    distance: float
    source: str = SOURCE


BEST_KNOWN: dict[str, BKS] = {
    "C101":  BKS(10, 828.94),
    "C201":  BKS(3, 591.56),
    "R101":  BKS(19, 1650.80),
    "R201":  BKS(4, 1252.37),
    "RC101": BKS(14, 1696.95),
    "RC201": BKS(4, 1406.94),
}


def lookup(name: str) -> BKS | None:
    return BEST_KNOWN.get(name.strip().upper())


def gap_pct(ours: float, best: float) -> float:
    """Percentage above best-known. Negative means we beat it."""
    if best == 0:
        raise ValueError("best-known distance cannot be zero")
    return (ours - best) / best * 100.0
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/pytest backend/tests/engine/test_bks.py -v`
Expected: 8 passed

- [ ] **Step 5: Commit**

```bash
git add backend/src/engine/benchmarks/bks.py backend/tests/engine/test_bks.py
git commit -m "feat: published best-known solutions and gap computation"
```

---

## Task 7: Benchmark runner and CLI

**Files:**
- Create: `backend/src/engine/benchmarks/runner.py`, `backend/src/engine/benchmarks/cli.py`
- Test: `backend/tests/engine/test_runner.py`

**Interfaces:**
- Consumes: `solomon.load_instance` (Task 2), `types.*` (Task 3), `verify.verify_solution` (Task 4), `solver.solve` (Task 5), `bks.lookup`/`gap_pct` (Task 6)
- Produces: `to_solve_request(inst: SolomonInstance, time_budget_ms: int) -> SolveRequest`; `run_instance(name: str, time_budget_ms: int = 5000) -> BenchmarkResult`; `BenchmarkResult(instance, customers, vehicles_used, distance, bks_vehicles, bks_distance, gap_pct, solve_time_ms, feasible, violations)`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/engine/test_runner.py`:
```python
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
```

- [ ] **Step 2: Register the `slow` marker**

Append to `pytest.ini`:
```ini
markers =
    slow: runs a full benchmark solve (several seconds)
```

- [ ] **Step 3: Run test to verify it fails**

Run: `./venv/bin/pytest backend/tests/engine/test_runner.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'backend.src.engine.benchmarks.runner'`

- [ ] **Step 4: Implement the runner**

Create `backend/src/engine/benchmarks/runner.py`:
```python
"""Runs public Solomon instances and reports the gap to best-known.

This is the answer to the judge's question "how do I know your routes are
actually good and not just plausible lines on a map?" — public instances,
published optima, our gap, our runtime, reproducible on their laptop.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

from ..routing.solver import solve
from ..routing.types import SolveRequest, Stop, Vehicle
from ..routing.verify import verify_solution
from .bks import gap_pct, lookup
from .solomon import SolomonInstance, load_instance


@dataclass(frozen=True)
class BenchmarkResult:
    instance: str
    customers: int
    vehicles_used: int
    distance: float
    bks_vehicles: int | None
    bks_distance: float | None
    gap_pct: float | None
    solve_time_ms: int
    feasible: bool
    violations: list[str] = field(default_factory=list)


def to_solve_request(inst: SolomonInstance, time_budget_ms: int) -> SolveRequest:
    """Solomon instances are Euclidean and travel time equals distance."""
    pts = [(n.x, n.y) for n in inst.nodes]
    matrix = [[math.dist(a, b) for b in pts] for a in pts]

    stops = [
        Stop(node=i, demand=n.demand, ready=n.ready, due=n.due, service=n.service)
        for i, n in enumerate(inst.nodes)
    ]
    depot = inst.nodes[0]
    vehicles = [
        Vehicle(id=f"v{k}", capacity=inst.capacity, start_node=0,
                shift_start=depot.ready, shift_end=depot.due)
        for k in range(inst.num_vehicles)
    ]
    return SolveRequest(
        stops=stops, vehicles=vehicles,
        distance_matrix=matrix, time_matrix=[row[:] for row in matrix],
        depot=0, time_budget_ms=time_budget_ms,
    )


def run_instance(name: str, time_budget_ms: int = 5000) -> BenchmarkResult:
    inst = load_instance(name)
    req = to_solve_request(inst, time_budget_ms)
    sol = solve(req)

    if sol is None:
        return BenchmarkResult(
            instance=inst.name, customers=inst.num_customers, vehicles_used=0,
            distance=0.0, bks_vehicles=None, bks_distance=None, gap_pct=None,
            solve_time_ms=time_budget_ms, feasible=False,
            violations=["solver returned no solution within the time budget"],
        )

    violations = verify_solution(req, sol)
    best = lookup(inst.name)
    return BenchmarkResult(
        instance=inst.name,
        customers=inst.num_customers,
        vehicles_used=sol.vehicles_used,
        distance=round(sol.total_distance, 2),
        bks_vehicles=best.vehicles if best else None,
        bks_distance=best.distance if best else None,
        gap_pct=round(gap_pct(sol.total_distance, best.distance), 3) if best else None,
        solve_time_ms=sol.solve_time_ms,
        feasible=not violations,
        violations=violations,
    )
```

- [ ] **Step 5: Run test to verify it passes**

Run: `./venv/bin/pytest backend/tests/engine/test_runner.py -v`
Expected: 5 passed. The `slow` test takes ~5s.

- [ ] **Step 6: Write the CLI**

Create `backend/src/engine/benchmarks/cli.py`:
```python
"""Command-line benchmark runner.

    python -m backend.src.engine.benchmarks.cli            # every shipped instance
    python -m backend.src.engine.benchmarks.cli C101       # one instance
    python -m backend.src.engine.benchmarks.cli C101 --budget 15000
"""
from __future__ import annotations

import argparse
import sys

from .runner import run_instance
from .solomon import available_instances

HEADER = f"{'INSTANCE':<9}{'CUST':>5}{'VEH':>5}{'BKS':>5}{'DISTANCE':>11}{'BKS DIST':>11}{'GAP %':>9}{'TIME':>8}  OK"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run Solomon CVRPTW benchmarks")
    parser.add_argument("instances", nargs="*", help="instance names (default: all)")
    parser.add_argument("--budget", type=int, default=5000, help="ms per instance")
    args = parser.parse_args(argv)

    names = [n.upper() for n in args.instances] or available_instances()
    if not names:
        print("No instances found. Run: python scripts/fetch_solomon.py", file=sys.stderr)
        return 1

    print(HEADER)
    print("-" * len(HEADER))
    worst = 0.0
    for name in names:
        r = run_instance(name, time_budget_ms=args.budget)
        gap = f"{r.gap_pct:+.3f}" if r.gap_pct is not None else "n/a"
        bksv = r.bks_vehicles if r.bks_vehicles is not None else "-"
        bksd = f"{r.bks_distance:.2f}" if r.bks_distance is not None else "-"
        flag = "yes" if r.feasible else "NO"
        print(f"{r.instance:<9}{r.customers:>5}{r.vehicles_used:>5}{bksv:>5}"
              f"{r.distance:>11.2f}{bksd:>11}{gap:>9}{r.solve_time_ms:>7}ms  {flag}")
        for v in r.violations[:3]:
            print(f"          ! {v}")
        if r.gap_pct is not None:
            worst = max(worst, r.gap_pct)
    print(f"\nworst gap: {worst:+.3f}%")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 7: Run the CLI on every instance**

Run: `./venv/bin/python -m backend.src.engine.benchmarks.cli --budget 5000`
Expected: a table with a row per instance, `OK = yes` on every row, and C101 showing 10 vehicles with a gap near `+0.008`. Record the output — it goes in the demo.

> If any instance reports `OK = NO`, stop and investigate before continuing. An infeasible benchmark result means the solver model is wrong, and every downstream number inherits that error.

- [ ] **Step 8: Commit**

```bash
git add backend/src/engine/benchmarks/runner.py backend/src/engine/benchmarks/cli.py backend/tests/engine/test_runner.py pytest.ini
git commit -m "feat: Solomon benchmark runner and CLI

Reports vehicles, distance, gap to best-known, and runtime, with every
solution passing independent feasibility verification."
```

---

## Task 8: Benchmark API endpoints

**Files:**
- Create: `backend/src/routers/benchmark.py`
- Modify: `backend/src/models.py` (append), `backend/src/main.py` (register router)
- Test: `backend/tests/test_benchmark_api.py`

**Interfaces:**
- Consumes: `runner.run_instance`, `solomon.available_instances`, `bks.BEST_KNOWN`
- Produces: `GET /api/benchmark/instances` → `list[BenchmarkInstanceInfo]`; `POST /api/benchmark/run` (body `BenchmarkRunRequest`) → `BenchmarkRunResult`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_benchmark_api.py`:
```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/pytest backend/tests/test_benchmark_api.py -v`
Expected: FAIL — 404 on `/api/benchmark/instances`

- [ ] **Step 3: Append the response models**

Append to `backend/src/models.py` (do not modify anything above — those shapes are frozen):
```python
# ── Benchmark (Plan 1) ───────────────────────────────────────────────────────

class BenchmarkInstanceInfo(BaseModel):
    name: str
    customers: int
    bks_vehicles: Optional[int] = None
    bks_distance: Optional[float] = None

class BenchmarkRunRequest(BaseModel):
    instance: str
    time_budget_ms: int = 5000

class BenchmarkRunResult(BaseModel):
    instance: str
    customers: int
    vehicles_used: int
    distance: float
    bks_vehicles: Optional[int] = None
    bks_distance: Optional[float] = None
    gap_pct: Optional[float] = None
    solve_time_ms: int
    feasible: bool
    violations: List[str] = []
```

- [ ] **Step 4: Implement the router**

Create `backend/src/routers/benchmark.py`:
```python
"""Benchmark endpoints.

Solves are CPU-bound and would block the asyncio event loop, freezing the 2Hz
telemetry broadcast the whole dashboard depends on. Every solve therefore runs
in a process pool (spec §3.3).
"""
import asyncio
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
    return BenchmarkRunResult(**result.__dict__)
```

- [ ] **Step 5: Register the router**

In `backend/src/main.py`, add the import beside the existing router imports:
```python
from .routers.benchmark import router as benchmark_router
```
and register it beside the others:
```python
app.include_router(benchmark_router)
```

- [ ] **Step 6: Run test to verify it passes**

Run: `./venv/bin/pytest backend/tests/test_benchmark_api.py -v`
Expected: 4 passed

- [ ] **Step 7: Verify the event loop is not blocked**

Start the API (`./venv/bin/uvicorn backend.src.main:app --port 8000`), then:
```bash
curl -s -X POST localhost:8000/api/benchmark/run \
  -H 'Content-Type: application/json' \
  -d '{"instance":"C101","time_budget_ms":15000}' > /tmp/bench.json &
sleep 3
time curl -s localhost:8000/health
wait
cat /tmp/bench.json
```
Expected: `/health` returns in well under a second **while the 15s solve is running**. If it hangs, the process pool is not being used — fix before continuing, because this is what keeps the live map moving during the demo.

- [ ] **Step 8: Commit**

```bash
git add backend/src/routers/benchmark.py backend/src/models.py backend/src/main.py backend/tests/test_benchmark_api.py
git commit -m "feat: benchmark REST endpoints

Solves run in a ProcessPoolExecutor so CPU-bound work never blocks the
telemetry broadcast."
```

---

## Task 9: Benchmark page in the UI

**Files:**
- Create: `frontend/src/pages/BenchmarkPage.jsx`
- Modify: `frontend/src/lib/api.js` (append), `frontend/src/App.jsx` (add route)

**Interfaces:**
- Consumes: `GET /api/benchmark/instances`, `POST /api/benchmark/run` (Task 8)
- Produces: route `/benchmark`; exported API helpers `getBenchmarkInstances()`, `runBenchmark({instance, time_budget_ms})`

- [ ] **Step 1: Add the API helpers**

Append to `frontend/src/lib/api.js`, after the Exchange section:
```javascript
// ── Benchmark ─────────────────────────────────────────────────────────────────
export const getBenchmarkInstances = () => apiFetch('/api/benchmark/instances');
export const runBenchmark = ({ instance, time_budget_ms = 5000 }) =>
  apiFetch('/api/benchmark/run', {
    method: 'POST',
    body: JSON.stringify({ instance, time_budget_ms }),
  });
```

- [ ] **Step 2: Build the page**

Create `frontend/src/pages/BenchmarkPage.jsx`:
```jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/landing/Header';
import Footer from '../components/landing/Footer';
import { getBenchmarkInstances, runBenchmark } from '../lib/api';

const BUDGETS = [1000, 5000, 15000];

function GapBadge({ gap }) {
  if (gap === null || gap === undefined) return <span className="text-utomic-muted">n/a</span>;
  const tone = gap <= 0 ? 'text-emerald-400' : gap < 2 ? 'text-utomic-accent' : 'text-amber-400';
  return <span className={`font-mono font-semibold ${tone}`}>{gap >= 0 ? '+' : ''}{gap.toFixed(3)}%</span>;
}

export default function BenchmarkPage() {
  const [instances, setInstances] = useState([]);
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(null);
  const [budget, setBudget] = useState(5000);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBenchmarkInstances().then(setInstances).catch((e) => setError(e.message));
  }, []);

  async function run(name) {
    setRunning(name);
    setError(null);
    try {
      const r = await runBenchmark({ instance: name, time_budget_ms: budget });
      setResults((prev) => ({ ...prev, [name]: r }));
    } catch (e) {
      setError(`${name}: ${e.message}`);
    } finally {
      setRunning(null);
    }
  }

  async function runAll() {
    for (const i of instances) await run(i.name);
  }

  return (
    <div className="min-h-screen bg-utomic-dark text-utomic-text font-sans">
      <Header />
      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-4xl md:text-5xl mb-4">Solver Benchmark</h1>
          <p className="text-utomic-muted max-w-3xl leading-relaxed">
            Our routing engine solved against the public{' '}
            <span className="text-utomic-text">Solomon (1987)</span> CVRPTW instances,
            live, in this browser. Gap is measured against published best-known
            solutions. Every result below is re-checked by an independent feasibility
            verifier before it is displayed — capacity, time windows, and single-visit
            coverage.
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center gap-3 mt-10 mb-6">
          <span className="text-utomic-muted text-sm">Time budget</span>
          {BUDGETS.map((b) => (
            <button
              key={b}
              onClick={() => setBudget(b)}
              className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                budget === b
                  ? 'border-utomic-accent text-utomic-accent bg-utomic-accent/10'
                  : 'border-utomic-border text-utomic-muted hover:text-utomic-text'
              }`}
            >
              {b / 1000}s
            </button>
          ))}
          <button
            onClick={runAll}
            disabled={running !== null}
            className="ml-auto px-5 py-2 rounded-md bg-utomic-accent text-utomic-dark font-semibold text-sm disabled:opacity-40"
          >
            {running ? `Solving ${running}…` : 'Run all instances'}
          </button>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-md border border-red-500/40 bg-red-500/10 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto border border-utomic-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-utomic-card text-utomic-muted">
              <tr>
                {['Instance', 'Customers', 'Vehicles', 'Best known', 'Distance',
                  'Best known', 'Gap', 'Solve time', 'Verified', ''].map((h, i) => (
                  <th key={i} className="text-left font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {instances.map((inst) => {
                const r = results[inst.name];
                return (
                  <tr key={inst.name} className="border-t border-utomic-border">
                    <td className="px-4 py-3 font-mono">{inst.name}</td>
                    <td className="px-4 py-3">{inst.customers}</td>
                    <td className="px-4 py-3 font-mono">{r ? r.vehicles_used : '—'}</td>
                    <td className="px-4 py-3 font-mono text-utomic-muted">{inst.bks_vehicles ?? '—'}</td>
                    <td className="px-4 py-3 font-mono">{r ? r.distance.toFixed(2) : '—'}</td>
                    <td className="px-4 py-3 font-mono text-utomic-muted">
                      {inst.bks_distance ? inst.bks_distance.toFixed(2) : '—'}
                    </td>
                    <td className="px-4 py-3"><GapBadge gap={r ? r.gap_pct : null} /></td>
                    <td className="px-4 py-3 font-mono">{r ? `${r.solve_time_ms}ms` : '—'}</td>
                    <td className="px-4 py-3">
                      {!r ? '—' : r.feasible
                        ? <span className="text-emerald-400">PASS</span>
                        : <span className="text-red-400" title={r.violations.join('; ')}>FAIL</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => run(inst.name)}
                        disabled={running !== null}
                        className="px-3 py-1.5 rounded border border-utomic-border text-utomic-muted hover:text-utomic-accent hover:border-utomic-accent transition-colors disabled:opacity-40"
                      >
                        {running === inst.name ? '…' : 'Run'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-utomic-muted text-xs mt-6 leading-relaxed">
          Best-known values: Solomon (1987) benchmark set, as published by SINTEF TOP.
          Distances are Euclidean over the raw instance coordinates and travel time
          equals distance, per the standard benchmark convention. Solver: OR-Tools
          guided local search under a hard time budget, returning the best solution
          found so far.
        </p>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3: Add the route**

In `frontend/src/App.jsx`, import beside the other page imports:
```jsx
import BenchmarkPage from './pages/BenchmarkPage';
```
and add the route beside `/docs`:
```jsx
<Route path="/benchmark" element={<BenchmarkPage />} />
```

- [ ] **Step 4: Verify in the browser**

Run the API and the frontend in two terminals:
```bash
./venv/bin/uvicorn backend.src.main:app --port 8000
cd frontend && npm run dev
```
Open `http://localhost:5173/benchmark`. Click **Run all instances**.
Expected: six rows populate; C101 shows 10 vehicles against best-known 10, a gap near `+0.008%`, and `PASS` in the Verified column. No console errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/BenchmarkPage.jsx frontend/src/lib/api.js frontend/src/App.jsx
git commit -m "feat: live Solomon benchmark page

Runs public instances in-app and reports gap to published best-known, with
an explicit verification column. This is the answer to 'how do I know your
routes are actually good?'"
```

---

## Task 10: Road matrix (preparation for Plan 2)

The benchmark path is complete and banked before this task begins — deliberately, because this is the riskiest item in the plan and the only one needing Docker and multi-GB downloads. Nothing in Tasks 1–9 depends on it.

**Files:**
- Create: `scripts/build_matrix.py`, `backend/src/engine/matrix/road_matrix.py`
- Test: `backend/tests/engine/test_road_matrix.py`

**Interfaces:**
- Consumes: nothing
- Produces: `RoadMatrix.load(dir) -> RoadMatrix` with `dist(i, j) -> float` (km), `dur(i, j) -> float` (minutes), `geometry(i, j) -> list[tuple[float, float]]`, `position_along(i, j, progress) -> tuple[float, float]`, `n_nodes -> int`. Plan 2's PDPTW adapter and Plan 3's orchestrator both depend on these signatures.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/engine/test_road_matrix.py`:
```python
import json
import numpy as np
import pytest
from backend.src.engine.matrix.road_matrix import RoadMatrix


@pytest.fixture
def matrix_dir(tmp_path):
    np.savez(tmp_path / "matrix.npz",
             dist_km=np.array([[0.0, 10.0], [10.0, 0.0]]),
             dur_min=np.array([[0.0, 15.0], [15.0, 0.0]]))
    (tmp_path / "nodes.json").write_text(json.dumps(
        [{"id": "A", "lat": 23.0, "lon": 72.0}, {"id": "B", "lat": 24.0, "lon": 73.0}]))
    (tmp_path / "geometry.json").write_text(json.dumps(
        {"0-1": [[23.0, 72.0], [23.5, 72.5], [24.0, 73.0]]}))
    return tmp_path


def test_loads_and_reports_size(matrix_dir):
    assert RoadMatrix.load(matrix_dir).n_nodes == 2


def test_distance_and_duration(matrix_dir):
    m = RoadMatrix.load(matrix_dir)
    assert m.dist(0, 1) == 10.0
    assert m.dur(0, 1) == 15.0
    assert m.dist(1, 1) == 0.0


def test_geometry_returns_polyline(matrix_dir):
    assert len(RoadMatrix.load(matrix_dir).geometry(0, 1)) == 3


def test_position_along_hits_endpoints(matrix_dir):
    m = RoadMatrix.load(matrix_dir)
    assert m.position_along(0, 1, 0.0) == pytest.approx((23.0, 72.0))
    assert m.position_along(0, 1, 1.0) == pytest.approx((24.0, 73.0))


def test_position_along_midpoint_is_on_the_polyline(matrix_dir):
    lat, lon = RoadMatrix.load(matrix_dir).position_along(0, 1, 0.5)
    assert 23.0 < lat < 24.0 and 72.0 < lon < 73.0


def test_position_along_clamps_out_of_range(matrix_dir):
    m = RoadMatrix.load(matrix_dir)
    assert m.position_along(0, 1, -5.0) == pytest.approx((23.0, 72.0))
    assert m.position_along(0, 1, 99.0) == pytest.approx((24.0, 73.0))


def test_falls_back_to_straight_line_without_geometry(matrix_dir):
    m = RoadMatrix.load(matrix_dir)
    assert m.position_along(1, 0, 0.0) == pytest.approx((24.0, 73.0))
    assert m.position_along(1, 0, 1.0) == pytest.approx((23.0, 72.0))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/pytest backend/tests/engine/test_road_matrix.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement RoadMatrix**

Create `backend/src/engine/matrix/road_matrix.py`:
```python
"""Cached real-road distances, durations and geometry.

Built once, offline, by scripts/build_matrix.py and committed to the repo, so
the demo needs neither an OSRM service nor a network connection (spec §3.2).

A distance matrix alone cannot animate a vehicle: it yields scalars, not
shapes. position_along() walks the cached polyline so trucks follow real roads
instead of the straight lines the old simulator drew.
"""
from __future__ import annotations

import json
import math
import pathlib

import numpy as np


class RoadMatrix:
    def __init__(self, dist_km, dur_min, nodes: list[dict], geometry: dict[str, list]):
        self._dist = dist_km
        self._dur = dur_min
        self.nodes = nodes
        self._geometry = geometry

    @classmethod
    def load(cls, directory: str | pathlib.Path) -> "RoadMatrix":
        d = pathlib.Path(directory)
        payload = np.load(d / "matrix.npz")
        nodes = json.loads((d / "nodes.json").read_text())
        geometry_path = d / "geometry.json"
        geometry = json.loads(geometry_path.read_text()) if geometry_path.exists() else {}
        return cls(payload["dist_km"], payload["dur_min"], nodes, geometry)

    @property
    def n_nodes(self) -> int:
        return len(self.nodes)

    def dist(self, i: int, j: int) -> float:
        return float(self._dist[i][j])

    def dur(self, i: int, j: int) -> float:
        return float(self._dur[i][j])

    def geometry(self, i: int, j: int) -> list[tuple[float, float]]:
        """Cached polyline, or a straight two-point fallback if none was built."""
        key = f"{i}-{j}"
        if key in self._geometry:
            return [tuple(p) for p in self._geometry[key]]
        a, b = self.nodes[i], self.nodes[j]
        return [(a["lat"], a["lon"]), (b["lat"], b["lon"])]

    def position_along(self, i: int, j: int, progress: float) -> tuple[float, float]:
        """Point at `progress` (0..1) of the way along the i→j polyline."""
        line = self.geometry(i, j)
        t = min(1.0, max(0.0, progress))
        if len(line) < 2:
            return line[0]

        segments = [
            math.dist(line[k], line[k + 1]) for k in range(len(line) - 1)
        ]
        total = sum(segments)
        if total == 0:
            return line[0]

        target = t * total
        travelled = 0.0
        for k, seg in enumerate(segments):
            if travelled + seg >= target:
                local = (target - travelled) / seg if seg else 0.0
                (lat1, lon1), (lat2, lon2) = line[k], line[k + 1]
                return (lat1 + (lat2 - lat1) * local, lon1 + (lon2 - lon1) * local)
            travelled += seg
        return line[-1]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/pytest backend/tests/engine/test_road_matrix.py -v`
Expected: 7 passed

- [ ] **Step 5: Write the build script**

Create `scripts/build_matrix.py`:
```python
"""One-time build of the cached road matrix and route geometry.

Requires Docker and roughly 3GB of downloads. Run once; commit the output.

    docker compose down                     # free the ports first
    python scripts/build_matrix.py

Writes data/road/{matrix.npz,nodes.json,geometry.json}.

If this proves impractical, --fallback writes a haversine x 1.3 circuity
approximation instead. That is a genuine downgrade and the UI must label it as
an approximation rather than as road routing (spec §M1).
"""
from __future__ import annotations

import argparse
import itertools
import json
import math
import pathlib
import subprocess
import sys
import time
import urllib.request

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "road"
OSM_DIR = ROOT / "data" / "osm"
PBF_URL = "https://download.geofabrik.de/asia/india/gujarat-latest.osm.pbf"
OSRM_PORT = 5010
OSRM_IMAGE = "ghcr.io/project-osrm/osrm-backend:latest"

# The corridor the demo runs on. Extend with shipment nodes as scenarios grow.
NODES = [
    {"id": "Ahmedabad", "lat": 23.0225, "lon": 72.5714},
    {"id": "Surat",     "lat": 21.1702, "lon": 72.8311},
    {"id": "Vadodara",  "lat": 22.3072, "lon": 73.1812},
    {"id": "Rajkot",    "lat": 22.3039, "lon": 70.8022},
    {"id": "Bhavnagar", "lat": 21.7645, "lon": 72.1519},
    {"id": "Jamnagar",  "lat": 22.4707, "lon": 70.0577},
    {"id": "Anand",     "lat": 22.5645, "lon": 72.9289},
    {"id": "Bharuch",   "lat": 21.7051, "lon": 72.9959},
]


def haversine_km(a: dict, b: dict) -> float:
    R = 6371.0
    p1, p2 = math.radians(a["lat"]), math.radians(b["lat"])
    dp = p2 - p1
    dl = math.radians(b["lon"] - a["lon"])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return R * 2 * math.asin(math.sqrt(h))


def build_fallback() -> None:
    n = len(NODES)
    dist = np.zeros((n, n))
    dur = np.zeros((n, n))
    for i, j in itertools.product(range(n), repeat=2):
        if i == j:
            continue
        km = haversine_km(NODES[i], NODES[j]) * 1.3   # circuity factor
        dist[i][j] = round(km, 2)
        dur[i][j] = round(km / 45.0 * 60.0, 1)        # 45 km/h average
    _write(dist, dur, {}, approximate=True)
    print("WROTE APPROXIMATE MATRIX — the UI must label this as an estimate.")


def _write(dist, dur, geometry: dict, approximate: bool) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    np.savez(OUT / "matrix.npz", dist_km=dist, dur_min=dur)
    (OUT / "nodes.json").write_text(json.dumps(NODES, indent=2))
    (OUT / "geometry.json").write_text(json.dumps(geometry))
    (OUT / "META.json").write_text(json.dumps({
        "approximate": approximate,
        "source": "haversine x 1.3" if approximate else "OSRM over OSM Gujarat extract",
        "built_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "nodes": len(NODES),
    }, indent=2))
    print(f"wrote {OUT}/matrix.npz, nodes.json, geometry.json, META.json")


def _sh(cmd: list[str]) -> None:
    print("  $", " ".join(cmd))
    subprocess.run(cmd, check=True)


def build_from_osrm() -> None:
    OSM_DIR.mkdir(parents=True, exist_ok=True)
    pbf = OSM_DIR / "gujarat-latest.osm.pbf"
    if not pbf.exists():
        print(f"downloading {PBF_URL} (~150MB) ...")
        urllib.request.urlretrieve(PBF_URL, pbf)

    vol = f"{OSM_DIR}:/data"
    base = "/data/gujarat-latest.osm.pbf"
    print("preprocessing with OSRM (several minutes) ...")
    _sh(["docker", "run", "--rm", "-v", vol, OSRM_IMAGE,
         "osrm-extract", "-p", "/opt/car.lua", base])
    _sh(["docker", "run", "--rm", "-v", vol, OSRM_IMAGE,
         "osrm-partition", "/data/gujarat-latest.osrm"])
    _sh(["docker", "run", "--rm", "-v", vol, OSRM_IMAGE,
         "osrm-customize", "/data/gujarat-latest.osrm"])

    print("starting OSRM ...")
    cid = subprocess.run(
        ["docker", "run", "-d", "-p", f"{OSRM_PORT}:5000", "-v", vol, OSRM_IMAGE,
         "osrm-routed", "--algorithm", "mld", "/data/gujarat-latest.osrm"],
        check=True, capture_output=True, text=True,
    ).stdout.strip()

    try:
        for _ in range(30):
            try:
                urllib.request.urlopen(f"http://localhost:{OSRM_PORT}/health", timeout=2)
                break
            except Exception:
                time.sleep(2)

        coords = ";".join(f"{n['lon']},{n['lat']}" for n in NODES)
        with urllib.request.urlopen(
            f"http://localhost:{OSRM_PORT}/table/v1/driving/{coords}"
            "?annotations=distance,duration", timeout=120
        ) as r:
            table = json.load(r)

        n = len(NODES)
        dist = np.array(table["distances"], dtype=float) / 1000.0
        dur = np.array(table["durations"], dtype=float) / 60.0

        geometry: dict[str, list] = {}
        for i, j in itertools.permutations(range(n), 2):
            a, b = NODES[i], NODES[j]
            url = (f"http://localhost:{OSRM_PORT}/route/v1/driving/"
                   f"{a['lon']},{a['lat']};{b['lon']},{b['lat']}"
                   "?overview=simplified&geometries=geojson")
            with urllib.request.urlopen(url, timeout=60) as r:
                route = json.load(r)
            if route.get("routes"):
                line = route["routes"][0]["geometry"]["coordinates"]
                geometry[f"{i}-{j}"] = [[lat, lon] for lon, lat in line]

        _write(dist, dur, geometry, approximate=False)
        print(f"geometry cached for {len(geometry)} node pairs")
    finally:
        subprocess.run(["docker", "rm", "-f", cid], capture_output=True)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--fallback", action="store_true",
                   help="skip OSRM, write the haversine approximation")
    args = p.parse_args()
    if args.fallback:
        build_fallback()
        return 0
    try:
        build_from_osrm()
    except Exception as exc:
        print(f"\nOSRM build failed: {exc}", file=sys.stderr)
        print("Re-run with --fallback for the approximate matrix.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 6: Build the matrix**

Start Docker Desktop first (the daemon was not running when this plan was written), then:
```bash
./venv/bin/python scripts/build_matrix.py
```
Expected: `data/road/{matrix.npz,nodes.json,geometry.json,META.json}` written, `META.json` showing `"approximate": false`, and geometry cached for 56 node pairs (8×7).

Timebox this to **90 minutes**. If it is still fighting you, run `./venv/bin/python scripts/build_matrix.py --fallback` and move on — Plan 2 is not blocked either way, and the approximation is labelled honestly.

- [ ] **Step 7: Sanity-check the distances against reality**

```bash
./venv/bin/python -c "
from backend.src.engine.matrix.road_matrix import RoadMatrix
import json, pathlib
m = RoadMatrix.load('data/road')
meta = json.loads(pathlib.Path('data/road/META.json').read_text())
print('approximate:', meta['approximate'])
names = [n['id'] for n in m.nodes]
a, s = names.index('Ahmedabad'), names.index('Surat')
print(f'Ahmedabad->Surat: {m.dist(a,s):.1f} km, {m.dur(a,s):.0f} min')
assert 240 < m.dist(a,s) < 300, 'road distance should be ~265km'
print('polyline points:', len(m.geometry(a,s)))
print('midpoint:', m.position_along(a, s, 0.5))
print('SANITY OK')
"
```
Expected: Ahmedabad→Surat around 265 km, and `SANITY OK`. A wildly different figure means the node coordinates or the OSRM profile are wrong — fix before Plan 2 builds on it.

- [ ] **Step 8: Commit**

```bash
git add scripts/build_matrix.py backend/src/engine/matrix/road_matrix.py backend/tests/engine/test_road_matrix.py data/road
git commit -m "feat: cached road matrix with route geometry

Built once offline via OSRM so the demo needs no routing service and no
network. position_along() walks the cached polyline, replacing the straight-
line interpolation the old simulator used."
```

---

## Definition of Done

- [ ] `./venv/bin/pytest backend/tests` — all green
- [ ] `./venv/bin/python -m backend.src.engine.benchmarks.cli` — every instance `OK = yes`
- [ ] `http://localhost:5173/benchmark` runs all six instances and shows `PASS` on each
- [ ] `/health` stays responsive during a 15s benchmark solve
- [ ] `data/road/META.json` exists, with `approximate` recorded either way
- [ ] No file under `backend/src/engine/` imports FastAPI (enforced by test)
- [ ] Record the C101 result — it is the number quoted in the demo

## What Plan 2 picks up

Plan 2 (The Exchange) consumes `solve()`, `SolveRequest`, `Solution` and `RoadMatrix` exactly as defined here, and adds: the PDPTW adapter for origin→destination shipments, the scenario generator, bundle generation, warm-started marginal-cost bid generation, CP-SAT winner determination, and exact Shapley settlement. Nothing in Plan 2 changes any interface this plan produces.
