from typing import List, Dict

class Bundle:
    def __init__(self, id: str, requests: List[str]):
        self.id = id
        self.requests = requests

class OfferPool:
    """
    Holds requests that carriers want to exchange.
    Generates spatio-temporal bundles.
    """
    def __init__(self):
        self.requests = []
        self.bundles = []

    def add_request(self, request_id: str, data: Dict):
        self.requests.append({"id": request_id, **data})

    def generate_bundles(self, max_bundles: int = 40) -> List[Bundle]:
        """
        Mock bundle generator. In reality, uses spatio-temporal clustering.
        """
        print(f"Generating up to {max_bundles} bundles from {len(self.requests)} requests...")
        # Toy implementation: pair adjacent requests
        for i in range(0, min(len(self.requests), max_bundles * 2), 2):
            if i + 1 < len(self.requests):
                self.bundles.append(Bundle(f"bundle_{i//2}", [self.requests[i]['id'], self.requests[i+1]['id']]))
        return self.bundles
