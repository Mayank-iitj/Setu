"""Exact Shapley settlement over the cost-saving game.

The characteristic function v(S) is the cost SAVING a coalition S achieves
versus its members operating alone:

    v(S) = sum_{i in S} standalone_cost(i)  -  collaborative_cost(S)

Computing it needs one solve per non-empty coalition — 2^n - 1, so 7 solves for
three carriers and 15 for four. That is cheap enough to compute the Shapley
value EXACTLY:

    phi_i = sum_{S subset N\\{i}}  |S|!(n-|S|-1)!/n!  ·  [ v(S u {i}) - v(S) ]

Monte-Carlo sampling over permutations is the usual approach in the literature
and is unnecessary at this size: it would approximate something we can compute
outright, and "this is the exact Shapley value" is a stronger claim.
"""
from __future__ import annotations

import itertools
import math
from dataclasses import dataclass, field

from .model import Carrier, Request
from .solver import PlanResult, solve_multidepot

TOL_INR = 1.0   # rupees; solver returns floats, so exact equality is not available


@dataclass
class Settlement:
    shapley: dict[str, float]                  # carrier id -> INR share of the saving
    standalone: dict[str, float]               # carrier id -> INR cost alone
    coalition_value: dict[tuple[str, ...], float]
    coalition_detail: dict[tuple[str, ...], PlanResult] = field(default_factory=dict)
    total_saving: float = 0.0

    @property
    def efficient(self) -> bool:
        """Shapley shares must sum to the value of the grand coalition."""
        return abs(sum(self.shapley.values()) - self.total_saving) < TOL_INR

    @property
    def individually_rational(self) -> bool:
        """No carrier may be worse off than operating alone."""
        return all(v >= -TOL_INR for v in self.shapley.values())


def standalone(carrier: Carrier, requests: list[Request], budget_ms: int) -> PlanResult:
    own = [r for r in requests if r.owner == carrier.id]
    return solve_multidepot([carrier], own, budget_ms)


def coalition(members: tuple[Carrier, ...], requests: list[Request],
              budget_ms: int) -> PlanResult:
    ids = {c.id for c in members}
    pooled = [r for r in requests if r.owner in ids]
    return solve_multidepot(list(members), pooled, budget_ms)


def exact_shapley(carriers: list[Carrier], requests: list[Request],
                  budget_ms: int = 800) -> Settlement:
    n = len(carriers)

    alone: dict[str, float] = {}
    detail: dict[tuple[str, ...], PlanResult] = {}
    for c in carriers:
        res = standalone(c, requests, budget_ms)
        alone[c.id] = res.cost
        detail[(c.id,)] = res

    value: dict[tuple[str, ...], float] = {(): 0.0}
    for size in range(1, n + 1):
        for combo in itertools.combinations(carriers, size):
            key = tuple(sorted(c.id for c in combo))
            res = coalition(combo, requests, budget_ms)
            detail[key] = res
            value[key] = sum(alone[cid] for cid in key) - res.cost

    phi = {c.id: 0.0 for c in carriers}
    fact = math.factorial
    for c in carriers:
        others = [o for o in carriers if o.id != c.id]
        for size in range(len(others) + 1):
            for combo in itertools.combinations(others, size):
                S = tuple(sorted(o.id for o in combo))
                S_with_i = tuple(sorted(S + (c.id,)))
                weight = fact(size) * fact(n - size - 1) / fact(n)
                phi[c.id] += weight * (value[S_with_i] - value[S])

    grand = tuple(sorted(c.id for c in carriers))
    return Settlement(shapley=phi, standalone=alone, coalition_value=value,
                      coalition_detail=detail, total_saving=value[grand])
