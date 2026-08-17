# SAMANVAY — Real Engine Design

**Date:** 2026-08-17
**Status:** Approved for planning
**Scope:** Replace the synthetic simulator behind Setu's existing API with a genuinely computed
optimisation and auction engine, then ship it as a one-command local deployment.
**Timeline:** 2–4 weeks · **Team:** one developer + Claude · **Target:** SIH 2026, Transportation & Logistics

---

## 1. Why this work exists

The problem statement asks for real-time fleet monitoring, route optimisation, load allocation and
shipment tracking. The project's thesis — argued in `SIH-ZION/` — is that the money in Indian
freight is not lost to badly ordered stops but to **empty running**, and that the load which would
fill a truck's return leg belongs to a competitor. SAMANVAY is therefore a neutral clearing house
where carriers exchange shipment requests through a sealed-bid combinatorial auction, with a
surplus split that leaves every participant provably no worse off than operating alone.

The repository today presents that thesis convincingly and computes none of it.

### 1.1 Audit of the current state

Verified by reading every file and tracing every import on 2026-08-17.

**Real and working:**

- `frontend/src/pages/Dashboard.jsx` (1,259 lines) — DeckGL `ScatterplotLayer` + `ArcLayer` over
  MapLibre, Recharts panels, live event feed, round timer.
- `frontend/src/hooks/useWebSocket.js` + `lib/api.js` — auto-reconnecting WebSocket client, REST layer.
- `backend/src/main.py` — FastAPI app, CORS, lifespan-managed background loop, `/ws/events`.
- Routers for `/api/stats`, `/api/fleet`, `/api/shipments`, `/api/exchange/round`, `/api/exchange/bid`.
- Clerk auth, role routing, landing/about/services/contact/docs pages.

**Not real.** `backend/src/simulator.py` is the entire backend. Everything below is either random or
dead code — `solver/`, `packing/`, `benchmarks/`, `exchange/pool.py` and all of `infra/` are
**imported by nothing**, and `ortools` is absent from `requirements.txt`.

| Claim | Code reality |
|---|---|
| CVRPTW solver | `solver/cvrptw.py` — OR-Tools tutorial, hardcoded 17-node matrix, never called |
| Winner determination | `winner = random.choice(CARRIERS)` — `simulator.py:213` |
| Shapley surplus split | Does not exist. `your_shapley_share_inr += random.uniform(100, 600)` |
| Total surplus ₹ | Seeded at 420,000, random walk at `simulator.py:184` |
| Bid generation | `min_price = random.uniform(15000, 80000)`; submitted bids are logged, never used |
| 3D LIFO packing | `can_pack()` returns `True` if weight fits. No geometry. Never called |
| Solomon benchmark | Parser returns one hardcoded depot node. No UI page exists |
| Road routing | `_lerp()` between 8 hub coordinates — straight lines, no road network |
| Postgres/Timescale/Redis/Kafka/OSRM | 9 services in `docker-compose.yml`, none connected |

Two further defects: `Makefile` uses Windows paths (`./venv/Scripts/`, `start`) and so does not run
on macOS or Linux, and it invokes `scripts/seed.py` and `scripts/simulate.py` — a directory that
does not exist.

### 1.2 The failure mode this design prevents

The project's own strategy document names two artefacts as decisive: the **benchmark page**
(answering *"how do I know your routes are good and not just plausible lines on a map?"*) and the
**per-carrier profit chart** (answering *"why would competitors ever cooperate?"*). Neither exists,
and the numbers that would feed the second are `random.uniform()`.

A judge who reads the pitch will ask how the Shapley value was computed. That question must have a
real answer. **The purpose of this work is to make the demo's claims true.**

---

## 2. Goals and non-goals

### Goals

1. Every number rendered in the UI traces to a computation that can be shown on demand.
2. A benchmark page runs public Solomon instances live and reports gap-to-best-known.
3. Collaboration ON/OFF is a genuine ablation, with per-carrier profit computed both ways.
4. Shapley settlement is **exact**, and individual rationality is asserted by tests, not claimed.
5. `git clone && docker compose up` produces the full demo in under 60 seconds with no internet.
6. The demo survives a judge taking the mouse and breaking a vehicle.

