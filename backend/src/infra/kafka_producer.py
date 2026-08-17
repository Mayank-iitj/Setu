from confluent_kafka import Producer
import os
import json

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")

producer = Producer({
    'bootstrap.servers': KAFKA_BROKER,
    'client.id': 'python-optimiser'
})

def delivery_report(err, msg):
    if err is not None:
        print(f"Message delivery failed: {err}")
    else:
        pass # Delivered

async def publish_event(topic: str, key: str, value: dict):
    producer.produce(
        topic, 
        key=key, 
        value=json.dumps(value), 
        callback=delivery_report
    )
    producer.poll(0)

def flush_events():
    producer.flush()
