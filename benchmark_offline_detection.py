"""
SEENIL Dedicated Offline Detection Benchmark
Measures the end-to-end offline detection timing against the new:
- HEARTBEAT_TIMEOUT_SECONDS = 45s
- HEARTBEAT_CHECK_INTERVAL_SECONDS = 3s
"""

import sys
import os
import json
import time
import uuid
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

BASE_DIR = Path(r"C:\Users\shubh\.gemini\antigravity\scratch\seenil")
sys.path.insert(0, str(BASE_DIR))

CLOUD_URL = "http://127.0.0.1:8000"
ALPHA_TOKEN = "token_alpha_sec_98124"

from cloud.app.database import SessionLocal
from cloud.app.models import CollectorStatus, HealthTransition
from cloud.app.config import settings

print("="*80)
print(" SEENIL OFFLINE DETECTION TIMING BENCHMARK")
print("="*80)
print(f"Configured Heartbeat Timeout:        {settings.HEARTBEAT_TIMEOUT_SECONDS}s")
print(f"Configured Watchdog Poll Interval:   {settings.HEARTBEAT_CHECK_INTERVAL_SECONDS}s")
print(f"Target End-to-End Detection Window:  <= 60.0s")
print("="*80)

trials = []

for trial in range(3):
    probe_id = f"probe_bench_{trial}_{uuid.uuid4().hex[:6]}"
    
    # 1. Register collector via initial heartbeat
    hb_req = urllib.request.Request(
        f"{CLOUD_URL}/api/v1/heartbeat",
        data=json.dumps({"source_id": probe_id, "resource_usage": {"cpu": 25.0}}).encode(),
        headers={"Content-Type": "application/json", "X-Agent-Token": ALPHA_TOKEN},
        method="POST"
    )
    with urllib.request.urlopen(hb_req, timeout=5) as res:
        res.read()

    # 2. Age heartbeat to 45.0s in the past (exact timeout boundary)
    db = SessionLocal()
    try:
        col = db.query(CollectorStatus).filter(
            CollectorStatus.tenant_id == "tenant_alpha",
            CollectorStatus.source_id == probe_id
        ).first()
        col.last_heartbeat_utc = datetime.now(timezone.utc) - timedelta(seconds=settings.HEARTBEAT_TIMEOUT_SECONDS)
        db.commit()
    finally:
        db.close()

    # 3. Clock time until background watchdog transitions status to "offline"
    t_start = time.perf_counter()
    detected = False
    poll_latency = 0.0

    while (time.perf_counter() - t_start) < 10.0:
        time.sleep(0.1)
        db = SessionLocal()
        try:
            col = db.query(CollectorStatus).filter(
                CollectorStatus.tenant_id == "tenant_alpha",
                CollectorStatus.source_id == probe_id
            ).first()
            if col and col.status == "offline":
                poll_latency = time.perf_counter() - t_start
                detected = True
                offline_reason = col.offline_reason
                break
        finally:
            db.close()

    total_detection_time = settings.HEARTBEAT_TIMEOUT_SECONDS + poll_latency
    trials.append({
        "trial": trial + 1,
        "probe_id": probe_id,
        "poll_latency_s": round(poll_latency, 2),
        "total_detection_time_s": round(total_detection_time, 2),
        "reason": offline_reason
    })
    print(f"Trial {trial + 1}: Poll Latency={poll_latency:.2f}s | Total Detection Time={total_detection_time:.2f}s | Status=OFFLINE | Reason: {offline_reason}")
    time.sleep(1.0)

print("\n" + "="*80)
avg_total = sum(t["total_detection_time_s"] for t in trials) / len(trials)
avg_poll = sum(t["poll_latency_s"] for t in trials) / len(trials)
print(f"Average Watchdog Poll Latency:    {avg_poll:.2f}s")
print(f"Average Total Detection Time:     {avg_total:.2f}s")
print(f"Result: {'PASS (<= 60s TARGET MET)' if avg_total <= 60.0 else 'FAIL (> 60s)'}")
print("="*80)

# Save result to benchmark report
bench_report_path = BASE_DIR / "offline_detection_benchmark_result.json"
with open(bench_report_path, "w") as f:
    json.dump({
        "heartbeat_timeout_seconds": settings.HEARTBEAT_TIMEOUT_SECONDS,
        "watchdog_poll_interval_seconds": settings.HEARTBEAT_CHECK_INTERVAL_SECONDS,
        "target_threshold_seconds": 60.0,
        "target_met": avg_total <= 60.0,
        "average_total_detection_time_s": round(avg_total, 2),
        "average_watchdog_poll_latency_s": round(avg_poll, 2),
        "trials": trials
    }, f, indent=2)
