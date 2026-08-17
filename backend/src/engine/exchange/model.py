"""Domain model for the collaborative freight exchange.

Carriers hold shipment requests. Each carrier is regionally strong — most of its
loads sit near its own depot — but a minority are far-flung, and those are where
exchange pays. Distances are straight-line corrected by a circuity factor; that
is an approximation and the UI labels it as one.
"""
from __future__ import annotations

import math
import random
from dataclasses import dataclass

# ── economics (illustrative, stated on screen as such) ───────────────────────
COST_PER_KM = 42.0            # INR per km, line-haul
FIXED_VEHICLE_COST = 3500.0   # INR to put one more truck on the road
HANDLING_COST_INR = 250.0     # INR per delivery stop: loading, paperwork, waiting
DROP_PENALTY_INR = 25000.0    # INR cost of failing to serve a request at all
AVG_KMH = 45.0
CIRCUITY = 1.3                # straight-line -> road distance correction
SERVICE_MINUTES = 20

HUBS: dict[str, tuple[float, float]] = {
    "Ahmedabad": (23.0225, 72.5714), "Surat": (21.1702, 72.8311),
    "Vadodara": (22.3072, 73.1812),  "Rajkot": (22.3039, 70.8022),
    "Bhavnagar": (21.7645, 72.1519), "Jamnagar": (22.4707, 70.0577),
    "Anand": (22.5645, 72.9289),     "Bharuch": (21.7051, 72.9959),
    "Mehsana": (23.5880, 72.3693),   "Junagadh": (21.5222, 70.4579),
}
HUB_NAMES = list(HUBS)


@dataclass(frozen=True)
class Request:
    id: str
    owner: str          # carrier currently holding it
    hub: str            # delivery hub
    demand: int
    ready: int          # minutes from shift start
    due: int


@dataclass(frozen=True)
class Carrier:
    id: str
    name: str
    depot: str
    n_vehicles: int
    capacity: int


def haversine_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    R = 6371.0
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp, dl = p2 - p1, math.radians(b[1] - a[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return R * 2 * math.asin(math.sqrt(h))


def road_km(hub_a: str, hub_b: str) -> float:
    """Straight-line distance corrected by a circuity factor.

    This is an APPROXIMATION of road distance, not a routed road distance. Any
    surface that displays it must say so.
    """
    return haversine_km(HUBS[hub_a], HUBS[hub_b]) * CIRCUITY


DEPOTS = ["Ahmedabad", "Rajkot", "Surat"]
CARRIER_NAMES = ["Gujarat Express", "Saurashtra Freight", "Tapi Logistics"]


def generate_scenario(
    seed: int = 42, n_carriers: int = 3, per_carrier: int = 14
) -> tuple[list[Carrier], list[Request]]:
    """Deterministic for a fixed seed — the demo must be rehearsable."""
    rng = random.Random(seed)
    carriers = [
        Carrier(f"carrier_{i}", CARRIER_NAMES[i], DEPOTS[i], 5, 120)
        for i in range(n_carriers)
    ]
    home = {
        c.id: sorted(
            [h for h in HUB_NAMES if h != c.depot],
            key=lambda h: haversine_km(HUBS[c.depot], HUBS[h]),
        )[:4]
        for c in carriers
    }
    requests: list[Request] = []
    for c in carriers:
        for k in range(per_carrier):
            out_of_region = k >= per_carrier - 3
            pool = [h for h in HUB_NAMES if h != c.depot] if out_of_region else home[c.id]
            hub = rng.choice(pool)
            ready = rng.choice([0, 0, 120, 240])
            requests.append(Request(
                id=f"{c.id}-R{k}", owner=c.id, hub=hub,
                demand=rng.randint(10, 45),
                ready=ready, due=ready + rng.randint(600, 900),
            ))
    return carriers, requests
