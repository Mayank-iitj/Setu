"""Precompute the demo scenario at high solver quality.

The live ablation takes ~8s at a 800ms per-coalition budget. That is too slow for
a UI toggle a judge is watching, and a longer budget also produces better routes.
So we solve it once, well, and commit the answer; the API serves it instantly.

This is not faking the computation — it is the same solver, run ahead of time,
and the payload records the budget and timestamp so the provenance is visible.

    python scripts/precompute_demo.py [--budget-ms 3000]
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.src.engine.exchange.ablation import run_ablation          # noqa: E402
from backend.src.engine.exchange.auction import run_round              # noqa: E402
from backend.src.engine.exchange.model import generate_scenario        # noqa: E402

OUT = ROOT / "data" / "demo"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--budget-ms", type=int, default=3000,
                    help="per-coalition solver budget; higher is better and slower")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    started = time.perf_counter()

    carriers, requests = generate_scenario(seed=args.seed)
    print(f"scenario: {len(carriers)} carriers, {len(requests)} requests, "
          f"seed {args.seed}")
    print(f"solving 2^{len(carriers)}-1 = {2**len(carriers)-1} coalitions "
          f"at {args.budget_ms}ms each ...")

    ablation, settlement = run_ablation(carriers, requests, budget_ms=args.budget_ms)

    if not ablation.efficient:
        print("ERROR: Shapley efficiency violated — refusing to write", file=sys.stderr)
        return 1
    if not ablation.individually_rational:
        print("WARNING: individual rationality FAILED — a carrier is worse off.",
              file=sys.stderr)
        print("This is a real finding, not a crash. It is written to the payload "
              "and the UI must surface it rather than hide it.", file=sys.stderr)

    payload = ablation.to_dict()
    payload["meta"] = {
        "seed": args.seed,
        "budget_ms": args.budget_ms,
        "computed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "n_requests": len(requests),
        "n_carriers": len(carriers),
        "distance_basis": "haversine x 1.3 circuity factor (approximation, not routed)",
        "note": "Computed by backend/src/engine/exchange. Same code path as the live API.",
    }
    (OUT / "ablation.json").write_text(json.dumps(payload, indent=2))

    auction = run_round(carriers, requests, carriers[0], budget_ms=args.budget_ms // 4)
    (OUT / "auction.json").write_text(json.dumps({
        "bundles": [{"id": b.id, "request_ids": b.request_ids} for b in auction.bundles],
        "bids": [{"carrier_id": c, "bundle_id": b, "price": round(p, 2)}
                 for (c, b), p in auction.bids.items()],
        "incumbent": {k: round(v, 2) for k, v in auction.incumbent.items()},
        "awards": auction.awards,
        "total_gain": round(auction.total_gain, 2),
        "status": auction.status,
        "releasing_carrier": carriers[0].id,
    }, indent=2))

    (OUT / "scenario.json").write_text(json.dumps({
        "carriers": [{"id": c.id, "name": c.name, "depot": c.depot,
                      "n_vehicles": c.n_vehicles, "capacity": c.capacity}
                     for c in carriers],
        "requests": [{"id": r.id, "owner": r.owner, "hub": r.hub,
                      "demand": r.demand, "ready": r.ready, "due": r.due}
                     for r in requests],
    }, indent=2))

    print(f"\nOFF Rs {ablation.off_total_cost:>10,.0f}  {ablation.off_vehicles:>2}v  "
          f"{ablation.off_distance_km:>7,.0f}km  {ablation.off_unserved} unserved")
    print(f"ON  Rs {ablation.on_total_cost:>10,.0f}  {ablation.on_vehicles:>2}v  "
          f"{ablation.on_distance_km:>7,.0f}km  {ablation.on_unserved} unserved")
    print(f"routing saving Rs {ablation.routing_saving:,.0f} "
          f"({ablation.routing_saving_pct}%)   "
          f"service +{ablation.off_unserved - ablation.on_unserved} loads")
    print(f"efficiency={ablation.efficient}  IR={ablation.individually_rational}")
    print(f"auction: {len(auction.awards)} awarded, gain Rs {auction.total_gain:,.0f}")
    print(f"\nwrote {OUT}/ablation.json, auction.json, scenario.json "
          f"in {time.perf_counter()-started:.1f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
