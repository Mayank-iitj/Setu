"""Collaboration ON vs OFF — the evidence that the mechanism is worth anything.

The obvious attack on a freight exchange is "why would competing carriers ever
cooperate?" The answer has to be a chart, not a sentence: every carrier's profit
before and after, with all three bars going up.

The saving is reported DECOMPOSED. Folding the unserved-load penalty into the
headline cost figure would overstate the routing gain, so routing and service
improvements are returned as separate numbers and the UI shows them separately.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field

from .model import DROP_PENALTY_INR, Carrier, Request
from .settlement import Settlement, exact_shapley


@dataclass
class CarrierOutcome:
    carrier_id: str
    name: str
    depot: str
    cost_alone: float
    shapley_share: float
    cost_after: float          # cost_alone - shapley_share
    vehicles_alone: int
    distance_alone_km: float
    unserved_alone: int

    @property
    def better_off(self) -> bool:
        return self.cost_after <= self.cost_alone


@dataclass
class AblationResult:
    carriers: list[CarrierOutcome]
    off_total_cost: float
    on_total_cost: float
    off_vehicles: int
    on_vehicles: int
    off_distance_km: float
    on_distance_km: float
    off_unserved: int
    on_unserved: int
    total_saving: float
    routing_saving: float
    service_saving: float
    saving_pct: float
    routing_saving_pct: float
    efficient: bool
    individually_rational: bool
    solve_time_ms: int = 0
    coalitions_solved: int = 0

    def to_dict(self) -> dict:
        d = asdict(self)
        d["carriers"] = [
            {**asdict(c), "better_off": c.better_off} for c in self.carriers
        ]
        return d


def run_ablation(carriers: list[Carrier], requests: list[Request],
                 budget_ms: int = 800) -> tuple[AblationResult, Settlement]:
    import time
    started = time.perf_counter()

    s = exact_shapley(carriers, requests, budget_ms)
    grand = tuple(sorted(c.id for c in carriers))
    on = s.coalition_detail[grand]

    outcomes: list[CarrierOutcome] = []
    off_vehicles = off_unserved = 0
    off_distance = 0.0
    for c in carriers:
        alone = s.coalition_detail[(c.id,)]
        off_vehicles += alone.vehicles_used
        off_distance += alone.distance_km
        off_unserved += alone.dropped
        outcomes.append(CarrierOutcome(
            carrier_id=c.id, name=c.name, depot=c.depot,
            cost_alone=round(s.standalone[c.id], 2),
            shapley_share=round(s.shapley[c.id], 2),
            cost_after=round(s.standalone[c.id] - s.shapley[c.id], 2),
            vehicles_alone=alone.vehicles_used,
            distance_alone_km=alone.distance_km,
            unserved_alone=alone.dropped,
        ))

    off_total = sum(s.standalone.values())
    off_routing = off_total - off_unserved * DROP_PENALTY_INR
    on_routing = on.cost - on.dropped * DROP_PENALTY_INR
    routing_saving = off_routing - on_routing
    service_saving = (off_unserved - on.dropped) * DROP_PENALTY_INR

    result = AblationResult(
        carriers=outcomes,
        off_total_cost=round(off_total, 2), on_total_cost=round(on.cost, 2),
        off_vehicles=off_vehicles, on_vehicles=on.vehicles_used,
        off_distance_km=round(off_distance, 1), on_distance_km=on.distance_km,
        off_unserved=off_unserved, on_unserved=on.dropped,
        total_saving=round(s.total_saving, 2),
        routing_saving=round(routing_saving, 2),
        service_saving=round(service_saving, 2),
        saving_pct=round(s.total_saving / off_total * 100, 1) if off_total else 0.0,
        routing_saving_pct=round(routing_saving / off_routing * 100, 1) if off_routing else 0.0,
        efficient=s.efficient,
        individually_rational=s.individually_rational,
        solve_time_ms=int((time.perf_counter() - started) * 1000),
        coalitions_solved=len(s.coalition_value) - 1,
    )
    return result, s
