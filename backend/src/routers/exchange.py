from fastapi import APIRouter
import random
from .. import simulator
from ..models import ExchangeRound, BidRequest, BidResponse

router = APIRouter(prefix="/api/exchange", tags=["exchange"])


@router.get("/round", response_model=ExchangeRound)
async def get_current_round():
    r = simulator.current_round
    return ExchangeRound(
        round_id=r["round_id"],
        status=r["status"],
        bundles=r["bundles"],
        seconds_remaining=r["seconds_remaining"],
    )


@router.post("/bid", response_model=BidResponse)
async def submit_bid(bid: BidRequest):
    # Find bundle in current round
    round_bundles = simulator.current_round.get("bundles", [])
    bundle = next((b for b in round_bundles if b.bundle_id == bid.bundle_id), None)

    if simulator.current_round.get("status") != "open":
        return BidResponse(
            status="rejected",
            message="Round is not currently open for bidding.",
            bundle_id=bid.bundle_id,
        )

    if bundle is None:
        return BidResponse(
            status="rejected",
            message=f"Bundle {bid.bundle_id} not found in current round.",
            bundle_id=bid.bundle_id,
        )

    # Accept bid
    msg = f"{bid.carrier_id} submitted bid ₹{bid.price:,.0f} on {bid.bundle_id}"
    simulator._add_event("bid", msg, "accent")

    # Broadcast immediately
    await simulator.broadcast({
        "type": "bid_submitted",
        "bundle_id": bid.bundle_id,
        "carrier_id": bid.carrier_id,
        "price": bid.price,
        "event": {"type": "bid", "message": msg, "color": "accent"},
    })

    return BidResponse(
        status="accepted",
        message=f"Bid of ₹{bid.price:,.0f} recorded for {bid.bundle_id}.",
        bundle_id=bid.bundle_id,
    )
