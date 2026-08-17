from fastapi import APIRouter
from typing import Optional

router = APIRouter(prefix="/api/integrations", tags=["integrations"])

@router.get("/vahan/verify")
async def verify_vahan(vehicleNumber: str):
    return {"status": "ACTIVE", "fitness_valid_upto": "2028-10-15", "insurance_valid_upto": "2027-02-10"}

@router.get("/ais140/location")
async def get_ais140_location(vehicleId: str):
    return {"status": "TRANSMITTING", "last_ping": "5 seconds ago", "lat": 28.6139, "lon": 77.2090}

@router.get("/fastag/status")
async def get_fastag_status(vehicleId: str):
    return {"status": "ACTIVE", "balance": 4500, "kyc_status": "VERIFIED"}
