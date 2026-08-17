from fastapi import APIRouter
from ..models import ContactRequest

router = APIRouter(prefix="/api", tags=["contact"])


@router.post("/contact")
async def submit_contact(contact: ContactRequest):
    # In production this would store to DB / trigger email
    print(f"[CONTACT] New inquiry from {contact.carrier_name} ({contact.email}), fleet: {contact.fleet_size}")
    return {
        "status": "received",
        "message": f"Thank you, {contact.carrier_name}. Our team will contact you at {contact.email} within 24 hours.",
    }
