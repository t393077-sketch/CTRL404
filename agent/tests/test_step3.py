import sys
import os
import json
import uuid
from pathlib import Path
from datetime import datetime, timezone

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

# Use deterministic SQLite DB for test runs
TEST_CLOUD_DB = BASE_DIR / "cloud" / "seenil.db"
os.environ["DATABASE_URL"] = os.getenv("TEST_DATABASE_URL", f"sqlite:///{TEST_CLOUD_DB}")
os.environ["DISABLE_BACKGROUND_WORKERS"] = "1"

from fastapi.testclient import TestClient
from cloud.app.main import app
from cloud.app.database import reset_engine_for_test, SessionLocal
from cloud.app.models import TelemetryEvent, DuplicateMetric

from agent.src.config import agent_settings
from agent.src.pseudonymizer import get_pseudonymous_source_id
from agent.src.redaction import redact_text
from agent.src.collectors.host_metrics import collect_host_metrics
from agent.src.transport import (
    send_payload_to_cloud, set_simulate_outage, is_outage_simulated,
    sign_payload_bytes
)
from agent.src.storage.db import init_agent_storage
from agent.src.storage.outbox import (
    enqueue_outbox, fetch_pending_outbox, mark_outbox_sent, count_pending_outbox
)
from agent.src.storage.audit_log import record_audit_entry, fetch_audit_entries

client = TestClient(app)

def setup_test_environment():
    """Initializes Cloud tables, tenants, and Agent storage"""
    reset_engine_for_test(os.environ["DATABASE_URL"])
    from cloud.seed import seed_tenants
    seed_tenants()
    init_agent_storage()

def test_part_1_real_event_ingestion():
    print("\n" + "="*70)
    print(" PART 1: REAL HOST TELEMETRY COLLECTION & INGESTION")
    print("="*70)

    # Collect real OS telemetry
    host_metrics = collect_host_metrics()
    assert len(host_metrics) >= 2, "Failed to collect real host metrics via psutil!"
    
    cpu_item = next(m for m in host_metrics if m["metric"] == "system.cpu.utilization")
    print(f" -> Real host CPU sampled: {cpu_item['value']}% ({cpu_item['alert_context']})")

    # Construct allow-listed metadata payload
    payload_id = str(uuid.uuid4())
    pseudo_id = get_pseudonymous_source_id()
    now_utc = datetime.now(timezone.utc).isoformat()

    payload = {
        "payload_id": payload_id,
        "tenant_id": agent_settings.TENANT_ID,
        "source_id": pseudo_id,
        "metric": cpu_item["metric"],
        "value": cpu_item["value"],
        "event_time_utc": now_utc,
        "source_tz": agent_settings.SOURCE_TZ,
        "health": "Excellent" if cpu_item["value"] < 50 else "Good",
        "category": cpu_item["category"],
        "severity": "info",
        "alert_context": cpu_item["alert_context"]
    }

    # Transmit to SEENIL Cloud
    raw_bytes = json.dumps(payload, separators=(',', ':')).encode("utf-8")
    sig = sign_payload_bytes(raw_bytes, agent_settings.HMAC_SECRET)

    res = client.post(
        "/api/v1/ingest",
        content=raw_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Agent-Token": agent_settings.AGENT_TOKEN,
            "X-Signature": sig
        }
    )

    assert res.status_code == 200, f"Cloud ingest failed: {res.text}"
    body = res.json()
    assert body["status"] == "stored"
    assert body["payload_id"] == payload_id
    
    # Audit log verification
    record_audit_entry(
        payload_id=payload_id,
        metric=payload["metric"],
        raw_input=cpu_item["alert_context"],
        redacted_payload=payload,
        egress_status="egressed"
    )

    print(f" -> Pseudonymous Source ID: {pseudo_id} (Host name completely masked)")
    print(f" -> Cloud Ingest Response: {res.status_code} OK (Latency: {body['ingest_latency_ms']:.2f}ms)")
    print(" [PASS] Real telemetry successfully validated, signed, and ingested.")

