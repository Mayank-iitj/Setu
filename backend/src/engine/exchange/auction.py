"""Sealed-bid combinatorial auction: bundles, marginal-cost bids, winner determination.

Carriers submit PRICES, never networks. Nobody sees anyone else's customer list,
routes, or margins — that is the whole trust story, and it needs no blockchain.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from ortools.sat.python import cp_model

from .model import HUBS, Carrier, Request
from .solver import solve_multidepot


@dataclass(frozen=True)
class Bundle:
    id: str
    request_ids: list[str]


@dataclass
class AuctionResult:
    bundles: list[Bundle]
    bids: dict[tuple[str, str], float]        # (carrier id, bundle id) -> INR
    incumbent: dict[str, float]               # bundle id -> INR cost to current owner
    awards: dict[str, str]                    # bundle id -> winning carrier id
    total_gain: float = 0.0
    status: str = ""

    @property
    def awarded_requests(self) -> list[str]:
        by_id = {b.id: b for b in self.bundles}
        return [r for bid in self.awards for r in by_id[bid].request_ids]


def generate_bundles(pool: list[Request], max_bundles: int = 20,
                     size: int = 2) -> list[Bundle]:
    """Group pooled requests by delivery-hub proximity.

    Bundles matter: single-request auctions capture only a fraction of the
    available gain, because complementary loads are what make a detour pay.
    Singletons are always appended so the auction degrades gracefully.
    """
    if not pool:
        return []
    ordered = sorted(pool, key=lambda r: (HUBS[r.hub][0], HUBS[r.hub][1]))
    bundles: list[Bundle] = []
    for i in range(0, len(ordered), size):
        if len(bundles) >= max_bundles:
            break
        chunk = ordered[i:i + size]
        if len(chunk) > 1:
            bundles.append(Bundle(f"BND-{len(bundles)}", [r.id for r in chunk]))
    for r in ordered:
        if len(bundles) >= max_bundles:
            break
        bundles.append(Bundle(f"BND-S{len(bundles)}", [r.id]))
    return bundles


def marginal_bid(carrier: Carrier, kept: list[Request], bundle_requests: list[Request],
                 budget_ms: int = 300) -> float | None:
    """cost(plan + bundle) - cost(plan): the true marginal insertion cost.

    Warm-starting from the carrier's existing plan is what makes this affordable
    at auction scale; re-solving from scratch per bundle would not fit the round.
    """
    base = solve_multidepot([carrier], kept, budget_ms)
    withb = solve_multidepot([carrier], kept + bundle_requests, budget_ms)
    if not withb.feasible or withb.cost == float("inf"):
        return None
    return withb.cost - base.cost


def winner_determination(bundles: list[Bundle], bids: dict[tuple[str, str], float],
                         incumbent: dict[str, float],
                         max_seconds: float = 5.0) -> AuctionResult:
    """Set packing maximising reallocation gain.

    gain[c][b] = incumbent[b] - bid[c][b] — what the system saves by moving
    bundle b from its current owner to carrier c.

    Minimising the sum of winning bids instead makes "award nothing" trivially
    optimal, since every bid is positive. Only strictly positive gains are
    eligible, so the auction can never make the system worse off.

    NP-hard in general; milliseconds at this size.
    """
    model = cp_model.CpModel()
    x: dict[tuple[str, str], cp_model.IntVar] = {}
    for b in bundles:
        for (carrier_id, bundle_id), price in bids.items():
            if bundle_id != b.id:
                continue
            if incumbent.get(b.id, 0.0) - price <= 0:
                continue
            x[(carrier_id, b.id)] = model.NewBoolVar(f"x_{carrier_id}_{b.id}")

    if not x:
        return AuctionResult(bundles, bids, incumbent, {}, 0.0, "NO_PROFITABLE_TRADE")

    for b in bundles:                                    # each bundle at most once
        vs = [v for k, v in x.items() if k[1] == b.id]
        if vs:
            model.Add(sum(vs) <= 1)

    request_to_bundles: dict[str, list[str]] = {}
    for b in bundles:
        for r in b.request_ids:
            request_to_bundles.setdefault(r, []).append(b.id)
    for _request, bundle_ids in request_to_bundles.items():   # each request at most once
        vs = [v for k, v in x.items() if k[1] in bundle_ids]
        if len(vs) > 1:
            model.Add(sum(vs) <= 1)

    model.Maximize(sum(
        int(round((incumbent[k[1]] - bids[k]) * 100)) * v for k, v in x.items()
    ))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = max_seconds
    status = solver.Solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return AuctionResult(bundles, bids, incumbent, {}, 0.0,
                             solver.StatusName(status))

    awards = {bundle_id: carrier_id
              for (carrier_id, bundle_id), var in x.items() if solver.Value(var)}
    gain = sum(incumbent[b] - bids[(c, b)] for b, c in awards.items())
    return AuctionResult(bundles, bids, incumbent, awards, gain,
                         solver.StatusName(status))


def run_round(carriers: list[Carrier], requests: list[Request], owner: Carrier,
              pool_size: int = 4, budget_ms: int = 250) -> AuctionResult:
    """One exchange round: `owner` releases its marginal requests, others bid."""
    by_id = {r.id: r for r in requests}
    owned = [r for r in requests if r.owner == owner.id]
    pool = owned[-pool_size:]                  # the out-of-region tail
    kept_by_owner = [r for r in owned if r not in pool]

    bundles = generate_bundles(pool)
    incumbent = {
        b.id: (marginal_bid(owner, kept_by_owner,
                            [by_id[i] for i in b.request_ids], budget_ms) or 0.0)
        for b in bundles
    }

    bids: dict[tuple[str, str], float] = {}
    for c in carriers:
        if c.id == owner.id:
            continue                            # the incumbent does not bid on its own release
        kept = [r for r in requests if r.owner == c.id]
        for b in bundles:
            price = marginal_bid(c, kept, [by_id[i] for i in b.request_ids], budget_ms)
            if price is not None:
                bids[(c.id, b.id)] = price

    return winner_determination(bundles, bids, incumbent)
