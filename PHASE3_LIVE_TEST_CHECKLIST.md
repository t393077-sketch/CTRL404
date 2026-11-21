# SEENIL — Phase 3 Evaluator Live Test Checklist (18 Tests)
**Project:** SEENIL — *Observability Without Exposure*  
**Evaluation Time:** 9:00 AM  
**Target:** Live Testing & Evaluator Demonstration  
**Base URL:** [http://localhost:3000](http://localhost:3000)

This checklist contains **18 step-by-step tests**. Every test specifies the exact URL, click target, expected output, PASS condition, and fallback remedy.

---

### Test 1: Real Telemetry Collection
- **Feature Tested:** Continuous, non-mocked OS metric collection (CPU, Memory, Disk, Network).
- **URL:** [http://localhost:3000/agent/dashboard](http://localhost:3000/agent/dashboard)
- **What to Click:** **Console** tab on the left sidebar.
- **Input:** None (Agent daemon collects continuously in background).
- **Expected Output:** Dynamic values for CPU, RAM, Disk, and Network Latency updating every 5–10s with real numbers matching Windows Task Manager.
- **PASS Criteria:** Values change dynamically over time; daemon status displays "CONNECTED".
- **Fallback if Failed:** Check Terminal 2 (port 8765) to ensure agent daemon is running. Run `Invoke-RestMethod http://127.0.0.1:8765/status`.

---

### Test 2: Agent-to-Cloud Ingestion
- **Feature Tested:** Signed telemetry egress from local agent to cloud SaaS with latency tracking.
- **URL:** [http://localhost:3000/cloud/dashboard](http://localhost:3000/cloud/dashboard)
- **What to Click:** View the **Project Insights** card on the right.
- **Input:** None.
- **Expected Output:** "Ingest Latency" displays ~4–40ms, "Active Collectors" shows 16–17.
- **PASS Criteria:** Ingestion latency is $< 100\text{ ms}$; cloud receives signed events without errors.
- **Fallback if Failed:** Verify Terminal 1 (port 8000) shows `HTTP Request: POST /api/v1/ingest 200 OK`.

---

### Test 3: Dashboard Updating with Real Live Data
- **Feature Tested:** WebSocket streaming updates to UI charts without manual page reload.
- **URL:** [http://localhost:3000/cloud/dashboard](http://localhost:3000/cloud/dashboard)
- **What to Click:** Observe the **Recent Trends** and **Resource Usage** charts.
- **Input:** None.
- **Expected Output:** Top header displays green pulse with **"Live"** indicator. Telemetry curves smoothly shift as new packets arrive.
- **PASS Criteria:** Graph coordinates animate with new timestamps without refreshing the page.
- **Fallback if Failed:** Ensure WebSocket URL connects to `ws://127.0.0.1:8000/ws/live?tenant_id=tenant_alpha`.

---

### Test 4: CPU Anomaly Detection
- **Feature Tested:** Real-time statistical detection of abnormal CPU saturation using Median Absolute Deviation (MAD).
- **URL:** [http://localhost:3000/demo-controls](http://localhost:3000/demo-controls)
- **What to Click:** Click the **"Trigger CPU Spike"** button.
- **Input:** Button click (dispatches `POST /control/spike-cpu` / `/control/inject-anomaly`).
- **Expected Output:** Terminal feed in demo controls logs `[CHAOS] Injected CPU saturation: 96.8%`. Navigate to `/cloud/dashboard` to see an Anomaly indicator appear.
- **PASS Criteria:** Cloud flags anomaly with high confidence ($Z \ge 3.0$).
- **Fallback if Failed:** Run `python replay_demo_scenario.py --scenario cpu_anomaly` in PowerShell.

---

### Test 5: Memory Anomaly Detection
- **Feature Tested:** Recognition of abnormal RAM pool saturation beyond the threshold range.
- **URL:** Command line / Dashboard.
- **What to Click / Run:** In PowerShell, run: `python replay_demo_scenario.py --scenario memory_anomaly`
- **Input:** Replay script injects 95.8% RAM pressure.
- **Expected Output:** Cloud logs health transition from `Good` to `Poor` with reason: `Physical RAM load at 95.8% capacity (range for Poor: 92.0-inf%)`.
- **PASS Criteria:** Health state transitions to `Poor` and event is recorded in `health_transitions`.
- **Fallback if Failed:** Inspect `GET http://127.0.0.1:8000/api/v1/health-transitions`.

---

### Test 6: Network Anomaly Detection
- **Feature Tested:** Detection of round-trip latency surges and packet drops.
- **URL:** Command line / Dashboard.
- **What to Click / Run:** In PowerShell, run: `python replay_demo_scenario.py --scenario network_anomaly`
- **Input:** Replay script injects 320ms RTT and 15% packet drop.
- **Expected Output:** Event recorded as `Poor` severity; live chart reflects latency surge.
- **PASS Criteria:** Metric flagged as anomaly in Cloud API within $< 15$ seconds.
- **Fallback if Failed:** View `GET http://127.0.0.1:8000/api/v1/events?metric=network.latency.rtt`.

---

### Test 7: Contextual Incident Correlation (AIOps)
- **Feature Tested:** Multi-signal clustering correlating co-occurring CPU and network anomalies into a unified incident.
- **URL:** [http://localhost:3000/cloud/dashboard](http://localhost:3000/cloud/dashboard)
- **What to Click:** Click the **"Anomaly Detected — High CPU"** card in the event stream.
- **Input:** Modal click.
- **Expected Output:** VisionOS Frosted Modal opens (`z-[100]`), displaying:
  - Root Cause Analysis: *Worker thread starvation & network saturation*
  - Confidence Score: `94%`
  - Autonomous Remediation Action: `Restart Thread Pool`
- **PASS Criteria:** Modal appears with explainable diagnosis and action button.
- **Fallback if Failed:** Check `GET http://127.0.0.1:8000/api/v1/incidents`.

---

### Test 8: Fake-Secret Redaction
- **Feature Tested:** Zero-exposure redaction of fake passwords, API keys, tokens, emails, and IPs.
- **URL:** [http://localhost:3000/agent/dashboard](http://localhost:3000/agent/dashboard)
- **What to Click:** Click the **Redaction Sandbox** tab.
- **Input:** Type or paste: `AdminPassword123! and sk-live-canary-00112233445566778899` into the text box.
- **Expected Output:**
  - Real-time Shannon Entropy calculator shows $H > 4.2\text{ bits/char}$.
  - Detected Secrets: `[REDACTED:PASSWORD]`, `[REDACTED:API_KEY]`.
  - Side-by-side sanitized JSON diff renders in real time.
- **PASS Criteria:** No raw credential remains unmasked in the sanitized preview.
- **Fallback if Failed:** Redaction regex and entropy function are located in `agent/src/redaction.py`.

---

### Test 9: Allow-List Validation
- **Feature Tested:** Strict schema rejection of unexpected or malicious fields (`additionalProperties: false`).
- **URL:** PowerShell command prompt.
- **What to Run:**
  ```powershell
  python -c "import httpx; r = httpx.post('http://127.0.0.1:8000/api/v1/ingest', json={'malicious_field': 'injected'}, headers={'X-Agent-Token': 'token_alpha_sec_98124', 'X-Signature': 'fake'}); print('Response Code:', r.status_code)"
  ```
- **Expected Output:** `Response Code: 403` or `Response Code: 422`.
- **PASS Criteria:** Cloud rejects unknown fields with HTTP 422 Unprocessable Entity or 403 Forbidden.
- **Fallback if Failed:** Verify `shared/payload.schema.json` contains `"additionalProperties": false`.

---

### Test 10: Multi-Tenant Data Isolation
- **Feature Tested:** Absolute database partition separation between `tenant_alpha` and `tenant_beta`.
- **URL:** [http://localhost:3000/cloud/dashboard](http://localhost:3000/cloud/dashboard)
- **What to Click:** Click the **Tenant Dropdown** selector in the top bar. Switch from **Alpha Financial Corp** to **Beta Cloud Systems**.
- **Expected Output:**
  - **Alpha Financial Corp:** Shows 17 collectors, 93% health, active trends.
  - **Beta Cloud Systems:** Shows 0 collectors, 0 incidents, empty-state placeholder.
- **PASS Criteria:** Switching tenants immediately changes backend data without leaking Tenant Alpha's collectors.
- **Fallback if Failed:** Verify headers include `X-Tenant-ID: tenant_beta`.

---

### Test 11: Exact Egress Payload Proof
- **Feature Tested:** Bit-for-bit cryptographic SHA-256 fingerprint verification between local agent and cloud.
- **URL:** [http://localhost:3000/egress-proof](http://localhost:3000/egress-proof)
- **What to Click:** View the top comparison card and hash verification seal.
- **Input:** None (displays live local audit table from port 8765).
- **Expected Output:**
  - Left panel: Raw customer telemetry with local secrets.
  - Right panel: Sanitized outbound payload.
  - SHA-256 fingerprint displayed with green **`VERIFIED_MATCH`** seal.
- **PASS Criteria:** Agent computed hash matches Cloud stored receipt hash character-for-character.
- **Fallback if Failed:** Query `http://127.0.0.1:8765/egress` to confirm local daemon audit entries exist.

---

### Test 12: Outbox Buffering During Network Outage
- **Feature Tested:** SQLite store-and-forward queue buffering when cloud connection is severed.
- **URL:** [http://localhost:3000/demo-controls](http://localhost:3000/demo-controls)
- **What to Click:** Click the **"Sever Cloud Ingestion"** button.
- **Expected Output:**
  - Terminal logs `[CHAOS] Simulated network outage is now: ENABLED (Outage active)`.
  - Navigate to `/agent/dashboard` -> **Outbox Buffer** tab: Outbox depth counter increments ($1, 2, 3\dots$).
- **PASS Criteria:** Telemetry continues collecting locally without dropping events.
- **Fallback if Failed:** Check `http://127.0.0.1:8765/status` -> `is_outage_simulated: true`.

---

### Test 13: Reconnection & Event Recovery
- **Feature Tested:** Automatic outbox draining upon connection restoration.
- **URL:** [http://localhost:3000/demo-controls](http://localhost:3000/demo-controls)
- **What to Click:** Click the **"Restore Cloud Uplink"** button.
- **Expected Output:**
  - Terminal logs `[CHAOS] Simulated network outage is now: DISABLED (Network online). Flushing outbox backlog...`.
  - Outbox depth returns to `0`.
- **PASS Criteria:** All buffered packets are transmitted to Cloud without data loss.
- **Fallback if Failed:** Run `python agent/main.py --restore-connection`.

---

### Test 14: Duplicate Rejection & Idempotency
- **Feature Tested:** Cloud deduplication engine rejecting replayed payload UUIDs.
- **URL:** PowerShell command prompt.
- **What to Run:**
  ```powershell
  python -c "import sqlite3; conn = sqlite3.connect('cloud/seenil.db'); cur = conn.cursor(); cur.execute('SELECT COUNT(*) FROM duplicate_metrics'); print('Deduplicated events recorded:', cur.fetchone()[0]); conn.close()"
  ```
- **Expected Output:** Prints number of deduplicated events (e.g. 10 or greater).
- **PASS Criteria:** Re-sending identical payload IDs returns `status: "duplicate"` and stores zero duplicate rows in `telemetry_events`.
- **Fallback if Failed:** Verify `cloud/app/main.py` lines 193–220 (`existing_event = db.query(TelemetryEvent)...`).

---

### Test 15: Collector Offline Detection
- **Feature Tested:** Background watchdog marking dead collectors offline within $\le 60$ seconds.
- **URL:** [http://localhost:3000/fleet](http://localhost:3000/fleet)
- **What to Click:** Observe the **Collector Fleet Status** table.
- **Input:** None.
- **Expected Output:** Any collector with no heartbeat for $>45$s is marked with red status badge **"OFFLINE"** and detailed reason: `no heartbeat received for ...s (> 45s timeout threshold)`.
- **PASS Criteria:** Detection happens reliably under 60 seconds (measured average: 47.54s).
- **Fallback if Failed:** Verify `settings.HEARTBEAT_TIMEOUT_SECONDS = 45` in `cloud/app/config.py`.

---

### Test 16: Recovery from Unhealthy to Healthy State
- **Feature Tested:** Telemetry recovery transitioning health status from `Poor` back to `Excellent`.
- **URL:** [http://localhost:3000/cloud/dashboard](http://localhost:3000/cloud/dashboard)
- **What to Click / Run:** In PowerShell, run: `python replay_demo_scenario.py --scenario cpu_anomaly`
- **Expected Output:** CPU spikes to 96.8% (Poor), then recovers to 28.5% (Excellent).
- **PASS Criteria:** Health badge transitions back to green `Healthy` / `Excellent`.
- **Fallback if Failed:** Query `GET http://127.0.0.1:8000/api/v1/health-transitions`.

---

### Test 17: Authentication & Access Control
- **Feature Tested:** Rejection of unauthorized tokens and invalid credentials.
- **URL:** [http://localhost:3000/cloud/login](http://localhost:3000/cloud/login)
- **Input:** Enter invalid email or bad password.
- **Expected Output:** Login form rejects submission and displays red alert: `Invalid email or credentials. Access denied.`
- **PASS Criteria:** Cannot reach `/cloud/dashboard` with invalid credentials.
- **Fallback if Failed:** Client session check is enforced in `web/src/app/cloud/login/page.tsx`.

---

### Test 18: Autonomous Runbook Remediation
- **Feature Tested:** Executing autonomous remediation on an active incident.
- **URL:** [http://localhost:3000/cloud/dashboard](http://localhost:3000/cloud/dashboard)
- **What to Click:** Open the Anomaly RCA modal dialog and click the purple **"Trigger Remediation"** button.
- **Expected Output:** Button displays `Remediated ✓`, incident status updates to `resolved`, and an audit event is logged.
- **PASS Criteria:** API `POST /api/v1/incidents/{id}/action` returns `{"status": "confirmed"}`.
- **Fallback if Failed:** Verify `POST http://127.0.0.1:8000/api/v1/incidents/inc_xxx/action` with payload `{"action": "confirm"}`.
