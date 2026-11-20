# SEENIL — Phase 2 Technical Plan
**Team CTRL404 (Team No. 64) · CICADA 2026 · Atria Institute of Technology**  
*Members: Shubham Rathore (Team Lead), Niranjan, Prerana R K, Adya Jha (RNSIT)*

---

## 1. Project Idea / What We're Building
**SEENIL** (*"See everything. Leave nothing."*) is a defense-grade, two-tier AIOps observability platform built for strict zero-trust enterprise and defense environments. 

Traditional APMs ship raw traces, unparsed logs, and configuration dumps to the cloud—inevitably leaking API keys, database credentials, PII, and customer payloads. SEENIL guarantees **zero egress data leakage** by physically decoupling data collection from analysis:
- **Tier 1 (Local Lens Agent)** sits inside the customer’s private VPC or on-prem perimeter. It captures raw infrastructure, network, and application telemetry, scrubs passwords and tokens using combined Shannon entropy and deterministic regex filters, computes local summaries, and verifies payloads against an uncompromising allow-list schema. **Raw logs, secrets, and environment dumps never leave the local environment.**
- **Tier 2 (Central SaaS Cloud)** receives strictly sanitized metadata (metric values, UTC timestamps, pseudonymous source IDs, categorical severity, and concise alert context). It executes multi-tenant ingestion, enforces Row Level Security (RLS), calculates dynamic rolling **Median Absolute Deviation (MAD)** baselines, correlates cross-signal incidents, generates explainable root-cause paths, and orchestrates policy-approved autonomous remediation.

---

## 2. Architecture (What Happens Locally vs. Cloud)

```
┌────────────────────────────────────────────────────────┐
│  TIER 1: CUSTOMER ENVIRONMENT (LOCAL AGENT)            │
│                                                        │
│  [Host OS: psutil]   [Network: Ping RTT]   [Auth Logs] │
│          │                   │                  │      │
│          ▼                   ▼                  ▼      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Local Zero-Trust Redaction Engine                │  │
│  │ (Regex Masks + Shannon Entropy > 3.8 bits/char)  │  │
│  └──────────────────────────┬───────────────────────┘  │
│                             ▼                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Local Audit SQLite (Raw vs Sent + SHA-256 Hash)  │  │
│  │ -> Stays permanently local for Egress Proof      │  │
│  └──────────────────────────┬───────────────────────┘  │
│                             ▼                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Local SQLite Outbox Buffer (FIFO Queue)          │  │
│  │ -> Guarantees zero-loss delivery during outages  │  │
│  └──────────────────────────┬───────────────────────┘  │
│                             ▼                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Pre-Egress Schema Gate (payload.schema.json)     │  │
│  │ -> Rejects any unknown or extra fields           │  │
│  └──────────────────────────┬───────────────────────┘  │
└─────────────────────────────┼──────────────────────────┘
                              │
             === CRYPTOGRAPHIC TRUST BOUNDARY ===
               (Allow-Listed Metadata Only)
               (HMAC-SHA256 Signed + Token)
                              │
┌─────────────────────────────┼──────────────────────────┐
│  TIER 2: CENTRAL SAAS CLOUD │                          │
│                             ▼                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Ingest Gateway & HMAC Verifier                   │  │
│  │ -> Derives tenant from token; verifies signature │  │
│  └──────────────────────────┬───────────────────────┘  │
│                             ▼                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Idempotency Filter (UUID Deduplication)          │  │
│  │ -> Drops replays with 200 OK; 0 duplicates stored│  │
│  └──────────────────────────┬───────────────────────┘  │
│                             ▼                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Multi-Tenant Database (PostgreSQL RLS / SQLite)  │  │
│  │ -> Stores event_time_utc separate from received  │  │
│  └──────────────────────────┬───────────────────────┘  │
│                             ▼                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ AIOps Engine (MAD Baselines + Correlator)        │  │
│  │ -> Dynamic z-score anomalies & 60s signal cluster│  │
│  └──────────────────────────┬───────────────────────┘  │
│                             ▼                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Next.js SOC Command Center & Live WebSocket      │  │
│  │ -> p95 Latency, Egress Proof, Autonomous Ops     │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons, Obsidian Glassmorphic HUD theme (`#02040A`), native SVG vector waveforms, WebSocket client (`/ws/live`).
- **Backend**: FastAPI (Python 3.12/3.14), Uvicorn, Pydantic v2, Starlette CORS, WebSockets, Python `asyncio`.
- **Database**: 
  - *Cloud Tier*: Dual-engine architecture: Native PostgreSQL 16 with Row-Level Security (`app.current_tenant_id`) and automated instant fallback to SQLite (`seenil.db`) with application-enforced tenant boundaries.
  - *Agent Tier*: Local embedded SQLite in WAL (Write-Ahead Logging) mode for FIFO Outbox buffering and local Audit Log storage.
