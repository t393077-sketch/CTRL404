# SEENIL — Phase 3 Evaluator Live Demo Script (5 Minutes)
**Project:** SEENIL — *Observability Without Exposure*  
**Team:** CTRL404 (Team No. 64) | CICADA 2026  
**Target Duration:** Exactly 5 Minutes  
**Main URL:** [http://localhost:3000](http://localhost:3000)

---

## Pre-Demo Checklist (3 Minutes Before Evaluation)
1. Run `.\start_seenil_demo.ps1` in PowerShell.
2. Verify all three terminals are green:
   - Terminal 1: Cloud Backend (`http://127.0.0.1:8000`)
   - Terminal 2: Local Agent Daemon (`http://127.0.0.1:8765`)
   - Terminal 3: Next.js Frontend (`http://localhost:3000`)
3. Open your browser to [http://localhost:3000](http://localhost:3000).

---

## ⏱️ Minute-by-Minute Live Demo Flow

### 0:00 – 0:30 | The Core Problem & Dual-Tier Gateway
- **Where You Are:** [http://localhost:3000](http://localhost:3000) (Main Entry Gateway)
- **What You Show:** Point to the two glass cards on screen:
  - **Tier 1 (Customer Enclave / Agent):** "In traditional APM tools, raw logs and sensitive credentials leak to cloud SaaS providers."
  - **Tier 2 (Central SaaS Cloud):** "SEENIL solves this by disaggregating observability: raw telemetry stays inside the customer enclave, while the cloud SaaS receives allow-listed metadata with zero sensitive data exposure."
- **Action:** Click on the **Tier 1 (Customer Enclave)** card -> goes to `/agent/login`.

---

### 0:30 – 1:15 | Tier 1: Real Telemetry & The Privacy Redaction Engine
- **Where You Are:** `/agent/login` -> Enter Node ID `node_40b9c8e26f984f20`, Secret `secret_alpha_hmac_key_2026` -> Click **Login**.
- **Where You Are Now:** `/agent/dashboard`
- **What You Say:** "Here inside the customer enclave, our background agent collector is actively reading real CPU, RAM, disk, and network metrics from the OS using non-blocking probes."
- **Action:** Click the **Redaction Sandbox** tab.
- **What You Show:** 
  - Type or paste: `AdminUser=root password=SuperSecretPassword123! token=sk-live-canary-00112233`
  - Show the real-time **Shannon Entropy Calculation** ($H > 4.2$) and automatic detection badge: `[REDACTED:PASSWORD]`, `[REDACTED:API_KEY]`.
  - Point to the right-side diff: "Notice how raw credentials never leave this local sandbox."
- **Fallback:** If typing takes too long, click the sample button or point to the pre-filled preview.

---

### 1:15 – 2:00 | Zero-Knowledge Egress Proof & Cryptographic Integrity
- **Where You Are:** Click **Egress Proof** in the bottom floating dock -> [http://localhost:3000/egress-proof](http://localhost:3000/egress-proof)
- **What You Show:**
  - Show the side-by-side payload comparison:
    - **Left Panel (Raw Local Event):** Contains unredacted credentials stored *only* in local SQLite.
    - **Right Panel (Sanitized Wire Payload):** Allow-listed metadata with masked credentials.
  - Point to the **SHA-256 Fingerprint**: `a7040194f55efb59...` with the green **`VERIFIED_MATCH`** badge.
- **What You Say:** "Before any packet leaves this machine, the agent computes an immutable SHA-256 hash. When the cloud receives it, the hash is validated bit-for-bit. We can mathematically prove zero tampering and zero leakage."

---

### 2:00 – 3:00 | Tier 2: Central Cloud SaaS & Multi-Tenant Isolation
- **Where You Are:** Open [http://localhost:3000/cloud/dashboard](http://localhost:3000/cloud/dashboard)
- **What You Show:**
  - **Live Streaming Header:** Point to the pulsating green **"Live"** indicator: "All charts are updating via dynamic WebSockets with an average ingestion latency of just 37 milliseconds."
  - **Tenant Isolation Demo:** 
    - Click the **Tenant Dropdown** at the top right.
    - Show **Alpha Financial Corp**: 17 collectors, 93% health, active incidents.
    - Switch to **Beta Cloud Systems**: Immediately displays 0 collectors and 0 incidents.
- **What You Say:** "Tenant isolation is enforced at the PostgreSQL database partition level. Even in the SaaS cloud, Tenant B cannot observe or query Tenant A's telemetry."

---

### 3:00 – 3:45 | Contextual AIOps: MAD Anomaly Detection & Runbook Remediation
- **Where You Are:** `/cloud/dashboard`
- **What You Show:**
  - Click on the active incident card: **"Anomaly Detected — High CPU"**.
  - The frosted-glass VisionOS modal dialog opens.
- **What You Say:** 
  - "SEENIL doesn't rely on brittle static thresholds. It computes dynamic statistical baselines using Median Absolute Deviation (MAD). When CPU surged to 96.8%, its modified Z-score reached 152, triggering an anomaly in under 65 milliseconds."
  - "Notice the incident correlator: it clustered the CPU starvation with an upstream latency bottleneck into a single actionable incident."
- **Action:** Click the purple button **"Trigger Remediation"** -> Button updates to `Remediated ✓` and resolves the alert.

---

### 3:45 – 4:30 | Chaos Engineering: Outage Buffering & Zero-Loss Recovery
- **Where You Are:** Open [http://localhost:3000/demo-controls](http://localhost:3000/demo-controls)
- **What You Show:**
  - Click **"Sever Cloud Ingestion"**: Terminal logs network partition active.
  - Switch to `/agent/dashboard` -> **Outbox Buffer** tab: Show the SQLite outbox counter accumulating buffered events ($1, 2, 3\dots$).
  - Switch back to `/demo-controls` and click **"Restore Cloud Uplink"**:
  - Outbox drains to `0`, all packets deliver, and idempotency guarantees **Zero Data Loss and Zero Duplicates**.
- **What You Say:** "Even if the cloud suffers a complete network partition, local telemetry accumulates safely in SQLite. Once restored, the outbox flushes in FIFO order with full idempotency."

---

### 4:30 – 5:00 | Summary & Conclusion
- **What You Say:** 
  - "To summarize what you've seen in SEENIL:
    1. Real OS telemetry collection with zero sensitive data leaving the customer enclave.
    2. Mathematical Egress Proof with bit-for-bit SHA-256 verification.
    3. Multi-tenant database isolation.
    4. Sub-100ms statistical MAD anomaly detection and contextual incident correlation.
    5. Zero data loss during network outages."
- **Closing Statement:** "SEENIL delivers complete observability without exposure. Thank you! We are ready for any questions."

---

## 🛡️ Emergency Fallback Plan (If Anything Stalls)
1. **If a button doesn't trigger in the UI:** Open PowerShell and run:
   ```powershell
   python replay_demo_scenario.py --scenario cpu_anomaly
   ```
   This injects the scenario cleanly in 0.5s via the backend API.
2. **If a service stops unexpectedly:** Run `.\start_seenil_demo.ps1` to reboot all three services cleanly in 4 seconds.
