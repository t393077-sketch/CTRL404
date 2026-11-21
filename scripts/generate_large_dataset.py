#!/usr/bin/env python3
"""
SEENIL Large Telemetry Dataset Generator & Benchmarking Tool

Generates >= 250,000 (scalable to 1,000,000+) realistic infrastructure telemetry
records across all 5 categories (compute, network, storage, database, system_health).
All generated records are explicitly tagged with `is_synthetic = True` to preserve
real machine telemetry separately from test load data.

Uses high-speed bulk insertion in 10,000-record chunks with composite indexes.
"""

import sys
import os
import time
import uuid
import random
import argparse
from datetime import datetime, timezone, timedelta

# Ensure project root is in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from cloud.app.database import SessionLocal, get_engine
from cloud.app.models import TelemetryEvent, Base

METRIC_TEMPLATES = [
    # Compute
    {"metric": "system.cpu.utilization", "category": "compute", "min": 10.0, "max": 95.0, "tz": "UTC"},
    {"metric": "system.cpu.cores", "category": "compute", "min": 8.0, "max": 8.0, "tz": "UTC"},
    {"metric": "system.memory.utilization", "category": "compute", "min": 35.0, "max": 88.0, "tz": "UTC"},
    {"metric": "system.memory.available_mb", "category": "compute", "min": 2048.0, "max": 12288.0, "tz": "UTC"},
    {"metric": "system.load.processes", "category": "compute", "min": 150.0, "max": 320.0, "tz": "UTC"},
    {"metric": "system.uptime.seconds", "category": "compute", "min": 3600.0, "max": 864000.0, "tz": "UTC"},
    # Network
    {"metric": "network.bandwidth.bytes_sent_sec", "category": "network", "min": 10240.0, "max": 5242880.0, "tz": "UTC"},
    {"metric": "network.bandwidth.bytes_recv_sec", "category": "network", "min": 20480.0, "max": 10485760.0, "tz": "UTC"},
    {"metric": "network.packets.sent_sec", "category": "network", "min": 50.0, "max": 3500.0, "tz": "UTC"},
    {"metric": "network.packets.recv_sec", "category": "network", "min": 80.0, "max": 5000.0, "tz": "UTC"},
    {"metric": "network.latency.rtt", "category": "network", "min": 8.5, "max": 95.0, "tz": "UTC"},
    {"metric": "network.packet_loss", "category": "network", "min": 0.0, "max": 1.5, "tz": "UTC"},
    {"metric": "network.interface.status", "category": "network", "min": 1.0, "max": 1.0, "tz": "UTC"},
    # Storage
    {"metric": "system.disk.total_gb", "category": "storage", "min": 512.0, "max": 512.0, "tz": "UTC"},
    {"metric": "system.disk.used_gb", "category": "storage", "min": 180.0, "max": 390.0, "tz": "UTC"},
    {"metric": "system.disk.available_gb", "category": "storage", "min": 122.0, "max": 332.0, "tz": "UTC"},
    {"metric": "system.disk.utilization", "category": "storage", "min": 35.0, "max": 78.0, "tz": "UTC"},
    {"metric": "system.disk.read_bytes_sec", "category": "storage", "min": 1024.0, "max": 15728640.0, "tz": "UTC"},
    {"metric": "system.disk.write_bytes_sec", "category": "storage", "min": 2048.0, "max": 20971520.0, "tz": "UTC"},
    # Database
    {"metric": "database.connectivity.status", "category": "database", "min": 1.0, "max": 1.0, "tz": "UTC"},
    {"metric": "database.query.latency_ms", "category": "database", "min": 1.2, "max": 28.5, "tz": "UTC"},
    {"metric": "database.active_connections", "category": "database", "min": 5.0, "max": 65.0, "tz": "UTC"},
    {"metric": "database.throughput.qps", "category": "database", "min": 150.0, "max": 3200.0, "tz": "UTC"},
    {"metric": "database.error_rate", "category": "database", "min": 0.0, "max": 0.02, "tz": "UTC"},
    # System Health
    {"metric": "agent.heartbeat.pulse", "category": "system_health", "min": 1.0, "max": 1.0, "tz": "UTC"},
    {"metric": "agent.collection.failures", "category": "system_health", "min": 0.0, "max": 0.0, "tz": "UTC"},
    {"metric": "agent.transmission.status", "category": "system_health", "min": 1.0, "max": 1.0, "tz": "UTC"},
    {"metric": "agent.outbox.buffered_count", "category": "system_health", "min": 0.0, "max": 5.0, "tz": "UTC"},
]

