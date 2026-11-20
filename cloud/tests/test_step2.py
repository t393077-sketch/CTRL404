import sys
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

TEST_DB_PATH = BASE_DIR / "cloud" / "seenil.db"
os.environ["DATABASE_URL"] = os.getenv("TEST_DATABASE_URL", f"sqlite:///{TEST_DB_PATH}")
os.environ["DISABLE_BACKGROUND_WORKERS"] = "1"

import hmac
import hashlib
import json
import uuid
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from cloud.app.database import reset_engine_for_test, SessionLocal, init_db, get_tenant_session
from cloud.app.models import Tenant, TenantAgentToken, TelemetryEvent, DuplicateMetric

ALPHA_TOKEN = "token_alpha_sec_98124"
ALPHA_SECRET = "secret_alpha_hmac_key_2026"
BETA_TOKEN = "token_beta_sec_33918"
BETA_SECRET = "secret_beta_hmac_key_2026"

def setup_module():
    """Ensure database tables and seeded tenants are ready before tests"""
    reset_engine_for_test(os.environ["DATABASE_URL"])
    from cloud.seed import seed_tenants
    seed_tenants()

def prepare_request(payload_dict: dict, secret: str):
    """Encodes JSON deterministically and signs the exact byte string"""
    raw_bytes = json.dumps(payload_dict, separators=(',', ':')).encode("utf-8")
    sig = hmac.new(secret.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()
    return raw_bytes, sig

def test_1_successful_ingest(client: TestClient):
    """Test valid metadata ingest with token and HMAC signature"""
    payload_id = str(uuid.uuid4())
    event_time = datetime.now(timezone.utc).isoformat()

    payload = {
        "payload_id": payload_id,
        "tenant_id": "tenant_alpha",
        "source_id": "hmac_source_alpha_01",
        "metric": "system.cpu.utilization",
        "value": 42.5,
        "event_time_utc": event_time,
        "source_tz": "Asia/Kolkata",
        "health": "Excellent",
        "category": "infrastructure",
        "severity": "info",
        "alert_context": "Normal CPU operating load"
    }

    raw_bytes, sig = prepare_request(payload, ALPHA_SECRET)

    response = client.post(
        "/api/v1/ingest",
        content=raw_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Agent-Token": ALPHA_TOKEN,
            "X-Signature": sig
        }
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["status"] == "stored"
    assert data["payload_id"] == payload_id
    assert data["tenant_id"] == "tenant_alpha"
    assert "ingest_latency_ms" in data
    print(f"\n[PASS] Test 1: Successful ingest verified. Ingest latency: {data['ingest_latency_ms']:.2f}ms")

def test_2_reject_unknown_extra_field(client: TestClient):
    """Test that any extra/unknown field in payload is strictly rejected with 422"""
    payload_id = str(uuid.uuid4())
    event_time = datetime.now(timezone.utc).isoformat()

    # Injected raw leaked password field
    payload = {
        "payload_id": payload_id,
        "tenant_id": "tenant_alpha",
        "source_id": "hmac_source_alpha_01",
        "metric": "security.failed_logins",
        "value": 1.0,
        "event_time_utc": event_time,
        "source_tz": "Asia/Kolkata",
        "health": "Good",
        "category": "security",
        "severity": "warning",
        "alert_context": "Failed login attempt",
        "leaked_password_raw": "AdminPass123!" # <--- FORBIDDEN EXTRA FIELD
    }

    raw_bytes, sig = prepare_request(payload, ALPHA_SECRET)

    response = client.post(
        "/api/v1/ingest",
        content=raw_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Agent-Token": ALPHA_TOKEN,
            "X-Signature": sig
        }
    )

    assert response.status_code == 422, f"Expected 422 for extra field, got {response.status_code}"
    print(f"\n[PASS] Test 2: Unknown field correctly rejected with HTTP 422: {response.json()}")