### Non-goals

- Multi-tenant production auth, billing, e-way bill, invoicing, chatbot, blockchain.
- Native mobile app. Real IoT hardware. Kubernetes.
- A public cloud URL (explicitly out of scope — local compose only).
- Beating state-of-the-art on Solomon. We report our gap honestly; we do not need it to be small.

---

## 3. Architecture

### 3.1 The one structural decision

`simulator.py` remains the orchestrator and the WebSocket payload shape does not change. What
changes is that its numbers come from `engine/` instead of `random`. The frontend contract is
frozen, so the UI keeps working at every commit and progressively starts telling the truth.

```
┌─────────────────────────────────────────────────────────────┐
│  frontend (React + DeckGL + MapLibre + Recharts)            │
│  — contract frozen: /ws/events payload, /api/* shapes       │
└───────────────▲─────────────────────────────────────────────┘
                │ WebSocket + REST  (unchanged)
┌───────────────┴─────────────────────────────────────────────┐
│  backend/src/  — FastAPI, async, I/O only                   │
│    main.py · routers/ · orchestrator.py (was simulator.py)  │
└───────────────▲─────────────────────────────────────────────┘
                │ ProcessPoolExecutor  (CPU-bound work never
                │ blocks the event loop — see §3.3)
┌───────────────┴─────────────────────────────────────────────┐
│  engine/  — pure Python. No FastAPI import. Fully testable  │
│                                                             │
│   matrix/     cached road distance+duration matrix          │
│   routing/    RoutingSolver  ──┬── solomon adapter (CVRPTW) │
│                                └── samanvay adapter (PDPTW) │
│   exchange/   bundles → bids → winner determination → Shapley│
│   packing/    extreme-point 3D packing with LIFO            │
│   eta/        chance-constrained arrival intervals          │
│   ablation/   collaboration ON vs OFF                       │
│   scenario/   deterministic seeded scenario generation      │
└─────────────────────────────────────────────────────────────┘
```

`engine/` importing nothing from FastAPI is a hard rule. It is what makes the mathematics testable
without a server, and it is what lets the benchmark run from a CLI in CI.

### 3.2 Why the road matrix is precomputed

Self-hosted OSRM needs a multi-GB OSM extract and several GB of RAM. Running it live during judging
is the single largest thing that can break the demo on the day.

Instead: run OSRM **once**, offline, against a real OSM extract; export the full node-to-node
distance and duration matrix; commit it as a compressed artefact. The distances are genuine road
distances on the real network. Compose then needs no OSRM service at all.

This is stated openly in the demo — *"real OSM road network, matrix precomputed for offline
determinism"* — and it is strictly more defensible than live routing that might fail.

### 3.3 Concurrency

OR-Tools solves are CPU-bound and will block asyncio. Every solve goes through a
`ProcessPoolExecutor` from day one, not as a later optimisation. The orchestrator awaits futures;
the event loop keeps broadcasting telemetry at 2 Hz throughout a solve. This is why the "click
Optimize, watch the timer, map updates live" moment works at all.

---

## 4. Module specifications

Each module states its purpose, its interface, what it depends on, and how we know it works.

### M1 · `engine/matrix` — cached road network

**Purpose.** Real road distances and durations between every node in the scenario.

**Build (one-time, offline).** `scripts/build_matrix.py`:
1. Download Geofabrik extracts for Gujarat, Rajasthan and NCT Delhi.
2. `osrm-extract` + `osrm-partition` + `osrm-customize` in a throwaway Docker container.
3. Query `/table` in chunks (OSRM caps table size; chunk at 100×100 and stitch).
4. Query `/route` for every node pair that the scenario actually uses, and store the returned
   polyline. **The matrix alone cannot animate a truck along a road** — it gives scalars, not
   geometry — and vehicles moving on real road shapes rather than straight lines is a visible part
   of the demo. Geometry is only needed for realised legs, so this stays small.
5. Write `data/matrix.npz` — `dist_km[i][j]`, `dur_min[i][j]` — plus `data/nodes.json` (ids,
   coords) and `data/geometry.json` (node-pair → encoded polyline).