def generate_bulk_dataset(target_count: int = 250000, tenant_id: str = "tenant_alpha", batch_size: int = 10000):
    print(f"\n{'='*75}")
    print(f" SEENIL LARGE TELEMETRY DATASET GENERATION ({target_count:,} RECORDS)")
    print(f"{'='*75}")
    print(f"Tenant Target        : {tenant_id}")
    print(f"Batch Chunk Size     : {batch_size:,} records")
    print(f"Categories Covered   : Compute, Network, Storage, Database, System Health (27 distinct metrics)")
    print(f"Synthetic Data Flag  : is_synthetic = True (Real client telemetry strictly isolated)")
    print(f"{'='*75}\n")

    engine = get_engine()
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    start_wall = time.perf_counter()

    now = datetime.now(timezone.utc)
    nodes = ["node_edge_collector_01", "node_edge_collector_02", "node_cluster_edge_03", "node_db_primary_01"]

    inserted_total = 0
    batches = (target_count + batch_size - 1) // batch_size

    for b in range(batches):
        t_batch_start = time.perf_counter()
        records_in_batch = min(batch_size, target_count - inserted_total)
        batch_items = []

        for _ in range(records_in_batch):
            tmpl = random.choice(METRIC_TEMPLATES)
            # Random event time over the last 14 days
            delta_sec = random.randint(0, 14 * 86400)
            event_time = now - timedelta(seconds=delta_sec)
            val = round(random.uniform(tmpl["min"], tmpl["max"]), 2)
            latency = round(random.uniform(4.5, 45.0), 2)

            health = "Excellent" if val < 50.0 else ("Good" if val < 75.0 else ("Fair" if val < 90.0 else "Poor"))
            severity = "critical" if health == "Poor" else ("warning" if health == "Fair" else "info")

            batch_items.append({
                "payload_id": uuid.uuid4(),
                "tenant_id": tenant_id,
                "source_id": random.choice(nodes),
                "metric": tmpl["metric"],
                "value": val,
                "event_time_utc": event_time,
                "received_at": event_time + timedelta(milliseconds=latency),
                "ingest_latency_ms": latency,
                "source_tz": "UTC",
                "health": health,
                "category": tmpl["category"],
                "severity": severity,
                "alert_context": f"Baseline synthetic test metric {tmpl['metric']}={val}",
                "payload_sha256": "syn_" + uuid.uuid4().hex[:16],
                "is_synthetic": True
            })

        # Fast bulk insert mappings directly into database
        session.bulk_insert_mappings(TelemetryEvent, batch_items)
        session.commit()
        inserted_total += records_in_batch

        t_batch_elapsed = time.perf_counter() - t_batch_start
        throughput = round(records_in_batch / max(0.001, t_batch_elapsed), 0)
        pct = (inserted_total / target_count) * 100.0
        print(f"  Batch {b+1:02d}/{batches:02d}: Inserted {inserted_total:8,}/{target_count:,} ({pct:5.1f}%) | "
              f"Batch: {t_batch_elapsed:.2f}s ({throughput:,.0f} rows/s)")

    total_time = time.perf_counter() - start_wall
    overall_throughput = round(target_count / max(0.001, total_time), 0)

    print(f"\n{'-'*75}")
    print(f" SUCCESS: {inserted_total:,} telemetry records inserted in {total_time:.2f}s ({overall_throughput:,.0f} rows/s)!")
    print(f"{'-'*75}")

    # Benchmark actual SQL Query execution times
    print("\nExecuting Database Performance Verification...")
    from sqlalchemy import func

    t_bench = time.perf_counter()
    count_all = session.query(TelemetryEvent).count()
    t_count = (time.perf_counter() - t_bench) * 1000.0

    t_bench = time.perf_counter()
    real_count = session.query(TelemetryEvent).filter(TelemetryEvent.is_synthetic == False).count()
    t_real = (time.perf_counter() - t_bench) * 1000.0

    t_bench = time.perf_counter()
    syn_count = session.query(TelemetryEvent).filter(TelemetryEvent.is_synthetic == True).count()
    t_syn = (time.perf_counter() - t_bench) * 1000.0

    t_bench = time.perf_counter()
    agg = session.query(
        func.avg(TelemetryEvent.value),
        func.min(TelemetryEvent.value),
        func.max(TelemetryEvent.value),
        func.avg(TelemetryEvent.ingest_latency_ms)
    ).filter(
        TelemetryEvent.tenant_id == tenant_id,
        TelemetryEvent.category == "compute"
    ).first()
    t_agg = (time.perf_counter() - t_bench) * 1000.0

    print(f"  • Total Database Count query     : {count_all:,} rows in {t_count:.2f}ms")
    print(f"  • Real Telemetry Count query    : {real_count:,} rows in {t_real:.2f}ms")
    print(f"  • Synthetic Load Count query    : {syn_count:,} rows in {t_syn:.2f}ms")
    print(f"  • SQL Compute Aggregation query : avg={round(agg[0] or 0, 1)}, min={agg[1]}, max={agg[2]} in {t_agg:.2f}ms")
    print(f"{'='*75}\n")

    session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SEENIL Large Telemetry Dataset Generator")
    parser.add_argument("--count", type=int, default=250000, help="Total records to generate (default: 250,000)")
    parser.add_argument("--tenant", type=str, default="tenant_alpha", help="Tenant ID (default: tenant_alpha)")
    parser.add_argument("--batch", type=int, default=10000, help="Batch size for bulk insertion (default: 10,000)")
    args = parser.parse_args()

    generate_bulk_dataset(target_count=args.count, tenant_id=args.tenant, batch_size=args.batch)
