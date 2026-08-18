from fastapi import APIRouter, Body
from pydantic import BaseModel
from typing import Optional
from fastapi import Depends
from .. import simulator
from ..auth import verify_session

router = APIRouter(prefix="/api/disruption", tags=["disruption"], dependencies=[Depends(verify_session)])

class VehicleBreakdownReq(BaseModel):
    vehicle_id: Optional[str] = None

class CloseCorridorReq(BaseModel):
    hub_a: str
    hub_b: str

class InjectOrderReq(BaseModel):
    origin: str
    destination: str
    weight: float
    material: str

@router.post("/breakdown")
async def trigger_breakdown(req: VehicleBreakdownReq):
    simulator.break_vehicle(req.vehicle_id)
    return {"status": "ok", "message": "Breakdown triggered"}

@router.post("/close-corridor")
async def trigger_close_corridor(req: CloseCorridorReq):
    simulator.close_corridor(req.hub_a, req.hub_b)
    return {"status": "ok", "message": "Corridor closed"}

@router.post("/inject-order")
async def trigger_inject_order(req: InjectOrderReq):
    simulator.inject_order(req.origin, req.destination, req.weight, req.material)
    return {"status": "ok", "message": "Order injected"}
