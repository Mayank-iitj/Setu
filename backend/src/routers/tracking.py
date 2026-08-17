from fastapi import APIRouter, HTTPException
import random
import time
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/track", tags=["tracking"])

@router.get("/{shipment_id}")
async def get_tracking_info(shipment_id: str):
    # Mock data for any shipment_id
    now = datetime.now()
    
    # 30% chance it's already delivered, 70% in transit
    is_delivered = random.random() < 0.3
    
    status = "Delivered" if is_delivered else "In Transit"
    current_location = "Delhi NCR Hub" if is_delivered else random.choice(["Surat Highway", "NH-48 checkpost", "Jaipur bypass"])
    
    # ETA bands
    eta_base = now + timedelta(hours=random.randint(2, 12))
    p10 = (eta_base - timedelta(minutes=45)).strftime("%H:%M")
    p50 = eta_base.strftime("%H:%M")
    p90 = (eta_base + timedelta(minutes=30)).strftime("%H:%M")
    
    events = [
        {"time": (now - timedelta(hours=24)).strftime("%Y-%m-%d %H:%M"), "status": "Order Created", "location": "System", "completed": True},
        {"time": (now - timedelta(hours=22)).strftime("%Y-%m-%d %H:%M"), "status": "Picked Up", "location": "Origin Facility", "completed": True},
        {"time": (now - timedelta(hours=10)).strftime("%Y-%m-%d %H:%M"), "status": "In Transit", "location": "Intermediate Hub", "completed": True},
    ]
    
    if is_delivered:
        events.append({"time": (now - timedelta(minutes=30)).strftime("%Y-%m-%d %H:%M"), "status": "Delivered", "location": "Destination", "completed": True})
    else:
        events.append({"time": now.strftime("%Y-%m-%d %H:%M"), "status": "In Transit", "location": current_location, "completed": True})
        events.append({"time": "Pending", "status": "Delivery", "location": "Destination Hub", "completed": False})

    return {
        "shipment_id": shipment_id,
        "status": status,
        "current_location": current_location,
        "eta": {
            "p10": p10,
            "p50": p50,
            "p90": p90,
            "confidence": "90%",
            "date": eta_base.strftime("%Y-%m-%d")
        },
        "timeline": events
    }
