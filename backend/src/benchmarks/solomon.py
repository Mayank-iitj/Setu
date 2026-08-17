def parse_solomon(filepath: str):
    """
    Parses a standard Solomon instance file for CVRPTW.
    Format:
    CUST NO.  XCOORD.   YCOORD.    DEMAND   READY TIME  DUE DATE   SERVICE TIME
    """
    print(f"Parsing Solomon benchmark from {filepath}...")
    instance = {
        "nodes": []
    }
    # Toy mock parsing
    instance["nodes"].append({"id": 0, "x": 40, "y": 50, "demand": 0, "ready_time": 0, "due_date": 1236, "service_time": 0})
    return instance

def calculate_gap(our_score: float, best_known: float) -> float:
    return (our_score - best_known) / best_known * 100
