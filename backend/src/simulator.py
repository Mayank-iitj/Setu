"""
Setu Fleet Simulation Engine
Generates realistic in-memory state for the Gujarat-NCR logistics corridor.
Updates vehicle positions every 2 seconds and runs exchange rounds every 30 seconds.
Broadcasts live events to all connected WebSocket clients.
"""
import asyncio
import json
import random
import time
import math
from pathlib import Path
from typing import List, Set, Dict, Any, Optional
from fastapi import WebSocket

from .models import VehiclePosition, FleetStats, ExchangeRound, ExchangeBundle, LiveEvent, ShipmentItem

# ── Real settlement data (Plan 1) ───────────────────────────────────────────
# The dashboard's headline surplus/Shapley figures used to be a random walk.
# When the precomputed ablation payload is available, load it once and use
# its real settlement numbers instead — otherwise fall back to the old
# synthetic constants and flag the stats as simulated.

_ABLATION_PATH = Path(__file__).resolve().parents[2] / "data" / "demo" / "ablation.json"


def _load_ablation() -> Optional[dict]:
    """Loads data/demo/ablation.json once. Returns None if absent — never crashes."""
    if not _ABLATION_PATH.exists():
        return None
    try:
        with _ABLATION_PATH.open() as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return None

# ── Constants ────────────────────────────────────────────────────────────────

HUBS = {
    "Ahmedabad": (23.0225, 72.5714),
    "Surat":     (21.1702, 72.8311),
    "Vadodara":  (22.3072, 73.1812),
    "Rajkot":    (22.3039, 70.8022),
    "Delhi NCR": (28.6139, 77.2090),
    "Jaipur":    (26.9124, 75.7873),
    "Jodhpur":   (26.2389, 73.0243),
    "Udaipur":   (24.5854, 73.7125),
}

HUB_NAMES = list(HUBS.keys())

CARRIERS = [
    {"id": "carrier_0", "name": "Gujarat Express"},
    {"id": "carrier_1", "name": "Rajputana Freight"},
    {"id": "carrier_2", "name": "NCR Logistics"},
    {"id": "carrier_3", "name": "SwiftMove India"},
]

SHIPMENT_IDS = [f"SHP-{1000+i}" for i in range(80)]

# ── State ─────────────────────────────────────────────────────────────────────

vehicles: List[Dict] = []
current_round: Dict = {}
stats: Dict = {}
recent_events: List[LiveEvent] = []
shipments: List[ShipmentItem] = []
active_connections: Set[WebSocket] = set()

# ── Helpers ───────────────────────────────────────────────────────────────────

def _lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t

def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def _init_vehicles():
    vehicles.clear()
    for i in range(200):
        src = random.choice(HUB_NAMES)
        dst = random.choice([h for h in HUB_NAMES if h != src])
        carrier = random.choice(CARRIERS)
        status = random.choice(["en_route", "en_route", "en_route", "empty"])
        vehicles.append({
            "id": f"VH-{100+i}",
            "carrier_id": carrier["id"],
            "lat": HUBS[src][0],
            "lon": HUBS[src][1],
            "route_from": src,
            "route_to": dst,
            "status": status,
            "progress": random.uniform(0.0, 0.9),
            "speed": random.uniform(0.004, 0.009),  # progress units per tick
        })

def _init_shipments():
    shipments.clear()
    statuses = ["in_transit", "in_transit", "loading", "delivered"]
    for i, sid in enumerate(SHIPMENT_IDS[:30]):
        src = random.choice(HUB_NAMES)
        dst = random.choice([h for h in HUB_NAMES if h != src])
        shipments.append(ShipmentItem(
            id=sid,
            origin=src,
            destination=dst,
            weight_kg=round(random.uniform(200, 2000), 1),
            status=random.choice(statuses),
        ))

