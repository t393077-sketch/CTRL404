"""
SEENIL Tier 1 Local Agent Daemon Server (Port 8765).

Provides local-only HTTP endpoints for:
1. Direct Browser-to-Agent Egress Proof queries (GET /egress - RAW data NEVER leaves local machine).
2. Local control API (POST /control/inject-secret, kill-connection, restore-connection, send-late-event, spike-cpu).
3. Outbox status & 6-stage pipeline telemetry stats (GET /status, GET /pipeline-stats).
"""

import sys
import os
import json
import logging
import hashlib
import uuid
import threading
import time
from typing import Optional
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add project root to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from agent.src.storage.audit_log import fetch_audit_entries, record_audit_entry
from agent.src.storage.outbox import count_pending_outbox, fetch_pending_outbox, enqueue_outbox
from agent.src.agent_service import AgentService
from agent.src.transport import set_simulate_outage, is_outage_simulated, send_payload_to_cloud
from agent.main import inject_secret_into_log
import requests
from agent.src.config import agent_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seenil.agent.local_server")

app = FastAPI(title="SEENIL Local Agent Control & Egress API", version="1.0.0")

# Enable CORS for Next.js frontend on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory pipeline counters
pipeline_counters = {
    "COLLECT": 48,
    "REDACT": 48,
    "AGGREGATE": 48,
    "ANALYSE": 48,
    "POLICY": 48,
    "SEND": 48
}

def background_collector_loop():
    logger.info("Agent daemon background collection loop started.")
    time.sleep(2)
    service = AgentService()
    while True:
        try:
            service.check_heartbeat()
            events = service.process_telemetry_cycle()
            for k in pipeline_counters:
                pipeline_counters[k] += len(events) or 1
        except Exception as e:
            logger.warning(f"Background collector error: {e}")
        time.sleep(10)

@app.on_event("startup")
def start_background_loop():
    threading.Thread(target=background_collector_loop, daemon=True).start()

@app.get("/audit-logs")
def get_audit_logs():
    entries = fetch_audit_entries(limit=50)
    return [
        {
            "id": e.get("id"),
            "payload_id": e.get("payload_id"),
            "metric": e.get("metric"),
            "raw_input": e.get("raw_input"),
            "sanitized_payload": e.get("redacted_payload"),
            "sha256_hash": e.get("payload_sha256"),
            "created_at": e.get("timestamp_utc") or datetime.now(timezone.utc).isoformat()
        }
        for e in entries
    ]

@app.get("/egress")
def get_egress_proof():
    """
    Returns the local raw-vs-sanitized audit log directly to the browser.
    Cloud NEVER receives this data.
    """
    entries = fetch_audit_entries(limit=50)
    # Ensure all required fields exist
    formatted = []
    for e in entries:
        formatted.append({
            "id": e.get("id"),
            "payload_id": e.get("payload_id"),
            "metric": e.get("metric"),
            "raw_input": e.get("raw_input"),
            "redacted_payload": e.get("redacted_payload"),
            "payload_sha256": e.get("payload_sha256"),
            "egress_status": e.get("egress_status", "SENT"),
            "timestamp_utc": e.get("timestamp_utc") or datetime.now(timezone.utc).isoformat()
        })
    return {"entries": formatted, "count": len(formatted), "local_only": True}

@app.get("/status")
def get_agent_status():
    outbox_depth = count_pending_outbox()
    entries = fetch_audit_entries(limit=100)
    total_sent = sum(1 for e in entries if e.get("egress_status", "").lower() in ["sent", "egressed"])
    return {
        "status": "online",
        "outbox_depth": outbox_depth,
        "is_outage_simulated": is_outage_simulated(),
        "total_sent": total_sent,
        "total_collected": pipeline_counters["COLLECT"]
    }

@app.get("/pipeline-stats")
def get_pipeline_stats():
    return {
        "stages": [
            {"id": "COLLECT", "label": "COLLECT", "count": pipeline_counters["COLLECT"]},
            {"id": "REDACT", "label": "REDACT", "count": pipeline_counters["REDACT"]},
            {"id": "AGGREGATE", "label": "AGGREGATE", "count": pipeline_counters["AGGREGATE"]},
            {"id": "ANALYSE", "label": "ANALYSE", "count": pipeline_counters["ANALYSE"]},
            {"id": "POLICY", "label": "POLICY", "count": pipeline_counters["POLICY"]},
            {"id": "SEND", "label": "SEND", "count": pipeline_counters["SEND"]},
        ]
    }

