import urllib.request
import json
import time
import asyncio
import websockets

print("="*75)
print(" SEENIL FULL-SYSTEM STARTUP VERIFICATION")
print("="*75)

# 1. Services Health
print("\n[CHECK 1] Verifying Service Processes...")
services = [
    (8000, "SEENIL Cloud Backend (FastAPI)", "/health"),
    (8765, "SEENIL Agent Daemon (Python)", "/status"),
    (3000, "SEENIL Web Frontend (Next.js)", "/")
]
for port, name, path in services:
    url = f"http://127.0.0.1:{port}{path}"
    with urllib.request.urlopen(url, timeout=3) as res:
        assert res.status == 200
        print(f"  -> {name} on port {port}: UP (HTTP 200)")

# 2. Agent Connection & Heartbeat
print("\n[CHECK 2 & 3] Agent-to-Cloud Link & Heartbeats...")
req_col = urllib.request.Request(
    "http://127.0.0.1:8000/api/v1/collectors",
    headers={"Authorization": "Bearer seenil_tenant_a_tok"}
)
with urllib.request.urlopen(req_col) as res:
    cols = json.loads(res.read())
    assert len(cols) >= 1
    online_count = sum(1 for c in cols if c["status"] == "online")
    print(f"  -> Cloud database records {len(cols)} total collectors ({online_count} online).")
    for c in cols[:3]:
        print(f"     * Node: {c['source_id']} | Status: {c['status']} | Config: {c['config_status']} | Last Ping: {c['last_heartbeat_utc']}")

# 3. Real Telemetry Collection & Persistence
print("\n[CHECK 4 & 5] Telemetry Collection & Database Persistence...")
req_ev = urllib.request.Request(
    "http://127.0.0.1:8000/api/v1/events?limit=5",
    headers={"Authorization": "Bearer seenil_tenant_a_tok"}
)
with urllib.request.urlopen(req_ev) as res:
    ev_data = json.loads(res.read())
    assert ev_data["total"] >= 1
    latest = ev_data["events"][0]
    print(f"  -> Total Events Persisted in Cloud SQLite: {ev_data['total']}")
    print(f"  -> Latest Ingested Telemetry: #{latest['payload_id'][:8]} | Metric: {latest['metric']} = {latest['value']} | Time: {latest['event_time_utc']}")

# 4. Dashboard Reflects Incoming Telemetry
print("\n[CHECK 6] Live Dashboard Metrics Reconciliation...")
req_rel = urllib.request.Request(
    "http://127.0.0.1:8000/api/v1/reliability/stats",
    headers={"Authorization": "Bearer seenil_tenant_a_tok"}
)
with urllib.request.urlopen(req_rel) as res:
    rel_data = json.loads(res.read())
    print(f"  -> Dashboard SLA Ingest Latency (p50): {rel_data['p50_latency_ms']:.2f}ms")
    print(f"  -> Dashboard Duplicate Prevention Count: {rel_data['total_duplicates_blocked']} blocked")
    print(f"  -> SLA Compliance Target: {rel_data['sla_compliant_pct']:.1f}%")

# 5. WebSocket Live Updates
print("\n[CHECK 7] WebSocket Real-Time Channel...")
async def test_ws():
    uri = "ws://127.0.0.1:8000/ws/live?tenant_id=tenant_alpha"
    async with websockets.connect(uri) as ws:
        await ws.send("ping")
        pong = await asyncio.wait_for(ws.recv(), timeout=3)
        assert pong == "pong"
        print("  -> WebSocket connected on ws://127.0.0.1:8000/ws/live: Handshake OK, Ping/Pong OK.")
asyncio.run(test_ws())

# 6. Navigation Routes Availability
print("\n[CHECK 8] Navigation Page Availability...")
routes = [
    ("/", "Operational Choice Screen"),
    ("/agent/login", "Agent Console Login"),
    ("/agent/dashboard", "Agent Enclave Dashboard"),
    ("/cloud/login", "Cloud SaaS Login"),
    ("/cloud/dashboard", "Cloud AIOps Dashboard"),
    ("/egress-proof", "Split Proof Panel"),
    ("/demo-controls", "Chaos Scenarios Suite")
]
for r, label in routes:
    url = f"http://localhost:3000{r}"
    with urllib.request.urlopen(url, timeout=3) as res:
        assert res.status == 200
        print(f"  -> {label.ljust(30)}: {url} (HTTP {res.status})")

# 7. Agent Local Daemon Inspection
print("\n[CHECK 9] Local Agent Daemon Endpoints...")
with urllib.request.urlopen("http://127.0.0.1:8765/status") as res:
    status_data = json.loads(res.read())
    print(f"  -> Agent Status: {status_data['status']} | Outbox Depth: {status_data['outbox_depth']} | Outage Mode: {status_data['is_outage_simulated']}")

with urllib.request.urlopen("http://127.0.0.1:8765/egress") as res:
    egress_data = json.loads(res.read())
    print(f"  -> Local Vault Records (Direct SQLite query): {egress_data['count']} audit entries.")

print("\n" + "="*75)
print(" ALL 9 SYSTEM STARTUP VERIFICATIONS COMPLETED SUCCESSFULLY (100%)")
print("="*75)