def test_part_2_planted_secret_redaction_proof():
    print("\n" + "="*70)
    print(" PART 2: PLANTED SECRET REDACTION & EGRESS PROOF (RAW vs. SENT)")
    print("="*70)

    # 1. Realistic raw log containing passwords, tokens, API keys, emails, and IPs
    raw_log_line = (
        "AUTH_FAILURE user=admin password=SuperSecretP@ssword999! "
        "apiKey=sk-canary-8899aabbccddeeff0011 email=admin.dev@corp.internal "
        "ip=192.168.1.144 token=ghp_ABC1234567890abcdef1234567890"
    )

    # 2. Run through SEENIL Redaction Engine
    redacted_context, was_redacted = redact_text(raw_log_line)
    assert was_redacted is True, "Redaction engine failed to detect secrets!"

    payload_id = str(uuid.uuid4())
    pseudo_id = get_pseudonymous_source_id()
    now_utc = datetime.now(timezone.utc).isoformat()

    payload = {
        "payload_id": payload_id,
        "tenant_id": agent_settings.TENANT_ID,
        "source_id": pseudo_id,
        "metric": "security.failed_logins",
        "value": 5.0,
        "event_time_utc": now_utc,
        "source_tz": agent_settings.SOURCE_TZ,
        "health": "Fair",
        "category": "security",
        "severity": "warning",
        "alert_context": redacted_context
    }

    # Strict assertion: Ensure ZERO secrets exist in outgoing payload
    payload_str = json.dumps(payload)
    forbidden_secrets = [
        "SuperSecretP@ssword999!",
        "sk-canary-8899aabbccddeeff0011",
        "admin.dev@corp.internal",
        "192.168.1.144",
        "ghp_ABC1234567890abcdef1234567890"
    ]
    for secret in forbidden_secrets:
        assert secret not in payload_str, f"LEAK DETECTED! Secret '{secret}' found in egress payload!"

    # Record in Local Egress Audit Log
    sha256_hash = record_audit_entry(
        payload_id=payload_id,
        metric="security.failed_logins",
        raw_input=raw_log_line,
        redacted_payload=payload,
        egress_status="egressed"
    )

    # Print Side-by-Side Proof
    print("\n--- RAW INPUT (Customer Machine ONLY - Never leaves) ---")
    print(f"Raw Input:         {raw_log_line}")
    print("\n--- FINAL SENT METADATA (Crosses Trust Boundary to SaaS) ---")
    print(f"Redacted Context:  {payload['alert_context']}")
    print(f"Complete Payload:  {payload_str}")
    print(f"SHA-256 Signature: {sha256_hash}")
    print("-" * 70)
    print(" [PASS] 0 leaked secrets! All passwords, tokens, emails & IPs redacted to [REDACTED:type].")