def _init_round(round_id: int):
    bundles = []
    for j in range(random.randint(3, 6)):
        bids = [random.choice(SHIPMENT_IDS) for _ in range(2)]
        bundles.append(ExchangeBundle(
            bundle_id=f"BND-{round_id}-{j}",
            requests=bids,
            min_price=round(random.uniform(15000, 80000), 2),
            awarded_to=None,
        ))
    current_round.update({
        "round_id": round_id,
        "status": "open",
        "bundles": bundles,
        "seconds_remaining": 30,
        "opened_at": time.time(),
    })

def _init_stats():
    stats.update({
        "vehicles_en_route": 0,
        "empty_running_pct": 0.0,
        "total_surplus_inr": 420000.0,
        "your_shapley_share_inr": 85000.0,
        "active_round": 4092,
        "shipments_processed": 1847,
        "carriers_connected": len(CARRIERS),
    })

    payload = _load_ablation()
    if payload is not None:
        stats["total_surplus_inr"] = float(payload["routing_saving"])
        carrier_0 = next(
            (c for c in payload["carriers"] if c["carrier_id"] == "carrier_0"), None
        )
        if carrier_0 is not None:
            stats["your_shapley_share_inr"] = float(carrier_0["shapley_share"])
        stats["simulated"] = False
    else:
        stats["simulated"] = True

def _recompute_stats():
    en_route = sum(1 for v in vehicles if v["status"] == "en_route")
    empty = sum(1 for v in vehicles if v["status"] == "empty")
    total = len(vehicles)
    stats["vehicles_en_route"] = en_route
    stats["empty_running_pct"] = round((empty / total * 100) if total > 0 else 0, 1)

def _add_event(type_: str, message: str, color: str):
    evt = LiveEvent(type=type_, message=message, color=color, timestamp=time.time())
    recent_events.insert(0, evt)
    if len(recent_events) > 50:
        recent_events.pop()
    return evt

# ── Disruption API Handlers ───────────────────────────────────────────────────

def break_vehicle(vehicle_id: str):
    veh = next((v for v in vehicles if v["id"] == vehicle_id), None)
    if not veh:
        # Fallback: break a random one if ID not found
        veh = random.choice(vehicles)
    veh["status"] = "breakdown"
    veh["speed"] = 0.0 # stopped
    _add_event("disruption", f"CRITICAL: Vehicle {veh['id']} broken down on {veh['route_from']}→{veh['route_to']}. Re-routing network...", "red")
    
    # Reroute nearby vehicles
    for v in vehicles:
        if v["id"] != veh["id"] and v["status"] == "empty" and v["route_to"] == veh["route_to"]:
            v["status"] = "en_route"
            v["speed"] *= 1.5 # hurry
            _add_event("system", f"Dispatching {v['id']} to recover load from {veh['id']}.", "yellow")
            break

def close_corridor(hub_a: str, hub_b: str):
    _add_event("disruption", f"ALERT: Corridor {hub_a} ↔ {hub_b} closed due to accident. Re-planning active routes...", "red")
    affected = 0
    for v in vehicles:
        if (v["route_from"] == hub_a and v["route_to"] == hub_b) or (v["route_from"] == hub_b and v["route_to"] == hub_a):
            # Divert to a different hub
            new_dst = random.choice([h for h in HUB_NAMES if h not in (hub_a, hub_b)])
            v["route_to"] = new_dst
            v["progress"] = 0.0
            v["route_from"] = "DIVERSION"
            affected += 1
    if affected > 0:
         _add_event("system", f"Diverted {affected} vehicles away from closed corridor.", "yellow")

def inject_order(origin: str, dest: str, weight: float, material: str):
    _add_event("system", f"URGENT INJECTION: {weight}T of {material} {origin}→{dest}. Forcing auction...", "accent")
    # Add to current round immediately
    bundle = ExchangeBundle(
        bundle_id=f"BND-URGENT-{random.randint(1000, 9999)}",
        requests=["SHP-URGENT"],
        min_price=round(random.uniform(30000, 90000), 2),
        awarded_to=None,
    )
    current_round["bundles"].insert(0, bundle)
    current_round["seconds_remaining"] = min(current_round["seconds_remaining"], 5)

# ── Startup initializer ───────────────────────────────────────────────────────

