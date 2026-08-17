from fastapi import APIRouter
from typing import List
from .. import simulator
from ..models import FleetStats, VehiclePosition, ShipmentItem

router = APIRouter(prefix="/api", tags=["fleet"])


@router.get("/stats", response_model=FleetStats)
async def get_stats():
    s = simulator.stats
    return FleetStats(
        vehicles_en_route=s["vehicles_en_route"],
        empty_running_pct=s["empty_running_pct"],
        total_surplus_inr=round(s["total_surplus_inr"]),
        your_shapley_share_inr=round(s["your_shapley_share_inr"]),
        active_round=s["active_round"],
        shipments_processed=s["shipments_processed"],
        carriers_connected=s["carriers_connected"],
        simulated=s.get("simulated", False),
    )


@router.get("/fleet", response_model=List[VehiclePosition])
async def get_fleet():
    return [
        VehiclePosition(
            id=v["id"],
            carrier_id=v["carrier_id"],
            lat=round(v["lat"], 5),
            lon=round(v["lon"], 5),
            status=v["status"],
            route_from=v["route_from"],
            route_to=v["route_to"],
            progress=round(v["progress"], 3),
        )
        for v in simulator.vehicles
    ]


@router.get("/shipments", response_model=List[ShipmentItem])
async def get_shipments():
    return simulator.shipments