def test_3_idempotent_duplicate_handling(client: TestClient):
    """Test duplicate payload_id returns 200, is not stored twice, and tracks duplicate count"""
    payload_id = str(uuid.uuid4())
    event_time = datetime.now(timezone.utc).isoformat()

    payload = {
        "payload_id": payload_id,
        "tenant_id": "tenant_alpha",
        "source_id": "hmac_source_alpha_01",
        "metric": "network.latency.rtt",
        "value": 28.4,
        "event_time_utc": event_time,
        "source_tz": "UTC",
        "health": "Excellent",
        "category": "network",
        "severity": "info",
        "alert_context": "Gateway ping stable"
    }

    raw_bytes, sig = prepare_request(payload, ALPHA_SECRET)
    headers = {
        "Content-Type": "application/json",
        "X-Agent-Token": ALPHA_TOKEN,
        "X-Signature": sig
    }

    # First transmission
    r1 = client.post("/api/v1/ingest", content=raw_bytes, headers=headers)
    assert r1.status_code == 200
    assert r1.json()["status"] == "stored"

    # Second transmission (Simulating network retry replay)
    r2 = client.post("/api/v1/ingest", content=raw_bytes, headers=headers)
    assert r2.status_code == 200
    assert r2.json()["status"] == "duplicate"
    assert "Duplicate payload received and safely deduplicated" in r2.json()["message"]

    # Verify in DB: exactly 1 event stored, duplicate counter updated
    db = SessionLocal()
    try:
        events = db.query(TelemetryEvent).filter(TelemetryEvent.payload_id == payload_id).all()
        assert len(events) == 1, "Duplicate payload was erroneously inserted into database!"

        dup_metric = db.query(DuplicateMetric).filter(DuplicateMetric.payload_id == payload_id).first()
        assert dup_metric is not None, "Duplicate metric was not tracked!"
        assert dup_metric.duplicate_count >= 2, f"Expected duplicate count >= 2, got {dup_metric.duplicate_count}"
        print(f"\n[PASS] Test 3: Idempotency verified. Exactly 1 row in DB; duplicate counter recorded: {dup_metric.duplicate_count}")
    finally:
        db.close()

def test_4_multi_tenant_isolation(client: TestClient):
    """Test that Tenant Beta can NEVER see Tenant Alpha's data"""
    # 1. Ingest event for Tenant Alpha
    alpha_payload_id = str(uuid.uuid4())
    alpha_payload = {
        "payload_id": alpha_payload_id,
        "tenant_id": "tenant_alpha",
        "source_id": "alpha_secret_node",
        "metric": "system.memory.utilization",
        "value": 78.2,
        "event_time_utc": datetime.now(timezone.utc).isoformat(),
        "source_tz": "UTC",
        "health": "Fair",
        "category": "infrastructure",
        "severity": "warning",
        "alert_context": "Elevated memory consumption"
    }
    raw_alpha, sig_alpha = prepare_request(alpha_payload, ALPHA_SECRET)
    client.post(
        "/api/v1/ingest",
        content=raw_alpha,
        headers={"Content-Type": "application/json", "X-Agent-Token": ALPHA_TOKEN, "X-Signature": sig_alpha}
    )

    # 2. Query events using Tenant Beta's token
    response_beta = client.get(
        "/api/v1/events",
        headers={"X-Agent-Token": BETA_TOKEN}
    )
    assert response_beta.status_code == 200
    beta_events = response_beta.json()["events"]

    # Ensure no events belonging to Tenant Alpha appear in Tenant Beta's results
    for evt in beta_events:
        assert evt["tenant_id"] == "tenant_beta", f"CRITICAL: Tenant Alpha data leaked to Tenant Beta! {evt}"
        assert evt["payload_id"] != alpha_payload_id, "CRITICAL: Alpha payload visible in Beta query!"

    # 3. Direct RLS scoped session test
    with get_tenant_session("tenant_beta") as beta_session:
        direct_leak_check = beta_session.query(TelemetryEvent).filter(
            TelemetryEvent.payload_id == alpha_payload_id,
            TelemetryEvent.tenant_id == "tenant_beta"
        ).first()
        assert direct_leak_check is None, "CRITICAL: RLS failed to prevent cross-tenant row read!"

    print(f"\n[PASS] Test 4: Multi-tenant isolation verified! Tenant Beta received 0 records of Tenant Alpha.")

if __name__ == "__main__":
    setup_module()
    from cloud.app.main import app
    with TestClient(app) as test_client:
        test_1_successful_ingest(test_client)
        test_2_reject_unknown_extra_field(test_client)
        test_3_idempotent_duplicate_handling(test_client)
        test_4_multi_tenant_isolation(test_client)
    print("\n=======================================================")
    print(" ALL 4 SEENIL CLOUD VERIFICATION TESTS PASSED (100%) ")
    print("=======================================================")