- **Collector (Agent)**: Python daemon, `psutil` (hardware telemetry), raw socket ICMP/TCP handshake probes, sliding-window log tailer with regex pattern matching.
- **APIs / Libraries**: 
  - `jsonschema` (strict allow-list enforcement)
  - `hmac` & `hashlib` (HMAC-SHA256 signing and SHA-256 hash chaining)
  - `math` & custom MAD baseline statistical engine
- **Deployment**: Local native processes for hackathon demo; containerized Docker & Docker Compose setup ready for cloud deployment.

---

## 4. Telemetry We're Collecting

| Metric Identifier | Category | Unit / Format | Sampling Rate | Description |
| :--- | :--- | :--- | :--- | :--- |
| `system_cpu_percent` | Infrastructure | % (0.0 – 100.0) | 5 seconds | Host aggregate CPU utilization |
| `system_memory_percent` | Infrastructure | % (0.0 – 100.0) | 5 seconds | RAM memory load |
| `system_disk_percent` | Infrastructure | % (0.0 – 100.0) | 15 seconds | Storage partition saturation |
| `network_rtt_ms` | Network | Milliseconds (float) | 5 seconds | Real socket round-trip latency to edge gateway |
| `network_packet_loss` | Network | % (0.0 – 100.0) | 5 seconds | Synthetic probe packet drop percentage |
| `failed_logins_rate` | Security | Integer count / min | Sliding window | Summarized failed authentication count (5+ within 60s) |
| `canary_secret_intercepted` | Security | 0 or 1 flag | Event-driven | Indicator of secret intercepted and scrubbed by local agent |

---

## 5. Data Source
- **Primary Source (Live Hackathon Demo)**: **100% Real Live Telemetry** captured directly from the host system via `psutil`, live network socket probes against active endpoints, and a real log file watcher monitoring authentication events.
- **Simulated Chaos Stream**: Interactive one-click CLI/API chaos flags for live judge evaluations:
  - `--inject-secret`: Appends synthetic canary credentials into the monitored log to prove zero-leak redaction.
  - `--kill-connection`: Simulates complete network severance to demonstrate local SQLite outbox buffering.
  - `--restore-connection`: Re-establishes network connectivity and flushes the outbox with zero loss and zero duplicates.
- **Organizer Stream Readiness**: Built with a pluggable adapter pattern (`TelemetryAdapter` interface). When the hackathon organizers release the official simulated telemetry stream/endpoint, it drops directly into the collector with zero rework required.

---

## 6. Security & Privacy Plan

1. **Shannon Entropy + Regex Redaction**:
   - Every raw log line is scanned against deterministic regex masks covering passwords, API keys (`sk-...`, Bearer tokens), JWTs, credit card numbers, IPv4/IPv6 addresses, and emails.
   - Text chunks with high Shannon entropy ($H > 3.8\text{ bits/char}$) are flagged as potential unmasked cryptographic secrets and replaced with `[REDACTED:HIGH_ENTROPY]`.
2. **Strict Pre-Egress Allow-Listing**:
   - Every event is validated against `payload.schema.json` with `"additionalProperties": false`. If an engineer or compromised process attempts to attach an unauthorized field (e.g. `raw_query`, `user_password`), the agent drops the packet locally and writes a security violation event.
3. **Pseudonymous Source IDs**:
   - Real hostnames and MAC addresses never leave the customer machine. The agent computes:
     $$\text{source\_id} = \text{"node\_"} + \text{HMAC-SHA256}(\text{site\_secret}, \text{hostname})[:12]$$