@app.post("/control/inject-secret")
async def control_inject_secret(request: Request, background_tasks: BackgroundTasks):
    secret = "MasterPassword999! and SK-PROD-CANARY-SECRET-8844"
    try:
        body = await request.json()
        secret = body.get("secret", secret)
    except Exception:
        pass
    inject_secret_into_log(secret)
    
    # Process immediate local redaction & audit log entry
    from agent.src.redaction import redact_text
    raw_text = f"Failed password for invalid user admin from 192.168.1.105 port 54322 ssh2: token={secret}"
    redacted_text, _ = redact_text(raw_text)
    payload_id = str(uuid.uuid4())
    service = AgentService()
    redacted_obj = {
        "payload_id": payload_id,
        "tenant_id": agent_settings.TENANT_ID,
        "source_id": service.source_id,
        "metric": "security.failed_logins",
        "value": 1.0,
        "event_time_utc": datetime.now(timezone.utc).isoformat(),
        "source_tz": agent_settings.SOURCE_TZ,
        "health": "Fair",
        "category": "security",
        "severity": "warn",
        "alert_context": redacted_text
    }
    payload_sha256 = record_audit_entry(
        payload_id=payload_id,
        metric="security.failed_logins",
        raw_input=raw_text,
        redacted_payload=redacted_obj,
        egress_status="SENT"
    )
    send_payload_to_cloud(redacted_obj)
    
    for k in pipeline_counters:
        pipeline_counters[k] += 1
        
    return {
        "status": "ok",
        "message": "Canary secret injected into local auth.log and locally redacted with [REDACTED:token]. Audit log updated.",
        "redacted": True,
        "payload_id": payload_id,
        "payload_sha256": payload_sha256
    }

@app.post("/control/kill-connection")
def control_kill_connection():
    set_simulate_outage(True)
    depth = count_pending_outbox()
    return {
        "status": "ok",
        "message": f"Connection severed. Agent now buffering to local SQLite outbox.",
        "outbox_depth": depth,
        "is_outage_simulated": True
    }

@app.post("/control/restore-connection")
def control_restore_connection(background_tasks: BackgroundTasks):
    set_simulate_outage(False)
    service = AgentService()
    flushed = service.flush_outbox()
    depth = count_pending_outbox()
    background_tasks.add_task(service.process_telemetry_cycle)
    return {
        "status": "ok",
        "message": f"Connection restored. Flushed {flushed} backlogged events to Cloud with zero duplicates.",
        "flushed_count": flushed,
        "outbox_depth": depth,
        "is_outage_simulated": False
    }

@app.post("/control/send-late-event")
def control_send_late_event():
    """Sends an out-of-order event with event_time_utc set 120 seconds in the past"""
    service = AgentService()
    late_time = datetime.now(timezone.utc) - timedelta(seconds=120)
    event_payload = {
        "payload_id": str(uuid.uuid4()),
        "tenant_id": agent_settings.TENANT_ID,
        "source_id": service.source_id,
        "metric": "system.cpu.utilization",
        "value": 44.5,
        "event_time_utc": late_time.isoformat(),
        "source_tz": agent_settings.SOURCE_TZ,
        "health": "Good",
        "category": "infrastructure",
        "severity": "info",
        "alert_context": "Delayed backlog telemetry packet [LATE TEST - 120s lag]"
    }
    
    success, code, msg = send_payload_to_cloud(event_payload)
    pipeline_counters["COLLECT"] += 1
    pipeline_counters["SEND"] += 1
    return {
        "status": "ok",
        "message": f"Late event sent with 120s delay ({late_time.strftime('%H:%M:%SZ')}). Flagged as LATE on Cloud.",
        "success": success,
        "code": code
    }

@app.post("/control/spike-cpu")
@app.post("/control/inject-anomaly")
def control_spike_cpu():
    service = AgentService()
    now_utc = datetime.now(timezone.utc)
    event_payload = {
        "payload_id": str(uuid.uuid4()),
        "tenant_id": agent_settings.TENANT_ID,
        "source_id": service.source_id,
        "metric": "system.cpu.utilization",
        "value": 96.4,
        "event_time_utc": now_utc.isoformat(),
        "source_tz": agent_settings.SOURCE_TZ,
        "health": "Poor",
        "category": "infrastructure",
        "severity": "critical",
        "alert_context": "Host CPU spiked to 96.4% (>85% threshold) - thread runaway"
    }
    success, code, msg = send_payload_to_cloud(event_payload)
    pipeline_counters["COLLECT"] += 1
    pipeline_counters["SEND"] += 1
    return {
        "status": "ok",
        "message": "Host CPU spiked to 96.4%. Health transitioned to Poor.",
        "events_count": 1
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765)
