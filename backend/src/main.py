import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from . import simulator
from .routers.fleet import router as fleet_router
from .routers.exchange import router as exchange_router
from .routers.contact import router as contact_router
from .routers.benchmark import router as benchmark_router
from .routers.proof import router as proof_router
from .routers.integrations import router as integrations_router
from .routers.disruption import router as disruption_router
from .routers.tracking import router as tracking_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize simulation state on startup
    simulator.initialize()
    # Launch background simulation loop
    task = asyncio.create_task(simulator.simulation_loop())
    yield
    # Graceful shutdown
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Setu API Gateway",
    version="1.0.0",
    description="Cognitive AI Fleet Coordination Platform — Real-Time API",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(fleet_router)
app.include_router(exchange_router)
app.include_router(contact_router)
app.include_router(benchmark_router)
app.include_router(proof_router)
app.include_router(integrations_router)
app.include_router(disruption_router)
app.include_router(tracking_router)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "vehicles": len(simulator.vehicles),
        "round": simulator.current_round.get("round_id"),
        "ws_clients": len(simulator.active_connections),
    }


# ── WebSocket ─────────────────────────────────────────────────────────────────
@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    await websocket.accept()
    simulator.active_connections.add(websocket)

    # Send current snapshot immediately on connect
    await websocket.send_json({
        "type": "snapshot",
        "stats": simulator.stats,
        "round": {
            "round_id": simulator.current_round["round_id"],
            "status": simulator.current_round["status"],
            "seconds_remaining": simulator.current_round["seconds_remaining"],
            "bundles": [b.model_dump() for b in simulator.current_round["bundles"]],
        },
        "events": [e.model_dump() for e in simulator.recent_events[:10]],
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
            for v in simulator.vehicles
        ],
    })

    try:
        while True:
            # Keep connection alive; client sends pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        simulator.active_connections.discard(websocket)