4. **Cryptographic Egress Proof**:
   - The agent maintains an immutable local SQLite table recording: `timestamp`, `metric`, `raw_input`, `redacted_payload`, and `payload_sha256`.
   - Judges can inspect this side-by-side: proving that the canary password existed in local raw memory but arrived in the SaaS cloud as `[REDACTED:PASSWORD]`.
5. **Multi-Tenant Row-Level Security (RLS)**:
   - Tenant identity is derived purely from the agent's authentication token on the server side—never trusted from the payload body. Database sessions set `app.current_tenant_id = :tenant_id`, guaranteeing cross-tenant data leaks are mathematically impossible at the database engine level.

---

## 7. AIOps / Anomaly Detection Logic

Static threshold alerting fails in dynamic production environments. SEENIL combines static safety limits with dynamic **Median Absolute Deviation (MAD)** statistical baselines:
1. **Dynamic Rolling Baselines**:
   - For every metric stream $(tenant, source, metric)$, the cloud engine maintains a rolling 60-sample window.
   - Unlike standard deviation (which is easily corrupted by historical spikes), MAD computes:
     $$\text{Median} = \tilde{X} = \text{median}(X)$$
     $$\text{MAD} = \text{median}(|X_i - \tilde{X}|)$$
     $$\text{Modified Z-Score } M_i = \frac{0.6745 \cdot (X_i - \tilde{X})}{\text{MAD}}$$
   - Any telemetry event with $|M_i| > 3.0$ is flagged as a statistical anomaly with an assigned confidence score ($50\% - 99\%$).
2. **Four Health States & State Machine**:
   - States: **Excellent**, **Good**, **Fair**, **Poor**.
   - Every single health transition stores the explicit mathematical reason (e.g. `system_cpu_percent value 92.4% breached Fair threshold > 80%`).
3. **Stale Data Auto-Downgrade**:
   - If a source stops transmitting for $>30$ seconds, SEENIL automatically downgrades its health state to Fair or Poor rather than falsely displaying stale data as "healthy".

---

## 8. Alert Correlation & Autonomous Recommendations

1. **Multi-Signal Sliding Window Clustering**:
   - Isolated threshold alerts cause alert fatigue. SEENIL’s correlator clusters concurrent anomalies occurring across the infrastructure within a 60-second sliding time window into a single unified **Incident**.
   - *Example*: A spike in `failed_logins_rate` + CPU saturation on auth-proxy + canary secret intercepted $\longrightarrow$ Clustered into Incident `inc_sec_8901`: *"Brute-Force Auth Spike & Rogue Token Canary Detected"*.
2. **Explainable Root Cause Diagnostics**:
   - The diagnosis is synthesized purely from allow-listed metadata (preserving the zero-leak trust boundary). It delivers human-readable root-cause reasoning explaining why the incident occurred and which metric was the initial lead indicator.
3. **Simulated Autonomous Remediation Pipeline**:
   - **Policy Check**: Matches incident against pre-approved enterprise runbooks (e.g. `POLICY-SEC-AUTONOMOUS-01`).
   - **Operator Approval**: 1-click execution from the AIOps War Room.
   - **Cryptographic Audit Log**: Computes SHA-256 hash chaining:
     $$\text{Execution Hash} = \text{SHA-256}(\text{incident\_id} + \text{policy} + \text{operator\_id} + \text{UTC timestamp})$$
   - **Rollback Safety**: Automatically creates a configuration snapshot ID (e.g. `snap_a11d32`) before applying simulated mitigation.

---

## 9. Failure Handling (Outages, Retries, Duplicates)

1. **Local Outbox Buffering**:
   - If network connectivity drops or SEENIL Cloud returns HTTP 5xx / connection timeout, the agent catches the failure and commits the signed event into a local SQLite FIFO queue (`outbox.db`).
2. **Exponential Backoff & Order Preservation**:
   - When connection is restored, a background worker flushes the outbox in strict chronological order using the original `payload_id` and original `event_time_utc`.
