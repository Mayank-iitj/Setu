"""Parser for the Solomon CVRPTW benchmark format.

File layout:

    <NAME>

    VEHICLE
    NUMBER     CAPACITY
      25         200

    CUSTOMER
    CUST NO.  XCOORD.  YCOORD.  DEMAND  READY TIME  DUE DATE  SERVICE TIME
        0      40       50        0         0         1236        0
        ...

Node 0 is the depot. Distances are Euclidean over the raw coordinates and
travel time equals distance — that convention is what makes results
comparable with published best-known solutions, so do not substitute road
distances here.
"""
from __future__ import annotations

import pathlib
from dataclasses import dataclass

DATA_DIR = pathlib.Path(__file__).resolve().parents[4] / "data" / "solomon"


@dataclass(frozen=True)
class SolomonNode:
    x: float
    y: float
    demand: int
    ready: int
    due: int
    service: int


@dataclass(frozen=True)
class SolomonInstance:
    name: str
    num_vehicles: int
    capacity: int
    nodes: list[SolomonNode]

    @property
    def num_customers(self) -> int:
        return len(self.nodes) - 1


def _find(lines: list[str], token: str) -> int:
    for i, line in enumerate(lines):
        if line.strip().upper().startswith(token):
            return i
    raise ValueError(f"malformed Solomon instance: no {token} section found")


def parse_solomon(text: str) -> SolomonInstance:
    lines = text.splitlines()
    if not lines or not lines[0].strip():
        raise ValueError("malformed Solomon instance: missing name on line 1")
    name = lines[0].strip()

    vehicle_at = _find(lines, "VEHICLE")
    num_vehicles, capacity = (int(v) for v in lines[vehicle_at + 2].split()[:2])

    customer_at = _find(lines, "CUSTOMER")
    nodes: list[SolomonNode] = []
    for line in lines[customer_at + 1:]:
        parts = line.split()
        if len(parts) < 7:
            continue                      # header row, blank line, or trailing noise
        try:
            _, x, y, demand, ready, due, service = (float(p) for p in parts[:7])
        except ValueError:
            continue                      # the column-header row
        nodes.append(SolomonNode(x, y, int(demand), int(ready), int(due), int(service)))

    if not nodes:
        raise ValueError("malformed Solomon instance: no customer rows parsed")
    return SolomonInstance(name, num_vehicles, capacity, nodes)


def load_instance(name: str) -> SolomonInstance:
    path = DATA_DIR / f"{name.upper()}.txt"
    if not path.exists():
        raise FileNotFoundError(
            f"instance {name} not found at {path}. Run: python scripts/fetch_solomon.py"
        )
    return parse_solomon(path.read_text())


def available_instances() -> list[str]:
    if not DATA_DIR.is_dir():
        return []
    return sorted(p.stem for p in DATA_DIR.glob("*.txt"))