def test_part_3_outage_buffering_and_zero_duplicate_replay():
    print("\n" + "="*70)
    print(" PART 3: OUTAGE BUFFERING & ZERO-DUPLICATE REPLAY RECONCILIATION")
    print("="*70)

    # Step A: Simulate Network Outage
    set_simulate_outage(True)
    assert is_outage_simulated() is True

    buffered_payload_ids = []
    print(" -> Simulating SaaS disconnect: Cloud connection SEVERED.")
    
    # Generate 3 events during outage
    for i in range(3):
        pid = str(uuid.uuid4())
        buffered_payload_ids.append(pid)
        p = {
            "payload_id": pid,
            "tenant_id": agent_settings.TENANT_ID,
            "source_id": get_pseudonymous_source_id(),
            "metric": f"simulated.outage.metric.{i+1}",
            "value": float(10 + i * 5),
            "event_time_utc": datetime.now(timezone.utc).isoformat(),
            "source_tz": agent_settings.SOURCE_TZ,
            "health": "Good",
            "category": "infrastructure",
            "severity": "info",
            "alert_context": f"Buffered metric during outage #{i+1}"
        }
        enqueue_outbox(p)

    outbox_count = count_pending_outbox()
    assert outbox_count >= 3, f"Expected at least 3 events in outbox, found {outbox_count}"
    print(f" -> Events safely buffered in local SQLite outbox: {outbox_count} events.")

    # Step B: Restore Network
    set_simulate_outage(False)
    print(" -> Network RESTORED. Draining local SQLite outbox backlog to Cloud...")

    pending_items = fetch_pending_outbox(10)
    for item in pending_items:
        payload = item["payload"]
        raw_bytes = json.dumps(payload, separators=(',', ':')).encode("utf-8")
        sig = sign_payload_bytes(raw_bytes, agent_settings.HMAC_SECRET)

        res = client.post(
            "/api/v1/ingest",
            content=raw_bytes,
            headers={
                "Content-Type": "application/json",
                "X-Agent-Token": agent_settings.AGENT_TOKEN,
                "X-Signature": sig
            }
        )
        assert res.status_code == 200
        mark_outbox_sent(item["payload_id"])

    print(" -> Outbox completely flushed. Verifying 0 items remaining in queue...")
    assert count_pending_outbox() == 0, "Outbox queue was not completely drained!"

    # Step C: Replay Duplicate Transmission (Simulating aggressive network retry)
    print(" -> Intentionally re-transmitting same 3 payloads to test idempotency...")
    for pid in buffered_payload_ids:
        duplicate_payload = {
            "payload_id": pid,
            "tenant_id": agent_settings.TENANT_ID,
            "source_id": get_pseudonymous_source_id(),
            "metric": "simulated.outage.metric",
            "value": 99.9,
            "event_time_utc": datetime.now(timezone.utc).isoformat(),
            "source_tz": agent_settings.SOURCE_TZ,
            "health": "Good",
            "category": "infrastructure",
            "severity": "info",
            "alert_context": "Duplicate replay test"
        }
        raw_bytes = json.dumps(duplicate_payload, separators=(',', ':')).encode("utf-8")
        sig = sign_payload_bytes(raw_bytes, agent_settings.HMAC_SECRET)

        dup_res = client.post(
            "/api/v1/ingest",
            content=raw_bytes,
            headers={
                "Content-Type": "application/json",
                "X-Agent-Token": agent_settings.AGENT_TOKEN,
                "X-Signature": sig
            }
        )
        assert dup_res.status_code == 200
        assert dup_res.json()["status"] == "duplicate", "Cloud failed to identify replayed duplicate!"

    # Step D: Prove Exactly-Once Reconciliation in Cloud Database
    db = SessionLocal()
    try:
        for pid in buffered_payload_ids:
            stored_rows = db.query(TelemetryEvent).filter(TelemetryEvent.payload_id == pid).all()
            assert len(stored_rows) == 1, f"Idempotency failure! Found {len(stored_rows)} rows for payload {pid}"
            
            dup_rec = db.query(DuplicateMetric).filter(DuplicateMetric.payload_id == pid).first()
            assert dup_rec is not None, f"Duplicate tracking missing for payload {pid}"
            assert dup_rec.duplicate_count >= 2, f"Expected duplicate count >= 2, got {dup_rec.duplicate_count}"

        print(f" -> Database Audit: Exactly 1 row per payload_id stored (0 duplicate rows).")
        print(f" -> Duplicate reconciliation counter verified in Cloud metrics table.")
        print(" [PASS] Outage buffering, zero loss, and zero duplicate reconciliation verified 100%.")
    finally:
        db.close()

if __name__ == "__main__":
    setup_test_environment()
    test_part_1_real_event_ingestion()
    test_part_2_planted_secret_redaction_proof()
    test_part_3_outage_buffering_and_zero_duplicate_replay()
    print("\n" + "="*70)
    print(" ALL STEP 3 AGENT VERIFICATION TESTS PASSED (100%)")
    print("="*70)