**Runtime interface.**
```python
class RoadMatrix:
    def dist(self, i: int, j: int) -> float: ...        # km
    def dur(self, i: int, j: int) -> float: ...         # minutes
    def geometry(self, i: int, j: int) -> list[tuple[float, float]]: ...   # lat/lon polyline
    def position_along(self, i: int, j: int, progress: float) -> tuple[float, float]: ...
    @classmethod
    def load(cls, path: str) -> "RoadMatrix": ...
```

`position_along` is what M7 calls every 2 seconds to place a vehicle, replacing `_lerp()`.

**Depends on:** nothing at runtime. Build depends on Docker + internet, once.

**Acceptance.** Matrix is symmetric-ish (road asymmetry allowed), triangle inequality holds within
5% tolerance, no infinities, Ahmedabad→Delhi road distance lands within 10% of the ~950 km
real-world figure.

**Fallback if the extract build proves painful:** haversine × 1.3 circuity factor, **clearly
labelled in the UI as an approximation**. This is a genuine degradation and must not be presented
as road routing.

---

### M2 · `engine/routing` — the solver ★ core

**Purpose.** Everything else depends on this. One solver core, two problem adapters.

**Core interface.**
```python
@dataclass
class SolveRequest:
    vehicles: list[Vehicle]          # capacity_kg, volume_m3, start_node, shift_window
    stops: list[Stop]                # node, demand, time_window, service_time
    pickups_deliveries: list[tuple[int, int]] | None   # PDPTW mode when present
    time_budget_ms: int
    warm_start: Solution | None

@dataclass
class Solution:
    routes: list[Route]              # vehicle_id, ordered node sequence, arrival times
    total_cost: float                # ₹, see cost model below
    total_distance_km: float
    vehicles_used: int
    feasible: bool
    solve_time_ms: int
```

**Adapters.**
- **Solomon (CVRPTW)** — depot-out delivery, single depot, capacity + time windows. Used only by
  the benchmark. Enables direct comparison against published best-known solutions.
- **SAMANVAY (PDPTW)** — shipments have an origin *and* a destination, which is what a freight
  exchange actually trades. OR-Tools `AddPickupAndDelivery` plus a capacity dimension that rises at
  pickup and falls at delivery, with the pickup constrained to precede the delivery on the same
  vehicle.

**Cost model.** `cost = distance_km × ₹/km + vehicles_used × fixed_₹ + Σ lateness_penalty`.
Fixed vehicle cost is what makes "fewer trucks" a real objective rather than a side effect.

**Search.** `PATH_CHEAPEST_ARC` first solution → `GUIDED_LOCAL_SEARCH` metaheuristic → return
best-so-far at the time budget. Anytime by construction. Warm start via
`ReadAssignmentFromRoutes` when a previous solution is supplied — this is what makes bid generation
affordable (§M4).

**Acceptance.** Property tests: every returned route respects capacity at every prefix; every
arrival falls inside its time window (or is penalised and flagged infeasible); pickup precedes
delivery on the same vehicle; a warm-started solve is never worse than its seed.

---

### M3 · `engine/benchmarks` — proof the solver is real ★ core

**Purpose.** The answer to *"how do I know your routes are actually good?"* Highest leverage
artefact in the project, and cheap once M2 exists.

**Contents.** Real Solomon parser (C1/R1/RC1 families, 25/50/100 customers), a table of published
best-known solutions committed alongside, and a runner.

```python
def run_instance(name: str, time_budget_ms: int) -> BenchmarkResult:
    # vehicles_used, total_distance, gap_pct, solve_time_ms, bks_vehicles, bks_distance
```

`gap_pct = (ours − best_known) / best_known × 100`, reported to one decimal.

**Acceptance.** Runs from CLI (`python -m engine.benchmarks.run C101`) and from the UI. Gap on
C1 instances under 10% at a 5-second budget — a sanity floor, not a target. Results are
reproducible on a judge's laptop, which is the entire point.

**Never cut.**

---

### M4 · `engine/exchange` — the auction ★ core

