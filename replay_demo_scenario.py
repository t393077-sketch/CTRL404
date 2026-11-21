"""
SEENIL Controlled Demo Scenario Replayer
Allows one-command injection of schema-compliant demo scenarios into the running prototype.
Does NOT disrupt background live collector loops.
"""

import sys
import os
import json
import time
import uuid
import hmac
import hashlib
import argparse
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timezone, timedelta

BASE_DIR = Path(r"C:\Users\shubh\.gemini\antigravity\scratch\seenil")
sys.path.insert(0, str(BASE_DIR))

CLOUD_URL = "http://127.0.0.1:8000"
AGENT_URL = "http://127.0.0.1:8765"
ALPHA_TOKEN = "token_alpha_sec_98124"
ALPHA_SECRET = "secret_alpha_hmac_key_2026"

DATASET_PATH = BASE_DIR / "shared" / "demo_telemetry_dataset.json"

def post_raw(url, data_bytes, headers):
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body

def send_event(payload_dict):
    wire_bytes = json.dumps(payload_dict, separators=(',', ':')).encode("utf-8")
    sig = hmac.new(ALPHA_SECRET.encode("utf-8"), wire_bytes, hashlib.sha256).hexdigest()
    headers = {
        "Content-Type": "application/json",
        "X-Agent-Token": ALPHA_TOKEN,
        "X-Signature": sig
    }
    t0 = time.perf_counter()
    code, resp = post_raw(f"{CLOUD_URL}/api/v1/ingest", wire_bytes, headers)
    lat_ms = (time.perf_counter() - t0) * 1000.0
    return code, resp, lat_ms

def main():
    parser = argparse.ArgumentParser(description="SEENIL Phase 3 Demo Scenario Replayer")
    parser.add_argument("--scenario", choices=[
        "normal", "cpu_anomaly", "memory_anomaly", "network_anomaly",
        "multi_signal", "privacy_canaries", "stale_collector", "offline_recovery"
    ], help="Scenario identifier to execute")
    parser.add_argument("--list", action="store_true", help="List all available scenarios")
    parser.add_argument("--all", action="store_true", help="Execute all scenarios sequentially")
    
    args = parser.parse_args()

    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    scenarios = data.get("scenarios", {})

    if args.list or len(sys.argv) == 1:
        print("\n" + "="*70)
        print(" SEENIL AVAILABLE DEMO SCENARIOS")
        print("="*70)
        for key, sc in scenarios.items():
            short_key = key.replace("scenario_", "").split("_", 1)[-1]
            print(f"  * {short_key:<18} : {sc.get('name')}")
            print(f"    -> {sc.get('description')}")
        print("\nUsage example: python replay_demo_scenario.py --scenario cpu_anomaly\n")
        return

    targets = list(scenarios.keys()) if args.all else [f"scenario_{k}" for k in scenarios if args.scenario in k]

    for sc_key in targets:
        sc = scenarios.get(sc_key)
        if not sc:
            continue
        print("\n" + "="*70)
        print(f" [REPLAYING] {sc.get('name')}")
        print(f" Description: {sc.get('description')}")
        print("="*70)

        # Handle telemetry events replay
        if "events" in sc:
            for ev in sc["events"]:
                ev_copy = dict(ev)
                # Assign fresh timestamps and UUIDs so each replay is live
                ev_copy["payload_id"] = str(uuid.uuid4())
                ev_copy["event_time_utc"] = datetime.now(timezone.utc).isoformat()
                code, resp, lat = send_event(ev_copy)
                status = resp.get("status", "unknown") if isinstance(resp, dict) else resp
                print(f"  -> Ingested: {ev_copy['metric']}={ev_copy['value']} [{ev_copy['health']}] | Status: {status} ({lat:.1f}ms)")
                time.sleep(0.3)

        elif sc_key == "scenario_f_privacy_canaries":
            from agent.src.redaction import redact_text
            raw_input = sc["raw_input_before_redaction"]
            print(f"  * RAW LOCAL INPUT (BEFORE REDACTION):\n    {raw_input}")
            sanitized, was_red = redact_text(raw_input)
            print(f"\n  * SANITIZED LOCAL OUTPUT (AFTER REDACTION):\n    {sanitized}")
            print(f"  * Zero-exposure invariant: Raw password & API keys never touch network.")

        elif sc_key == "scenario_g_stale_collector":
            from cloud.app.database import SessionLocal
            from cloud.app.models import CollectorStatus
            from cloud.app.health_engine import check_and_downgrade_stale_sources
            probe = sc["source_id"]
            # Register collector
            req = urllib.request.Request(
                f"{CLOUD_URL}/api/v1/heartbeat",
                data=json.dumps({"source_id": probe, "resource_usage": {"cpu": 25.0}}).encode(),
                headers={"Content-Type": "application/json", "X-Agent-Token": ALPHA_TOKEN},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=5) as res:
                res.read()
            # Age heartbeat to simulate staleness
            db = SessionLocal()
            try:
                c = db.query(CollectorStatus).filter(CollectorStatus.source_id == probe).first()
                c.last_heartbeat_utc = datetime.now(timezone.utc) - timedelta(seconds=sc["heartbeat_age_seconds"])
                db.commit()
                downgraded = check_and_downgrade_stale_sources(db, max_stale_seconds=30)
                c_after = db.query(CollectorStatus).filter(CollectorStatus.source_id == probe).first()
                print(f"  * Stale Collector '{probe}' auto-downgraded to: {c_after.config_status} (Threshold: >30s)")
            finally:
                db.close()

        elif sc_key == "scenario_h_offline_recovery":
            from agent.src.storage.outbox import enqueue_outbox, count_pending_outbox
            from agent.src.transport import set_simulate_outage
            from agent.src.agent_service import AgentService
            print("  * Simulating network outage (outbox mode)...")
            set_simulate_outage(True)
            p_ids = []
            for i in range(5):
                pid = str(uuid.uuid4())
                p_ids.append(pid)
                p = {
                    "payload_id": pid,
                    "tenant_id": "tenant_alpha",
                    "source_id": "node_offline_sim",
                    "metric": "system.cpu.utilization",
                    "value": 45.0 + i,
                    "event_time_utc": datetime.now(timezone.utc).isoformat(),
                    "source_tz": "UTC",
                    "health": "Good",
                    "category": "infrastructure",
                    "severity": "info",
                    "alert_context": f"Offline buffer event #{i+1}"
                }
                enqueue_outbox(p)
            print(f"  * Buffered 5 events in local SQLite outbox. Depth: {count_pending_outbox()}")
            print("  * Restoring connection and flushing outbox...")
            set_simulate_outage(False)
            svc = AgentService()
            flushed = svc.flush_outbox()
            print(f"  * Successfully flushed {flushed} events to Cloud. Outbox Depth: {count_pending_outbox()}")

    print("\n[+] Replay complete. View live updates in browser: http://localhost:3000/cloud/dashboard\n")

if __name__ == "__main__":
    main()
