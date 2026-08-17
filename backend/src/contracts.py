from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# H0-H2 Contracts Stub as requested in 08-BUILD-PLAN.md

class Location(BaseModel):
    lat: float
    lon: float

class ShipmentRequest(BaseModel):
    id: str
    origin: Location
    destination: Location
    weight_kg: float
    volume_m3: float
    ready_time: int
    due_time: int

class Plan(BaseModel):
    """
    A plan produced by a single carrier's Planning Service.
    """
    carrier_id: str
    routes: List[Dict[str, Any]] # simplified for stub
    cost: float

class Solution(BaseModel):
    """
    Complete solution across all clusters.
    """
    plan_id: str
    total_cost: float
    routes: List[Dict[str, Any]]

class Bid(BaseModel):
    """
    The exact shape of the bid payload that crosses the trust boundary.
    (See 04-ARCHITECTURE.md §3)
    """
    bundle_id: str
    price: float

class RoundResult(BaseModel):
    """
    The outcome of an Exchange auction round, including the Shapley settlement.
    """
    round_id: str
    awards: Dict[str, str] # bundle_id -> carrier_id
    settlements: Dict[str, float] # carrier_id -> surplus/deficit