Four stages, each independently testable.

**4a · Bundle generation.** Pool requests grouped into bundles of 2–4 by spatio-temporal proximity
(DBSCAN over origin/destination midpoint and time-window centre). Capped at 40 bundles per round.
Single-request bundles are always included as a fallback so the auction degrades gracefully.

**4b · Bid generation.** For each carrier × bundle:
`bid = cost(plan ∪ bundle) − cost(plan)` — the true marginal insertion cost. Warm-started from the
carrier's existing plan with a 200 ms budget; never re-solved from scratch. Bids run in parallel
across the process pool. This is the round's bottleneck and the reason for the 40-bundle cap.

**4c · Winner determination.** A set-packing problem over bundles, solved with CP-SAT:

- Variables: `x[c][b] ∈ {0,1}` — carrier `c` wins bundle `b`
- Each bundle awarded at most once: `Σ_c x[c][b] ≤ 1`
- Each request appears in at most one awarded bundle: `Σ_{b ∋ r} Σ_c x[c][b] ≤ 1`
- Objective: minimise `Σ x[c][b] × bid[c][b]` over awarded bundles, plus the cost of unallocated
  requests staying with their originating carrier

NP-hard in general; milliseconds at this size. Say so plainly.

**4d · Shapley settlement.** The characteristic function `v(S)` is the cost saving of coalition `S`
versus its members operating alone. Computing it requires solving the collaborative problem for
each subset — `2^n − 1` non-empty coalitions, so **7 solves for 3 carriers, 15 for 4**. Each is
warm-started and budgeted at 200 ms, so a full exact settlement completes in well under 2 seconds.

```
φ_i = Σ_{S ⊆ N\{i}}  |S|!·(n−|S|−1)!/n!  ·  [ v(S ∪ {i}) − v(S) ]
```

**Exact, not Monte Carlo.** The chat advice suggested sampling ~1000 permutations; at `n = 3` there
are only 6 permutations and 8 coalitions, so sampling would approximate something we can compute
outright. Exact is both cheaper and a stronger claim.

**Acceptance.** Unit tests assert the Shapley axioms on hand-computed fixtures — efficiency
(`Σφ_i = v(N)`), symmetry, null player, additivity — plus **individual rationality (`φ_i ≥ 0` for
every carrier)** on every generated scenario. If individual rationality ever fails, the round is
flagged in the UI rather than hidden. Also asserted: no request is awarded twice.

**Never cut** 4c and 4d. If time collapses, 4a degrades to single-request auctions (smaller gain,
same story, still novel).

---

### M5 · `engine/ablation` — the chart that sells it ★ core

**Purpose.** *"Why would competing carriers cooperate?"* answered with a chart rather than a
sentence.

Runs the same scenario twice — collaboration OFF (each carrier solves alone) and ON (exchange runs,
costs reallocated, surplus split by Shapley) — and emits per-carrier profit, empty-running km,
vehicles used and total distance for both. All three bars must go up individually, and the test
suite asserts it.

**Never cut.**

---

### M6 · `engine/scenario` — deterministic scenario generation

Seeded generation of carriers, vehicles and shipments over the real corridor nodes from M1. Fixed
seed ⇒ byte-identical scenario, which is what makes the demo rehearsable and the benchmark
reproducible. Replaces the ad-hoc `random` calls in `simulator.py`.

Synthetic demand is labelled as such in the UI: *"synthetic, grounded in published corridor
volumes."* Judges accept synthetic data when you say why.

---

### M7 · `orchestrator.py` — live rounds and disruption

Rewrite of `simulator.py`. Keeps the 2-second telemetry tick and the 30-second round cadence, but:

- Vehicle positions interpolate **along road geometry** from M1, not straight lines.
- `total_surplus_inr` is the summed realised surplus of cleared rounds.
- `your_shapley_share_inr` is `φ` for the viewing carrier.
- Round clearing calls M4 for real; `awarded_to` is the CP-SAT winner.
- **Disruption injection** — `POST /api/disrupt/{vehicle_id}` breaks a vehicle. Affected requests
  are released, the neighbourhood is re-optimised (warm-started, bounded to the affected cluster),
  ETAs update, events broadcast. This is the judge-takes-the-mouse moment.

