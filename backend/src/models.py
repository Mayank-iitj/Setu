from typing import List, Dict, Optional, Any
from pydantic import BaseModel

# ── Request models ──────────────────────────────────────────────────────────

class BidRequest(BaseModel):
    carrier_id: str
    bundle_id: str
    price: float

class ContactRequest(BaseModel):
    carrier_name: str
    fleet_size: str
    email: str

# ── Response models ─────────────────────────────────────────────────────────

class VehiclePosition(BaseModel):
    id: str
    carrier_id: str
    lat: float
    lon: float
    status: str          # "en_route" | "empty" | "loading"
    route_from: str
    route_to: str
    progress: float      # 0.0 – 1.0

class FleetStats(BaseModel):
    vehicles_en_route: int
    empty_running_pct: float
    total_surplus_inr: float
    your_shapley_share_inr: float
    active_round: int
    shipments_processed: int
    carriers_connected: int
    simulated: bool = False

class ShipmentItem(BaseModel):
    id: str
    origin: str
    destination: str
    weight_kg: float
    status: str

class ExchangeBundle(BaseModel):
    bundle_id: str
    requests: List[str]
    min_price: float
    awarded_to: Optional[str] = None

class ExchangeRound(BaseModel):
    round_id: int
    status: str          # "open" | "clearing" | "cleared"
    bundles: List[ExchangeBundle]
    seconds_remaining: int

class LiveEvent(BaseModel):
    type: str            # "award" | "arrival" | "disruption" | "bid"
    message: str
    color: str           # "accent" | "green" | "yellow" | "red"
    timestamp: float

class BidResponse(BaseModel):
    status: str
    message: str
    bundle_id: str

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
