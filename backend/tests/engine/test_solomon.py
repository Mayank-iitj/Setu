import pytest
from backend.src.engine.benchmarks.solomon import parse_solomon, SolomonInstance

SAMPLE = """C101

VEHICLE
NUMBER     CAPACITY
  25         200

CUSTOMER
CUST NO.  XCOORD.   YCOORD.    DEMAND   READY TIME  DUE DATE   SERVICE   TIME

    0      40         50          0          0       1236          0
    1      45         68         10        912        967         90
    2      45         70         30        825        870         90
"""


def test_parses_header():
    inst = parse_solomon(SAMPLE)
    assert isinstance(inst, SolomonInstance)
    assert inst.name == "C101"
    assert inst.num_vehicles == 25
    assert inst.capacity == 200


def test_parses_depot_as_node_zero():
    depot = parse_solomon(SAMPLE).nodes[0]
    assert (depot.x, depot.y) == (40.0, 50.0)
    assert depot.demand == 0
    assert (depot.ready, depot.due) == (0, 1236)


def test_parses_customers():
    inst = parse_solomon(SAMPLE)
    assert len(inst.nodes) == 3          # depot + 2 customers
    c2 = inst.nodes[2]
    assert (c2.x, c2.y) == (45.0, 70.0)
    assert c2.demand == 30
    assert (c2.ready, c2.due, c2.service) == (825, 870, 90)


def test_ignores_blank_and_short_lines():
    noisy = SAMPLE + "\n   \n  \n"
    assert len(parse_solomon(noisy).nodes) == 3


def test_rejects_input_without_customer_section():
    with pytest.raises(ValueError, match="CUSTOMER"):
        parse_solomon("C101\n\nVEHICLE\nNUMBER CAPACITY\n 25 200\n")