**Persistence.** M7 owns the only writes to Postgres, through a thin `store.py`: cleared rounds
(bundles, bids, awards, Shapley settlements) and benchmark results. Live telemetry is never
persisted — it is ephemeral by design, which is why Timescale is dropped. Persistence exists so a
judge can ask "show me the last ten rounds" and so benchmark history survives a restart; the demo
itself must run correctly even if the database is empty.

---

### M8 · Credibility layers (cheap, high value)

- **Time-dependent city entry bans.** Most Indian metros bar heavy vehicles during daytime hours.
  Modelled as time-window restrictions on entry to banned-city nodes. One constraint, large realism
  credit from ministry judges.
- **Chance-constrained ETAs.** Travel time as a lognormal fitted to corridor variance; plan and
  display the 90th percentile as an interval (*"14:20–14:55, 90% confidence"*) rather than a false
  point estimate. This is the honest reading of the problem statement's note about accuracy.

---

### M9 · `engine/packing` — 3D LIFO load allocation

Extreme-point heuristic. Boxes placed at extreme points; the LIFO constraint requires that a box
for drop *k* is never blocked by a box for a later drop. Infeasibility feeds back as a routing
constraint. Satisfies the problem statement's "load allocation" requirement concretely.

**First thing on the cut ladder.** Everything above it matters more.

---

## 5. Contracts

### 5.1 Frozen — must not change

`backend/src/models.py` shapes are consumed by the frontend and stay exactly as they are:
`VehiclePosition`, `FleetStats`, `ShipmentItem`, `ExchangeBundle`, `ExchangeRound`, `LiveEvent`,
`BidRequest`, `BidResponse`. The `/ws/events` payload keeps its `type` / `stats` / `round` /
`events` / `vehicles` structure.

A contract test asserts the WebSocket payload validates against these models on every commit. If
the engine needs a field the contract lacks, the field is **added**, never repurposed.

### 5.2 New endpoints

| Endpoint | Purpose |
|---|---|
| `POST /api/optimize` | Trigger a solve. Returns before/after metrics and solve time |
| `POST /api/disrupt/{vehicle_id}` | Break a vehicle, trigger delta re-optimisation |
| `GET /api/benchmark/instances` | List available Solomon instances |
| `POST /api/benchmark/run` | Run an instance, return gap/vehicles/distance/runtime |
| `GET /api/ablation` | Collaboration ON vs OFF, per-carrier |
| `GET /api/exchange/round/{id}/settlement` | Bids, awards, and the Shapley breakdown |
| `GET /api/vehicle/{id}/load` | 3D packing plan and drop sequence (M9) |

`contracts.py` is currently an unused parallel model set. It gets deleted; `models.py` is the single
source of truth.

### 5.3 Provenance rule

Every numeric field returned by the API carries a documented derivation in `docs/PROVENANCE.md` —
which module computed it, from what inputs. Anything simulated rather than computed is labelled in
the UI. **No displayed number may come from `random` without a visible "simulated" tag.** This is
the rule that makes the project defensible under questioning, and it is not optional.

---

## 6. Infrastructure

**Compose, reduced.** Drop `kafka`, `zookeeper`, `keycloak`, `minio`, `metabase`, `osrm` — six
services, all unused, each a startup delay and a failure mode. Keep:

```
postgres (+PostGIS)   round history, settlements, benchmark results
api                   FastAPI + engine
web                   Vite build served static
```

Redis is dropped: with a `ProcessPoolExecutor` in-process there is no cross-service state to broker.
Timescale is dropped: telemetry is ephemeral and lives in memory.

**Other fixes:** `Makefile` rewritten for POSIX (it is currently Windows-only and cannot run on this
machine); create the missing `scripts/`; add `ortools`, `numpy`, `scipy` to `requirements.txt`;
`.env.example` reviewed against what the code actually reads.

**Definition of deployed:** on a clean clone with no prior state,
`docker compose up` serves the full demo in under 60 seconds with networking disabled. This is
verified as an explicit task, not assumed.