def initialize():
    _init_vehicles()
    _init_shipments()
    _init_stats()
    _init_round(4092)
    _add_event("system", "Setu network online — monitoring 40 vehicles.", "accent")

# ── WebSocket broadcasting ────────────────────────────────────────────────────

async def broadcast(payload: dict):
    dead = set()
    for ws in active_connections:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.add(ws)
    active_connections.difference_update(dead)

# ── Main simulation loop ──────────────────────────────────────────────────────

async def simulation_loop():
    tick = 0
    while True:
        await asyncio.sleep(2)
        tick += 1

        # Move vehicles
        events_this_tick = []
        for v in vehicles:
            v["progress"] += v["speed"]
            if v["progress"] >= 1.0:
                # Vehicle arrived — reassign
                old_dst = v["route_to"]
                new_src = old_dst
                new_dst = random.choice([h for h in HUB_NAMES if h != new_src])
                v["route_from"] = new_src
                v["route_to"] = new_dst
                v["progress"] = 0.0
                v["status"] = random.choice(["en_route", "en_route", "empty"])
                v["speed"] = random.uniform(0.004, 0.009)

                msg = f"Vehicle {v['id']} arrived at {old_dst}"
                events_this_tick.append(("arrival", msg, "green"))

                stats["shipments_processed"] += random.randint(0, 2)
            else:
                # Interpolate position
                src_pos = HUBS[v["route_from"]]
                dst_pos = HUBS[v["route_to"]]
                v["lat"] = _lerp(src_pos[0], dst_pos[0], v["progress"])
                v["lon"] = _lerp(src_pos[1], dst_pos[1], v["progress"])

        # Random disruption event (occasional)
        if tick % 15 == 0:
            veh = random.choice(vehicles)
            delay = random.randint(20, 90)
            msg = f"Disruption: {veh['id']} on {veh['route_from']}→{veh['route_to']} ETA +{delay}m"
            events_this_tick.append(("disruption", msg, "yellow"))

        # Recompute stats
        _recompute_stats()

        # Exchange round timer
        elapsed = time.time() - current_round.get("opened_at", time.time())
        remaining = max(0, 30 - int(elapsed))
        current_round["seconds_remaining"] = remaining

        if remaining == 0:
            # Clear round
            current_round["status"] = "clearing"
            for bundle in current_round["bundles"]:
                winner = random.choice(CARRIERS)
                bundle.awarded_to = winner["id"]
                msg = f"{winner['name']} awarded {bundle.bundle_id} (₹{bundle.min_price:,.0f})"
                events_this_tick.append(("award", msg, "accent"))

            stats["active_round"] += 1
            _init_round(stats["active_round"])

        # Build broadcast payload
        for (type_, msg, color) in events_this_tick:
            _add_event(type_, msg, color)

        broadcast_payload = {
            "type": "tick",
            "stats": {
                "vehicles_en_route": stats["vehicles_en_route"],
                "empty_running_pct": stats["empty_running_pct"],
                "total_surplus_inr": round(stats["total_surplus_inr"]),
                "your_shapley_share_inr": round(stats["your_shapley_share_inr"]),
                "active_round": stats["active_round"],
                "shipments_processed": stats["shipments_processed"],
                "carriers_connected": stats["carriers_connected"],
                "simulated": stats.get("simulated", False),
            },
            "round": {
                "round_id": current_round["round_id"],
                "status": current_round["status"],
                "seconds_remaining": current_round["seconds_remaining"],
                "bundles": [b.model_dump() for b in current_round["bundles"]],
            },
            "events": [e.model_dump() for e in recent_events[:10]],
            "vehicles": [
                {
                    "id": v["id"],
                    "carrier_id": v["carrier_id"],
                    "lat": round(v["lat"], 5),
                    "lon": round(v["lon"], 5),
                    "status": v["status"],
                    "route_from": v["route_from"],
                    "route_to": v["route_to"],
                    "progress": round(v["progress"], 3),
                }
                for v in vehicles
            ],
        }

        await broadcast(broadcast_payload)