3. **Idempotent Delivery (Zero Duplicates)**:
   - Every event has a unique UUID `payload_id`. The cloud database enforces a `UNIQUE` constraint on `payload_id`.
   - If an event is retransmitted post-outage, SEENIL Cloud detects the collision, increments a duplicate counter in `duplicate_metrics`, and returns `HTTP 200 OK` without inserting a second row.
4. **Offline Silence Detection ($\le 60\text{s}$)**:
   - Agents emit heartbeats every 10 seconds. Cloud runs an asynchronous monitor every 10 seconds: if `now - last_heartbeat > 60s`, the node is marked **Offline** with UTC timestamp and transition reason recorded.

---

## 10. Dashboard & Features

1. **Fleet Command Center (`/fleet`)**:
   - 5 KPI capsules: System Health ($99.8\%$), Ingest p95 Latency ($18.4\text{ms}$), Zero-Leak Integrity ($100\%$), Active Hotspots, Monitored Events.
   - Interactive 2-Tier Architecture Topology Canvas showing live data packets flowing across the trust boundary.
   - Cluster Node Health grid with live CPU/RAM/Disk/RTT gauges.
   - Real-time Live Ingest Telemetry Feed sorted by `event_time_utc DESC`.
   - 24-Hour Telemetry Volume & Latency Profile with live SVG curve.
2. **AIOps Incident War Room**:
   - Live stream of correlated multi-signal incidents.
   - Deep diagnostic modal with MAD anomaly z-scores and explainable root-cause path.
   - Glowing 1-click button: *"Execute Autonomous Remediation Runbook"* with cryptographic hash verification.
3. **Egress Proof Panel (`/egress-proof`)**:
   - Side-by-side split terminal diff: Raw Local Input (stays on machine) vs. Transmitted Metadata (crossed boundary).
   - Copyable SHA-256 cryptographic signature.
   - One-click demo button: *"Inject Secret & Verify Redaction"*.
4. **Reliability & SLAs Benchmark Hub (`/reliability`)**:
   - Verified real-time performance scorecards ($\text{p95} \le 10\text{s}$, $\text{breach} \le 15\text{s}$, $\text{offline} \le 60\text{s}$).
   - Idempotent Deduplication Table proving zero duplicates on backlog replay.
   - Health State Transition history documenting the exact trigger reasons for every state change.
5. **Interactive Chaos & Simulation Toolbar**:
   - Header action buttons for live judge walkthroughs: `[ Inject Secret ]`, `[ Kill Link ]`, `[ Restore Link ]`, and `[ Sample Host ]`.

---

## 11. Team Member Responsibilities

| Member | Primary Role | Concrete Ownership & Deliverables |
| :--- | :--- | :--- |
| **Shubham Rathore** (Team Lead) | **System Architect & Cloud Lead** | Two-tier architectural design, FastAPI ingest pipeline, PostgreSQL RLS tenant isolation, HMAC signature verification, idempotency deduplication engine, and presentation delivery. |
| **Niranjan** | **Agent & Security Lead** | Local Python collector daemon, `psutil` integration, Shannon entropy detector & regex redactor, SQLite outbox queueing, local audit log, and Egress Proof verification. |
| **Prerana R K** | **AIOps & Analytics Lead** | Rolling MAD dynamic baseline engine, multi-signal sliding-window incident correlator, explainable root-cause logic, and automated remediation runbooks. |
| **Adya Jha** | **Frontend & UX Lead** | Next.js 14 command center interface, obsidian glassmorphic HUD styling, interactive Topology Canvas, WebSocket live stream integration, and SLA benchmark reporting. |

---

## 12. Things We're Unsure About / Remaining Questions Addressed

### 1. Agent / Local Collector
- **Metrics Collected**: CPU %, Memory %, Disk %, Socket RTT (ms), Packet Loss %, Failed Login Rate, Canary Interception flag.
- **Collection Method**: Standard Python libraries (`psutil` for host metrics, `socket` handshake probes for RTT, sliding window file tailer for logs). Zero third-party cloud agents.
- **Frequency**: Metrics collected every 5 seconds; heartbeats emitted every 10 seconds.
- **Raw Data Storage**: Raw data is stored **only** in local embedded SQLite (`agent_local.db`) in WAL mode. Raw data never touches the network or cloud storage.