---

## 7. Testing

`pytest`, with `engine/` testable with no server running.

- **Property tests** — capacity respected at every route prefix; time windows respected; pickup
  precedes delivery; warm start never worsens a solution.
- **Axiom tests** — Shapley efficiency, symmetry, null player, additivity on hand-computed
  fixtures; individual rationality on every generated scenario.
- **Invariant tests** — no request awarded twice; awarded bundles are disjoint.
- **Determinism tests** — fixed seed produces identical scenario and identical solution.
- **Contract tests** — WebSocket payload validates against `models.py`.
- **Benchmark regression** — C101 gap does not regress beyond a committed threshold.

Written test-first for the mathematics, where "looks plausible on a map" is precisely the trap.

---

## 8. Plan

Weeks 1–3 are the project; week 4 is buffer and polish.

**Week 1 — foundation and solver**
1. Repo cleanup: strip compose, fix Makefile, add deps, create `engine/` skeleton and test scaffold
2. `scripts/build_matrix.py`; produce and commit `data/matrix.npz`
3. `RoutingSolver` core + Solomon adapter (M2)
4. Benchmark runner + gap computation, verified from CLI (M3)
5. Benchmark page in the UI

**Week 2 — the exchange**
6. SAMANVAY PDPTW adapter + scenario generator (M6)
7. Private per-carrier plans; replace random stats with real ones on the WebSocket
8. Bundle generation (M4a)
9. Warm-started bid generation (M4b)
10. CP-SAT winner determination (M4c)
11. Exact Shapley + axiom and individual-rationality tests (M4d)

**Week 3 — proof and interaction**
12. Ablation engine + per-carrier profit chart (M5)
13. Real rounds wired into the orchestrator (M7)
14. Disruption injection + delta re-optimisation
15. City entry bans + chance-constrained ETAs (M8)
16. `PROVENANCE.md`; audit every displayed number against it

**Week 4 — buffer**
17. 3D LIFO packing + load view (M9)
18. Clean-clone deployment verification, offline
19. Demo rehearsal against the script in `SIH-ZION/09-DEMO-SCRIPT.md`

Each numbered item ends with something runnable. The demo never enters a broken state.

---

## 9. Risks

| Risk | Response |
|---|---|
| OSM extract build slow or fails | Smaller state extracts; then bbox extract; last resort haversine × 1.3 **labelled as approximate** |
| PDPTW returns infeasible | Soft time windows with lateness penalties; report infeasibility honestly rather than hiding it |
| Bid generation exceeds round budget | Cap bundles at 40 → 20; shorten per-bid budget; degrade to single-request auctions |
| OR-Tools blocks the event loop | `ProcessPoolExecutor` from day one, not retrofitted |
| Shapley violates individual rationality | Surface it in the UI as a flagged round. A visible honest failure beats a hidden one, and it is a genuinely interesting finding to discuss |
| Frontend contract drift | Contract tests on the WebSocket payload |
| Time runs out | Cut ladder below |

**Cut ladder**, in order: 3D packing → truck-specific OSRM profile → chance-constrained ETA →
city entry bans → delta re-optimisation → bundle auctions degrade to single-request.

**Never cut:** the solver, the benchmark page, exact Shapley, the ablation chart. These four are
the project; the rest is packaging that lets a judge see them work.

---

## 10. Demo mapping

Which module answers which question, keyed to the existing demo script.

| Moment | Backed by | Judge question answered |
|---|---|---|
| Open on a live map, 3 carriers | M6, M7 | — (never open on a login screen) |
| Click Optimize, timer, numbers move | M2, M7 | "Does it actually do anything?" |
| Judge breaks a truck, routes heal | M7 | "Is this a recording?" |
| Collaboration ON/OFF toggle | M5 | "Why would competitors cooperate?" |
| Shapley breakdown per carrier | M4d | "How is the surplus split fair?" |
| Benchmark page, live Solomon run | M3 | "Are your routes actually good?" |
| Load view, drop reachability | M9 | "Did you handle load allocation?" |
| ETA shown as an interval | M8 | "How do you handle uncertainty?" |
