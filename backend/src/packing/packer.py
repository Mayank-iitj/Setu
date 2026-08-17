# Extreme Point 3D Bin Packing Stub (M5)

class Box:
    def __init__(self, id, w, h, d, weight):
        self.id = id
        self.w = w
        self.h = h
        self.d = d
        self.weight = weight

class VehicleBay:
    def __init__(self, w, h, d, max_weight):
        self.w = w
        self.h = h
        self.d = d
        self.max_weight = max_weight
        self.packed_boxes = []

    def can_pack(self, box: Box) -> bool:
        # Toy validation logic
        if box.weight > self.max_weight:
            return False
        return True

def pack_requests(bay: VehicleBay, boxes: list[Box]) -> bool:
    """
    Attempts to pack the given boxes into the bay. 
    Does not yet implement LIFO reachability rules.
    """
    print("Attempting to pack boxes...")
    for box in boxes:
        if bay.can_pack(box):
            bay.packed_boxes.append(box)
        else:
            print(f"Failed to pack box {box.id}")
            return False
    return True