### 2. Privacy Pipeline
- **Raw Data Collected**: OS process metrics, system resource gauges, auth log entries (`/var/log/auth.log` or local equivalent).
- **Secret Redaction**: Combined Shannon entropy calculation ($H = -\sum p_i \log_2 p_i > 3.8\text{ bits/char}$) plus deterministic regex masks for passwords, tokens, API keys, emails, and IPs, replacing matches with `[REDACTED:type]`.
- **Allow-Listing**: Pre-egress validator checks the outgoing JSON against `shared/payload.schema.json` with `"additionalProperties": false`. Packets with unknown fields are dropped locally.
- **Pseudonymous Source IDs**: Computed via $\text{HMAC-SHA256}(\text{site\_secret}, \text{hostname})[:12]$, prefixed with `node_`. Real hostnames never leave the customer network.

### 3. Authentication & Security
- **Token Management**: Unique Agent Tokens pre-seeded and provisioned per tenant (`token_alpha_sec_98124`). Stored locally in agent configuration.
- **HMAC Signing**: For every request, the agent computes $\text{HMAC-SHA256}(\text{agent\_token}, \text{raw\_json\_bytes})$ and transmits it in the `X-Signature` header alongside `X-Agent-Token`. The cloud recalculates the hash over the raw bytes before deserializing.
- **HTTPS/TLS**: Localhost HTTP/REST for hackathon demonstration with identical header-signing mechanics; production uses TLS 1.3 endpoints.

### 4. AIOps
- **Anomaly Detection**: Rolling **Median Absolute Deviation (MAD)** modified z-score ($|M_i| > 3.0$). Completely robust against historical outlier distortion.
- **Alert Correlation**: Sliding 60-second time window grouping concurrent metric breaches across related infrastructure nodes into a single incident entity.
- **Recommendation Generation**: Rule-based expert system mapping correlated anomaly signatures to pre-approved SOC policies with natural-language explainable reasoning paths based strictly on metadata.

### 5. Web UI
- **Frontend Stack**: Next.js 14 (App Router), Tailwind CSS, Lucide React icons.
- **Pages & Panels**: Fleet Command Center (`/fleet`), Egress Proof Panel (`/egress-proof`), Reliability & SLAs (`/reliability`), Access Console (`/`).
- **Live Updates**: Dual-mode: WebSocket connection (`/ws/live?tenant_id=...`) for instant event pushes with a 3-second resilient polling fallback.

### 6. Reliability
- **Local Buffering**: Embedded SQLite FIFO outbox table. If HTTP POST fails, event is written to outbox with status `pending`.
- **Retry Strategy**: Background thread polls outbox every 3 seconds with exponential backoff on consecutive failures; replays in chronological order.
- **Duplicate Handling**: Payload UUIDs are unique. Cloud database enforces unique constraints; duplicate payloads return HTTP 200 OK and increment duplicate counters without double-storing.
- **Offline Agent Handling**: Background task checks heartbeat timestamps every 10s. If delta $> 60\text{s}$, status switches to `offline` and health downgrades to `Poor` with timestamp and reason logged.

### 7. Global Readiness
- **Regional Ingestion**: Tenant metadata models support `region` tags (e.g. `ap-south-1`). Cloud database can partition data residency by regional ingest endpoints.
- **UTC & Timezones**: All events require both `event_time_utc` (ISO 8601 UTC) and `source_tz` (e.g. `Asia/Kolkata`). Ingest latency is calculated against UTC received time.
- **Out-of-Order Events**: All dashboard feeds and SQL queries enforce `ORDER BY event_time_utc DESC` rather than `received_at`, ensuring replayed backlogged events slots into their true historical position.

### 8. Team Division
- **Shubham Rathore**: Cloud Backend, Ingest API, PostgreSQL RLS, Security Verification.
- **Niranjan**: Edge Agent, Redaction Engine, Local Outbox, Egress Proof.
- **Prerana R K**: AIOps MAD Baseline, Incident Correlator, Autonomous Remediation.
- **Adya Jha**: Next.js Web UI, Command Center HUD, Interactive Topology, Reliability Hub.
