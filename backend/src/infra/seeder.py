import random

# A mock seed generator for the hackathon foundation phase
def generate_seed_data(num_carriers=3, num_vehicles=200, num_shipments=1400):
    print(f"Generating synthetic data for {num_carriers} carriers, {num_vehicles} vehicles, and {num_shipments} shipments in the Gujarat-NCR corridor...")
    
    carriers = [{"id": f"carrier_{i}", "name": f"Carrier {i}"} for i in range(num_carriers)]
    
    # Generate random shipments roughly between Gujarat (lat 23.0, lon 72.5) and NCR (lat 28.6, lon 77.2)
    shipments = []
    for i in range(num_shipments):
        origin_lat = 23.0 + random.uniform(-1, 1)
        origin_lon = 72.5 + random.uniform(-1, 1)
        dest_lat = 28.6 + random.uniform(-1, 1)
        dest_lon = 77.2 + random.uniform(-1, 1)
        
        shipments.append({
            "id": f"shipment_{i}",
            "origin": {"lat": origin_lat, "lon": origin_lon},
            "destination": {"lat": dest_lat, "lon": dest_lon},
            "weight_kg": random.uniform(100, 2000),
            "volume_m3": random.uniform(1, 10),
            "ready_time": random.randint(0, 3600),
            "due_time": random.randint(3600, 86400)
        })
        
    print("Seed generation complete.")
    return carriers, shipments

if __name__ == "__main__":
    generate_seed_data()
