# SEENIL — Phase 3 Beginner-Friendly Startup & Operations Guide
**Project:** SEENIL — *Observability Without Exposure*  
**Evaluation Time:** 9:00 AM  
**Target Environment:** Windows 11 / Windows PowerShell  
**Repository Directory:** `C:\Users\shubh\.gemini\antigravity\scratch\seenil`

---

## 1. Prerequisites (Already Installed & Ready)
Your machine already has everything required installed:
- **Python:** `3.14.0` (Located at `C:\Users\shubh\AppData\Local\Programs\Python\Python314\python.exe`)
- **Node.js:** `v24.14.1` with `npm 11.11.0`
- **Database:** Local SQLite database (`cloud/seenil.db` and `agent/src/storage/agent_local.db`) with zero external DB setup required.
- **Docker:** **NOT required.** Everything runs natively in Windows PowerShell with maximum speed.

---

## 2. Architecture & Startup Order (Why 3 Terminals?)
SEENIL consists of three independent components that work together across the trust boundary:
1. **Cloud Backend (Port 8000):** Central SaaS ingestion gateway, multi-tenant database partition, MAD statistical baseline engine, and WebSocket live streamer.
2. **Local Agent Daemon (Port 8765):** Customer Enclave daemon that collects real host metrics (CPU, RAM, disk, latency), runs the privacy redaction engine, manages the SQLite store-and-forward outbox, and exposes the local Egress Proof inspector.
3. **Frontend Dashboard (Port 3000):** Apple VisionOS frosted-glass interface providing the Gateway (`/`), Cloud Dashboard (`/cloud/dashboard`), Agent Enclave (`/agent/dashboard`), and Egress Proof Dissector (`/egress-proof`).

> [!IMPORTANT]
> **Always start the services in this exact order:**
> 1. Start **Cloud Backend** first.
> 2. Start **Local Agent Daemon** second.
> 3. Start **Frontend** third.

---

## 3. Step-by-Step Manual Startup (Copy-Paste Ready)

Open **3 separate Windows PowerShell windows** and run the respective command in each:

### 🖥️ TERMINAL 1 — Cloud Backend (Port 8000)
Run this command in your first PowerShell window:
```powershell
cd C:\Users\shubh\.gemini\antigravity\scratch\seenil
python -c "import sys; sys.path.insert(0, r'C:\Users\shubh\.gemini\antigravity\scratch\seenil'); import uvicorn; uvicorn.run('cloud.app.main:app', host='127.0.0.1', port=8000)"
```
**What Success Looks Like in Terminal 1:**
```text
INFO:     Started server process [...]
INFO:     Waiting for application startup.
INFO:     Connected to PostgreSQL / SQLite database...
INFO:     Heartbeat monitor background worker started.
INFO:     Stale telemetry monitor background worker started.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```
*Keep this terminal open.*

---

### 🖥️ TERMINAL 2 — Local Agent Daemon (Port 8765)
Run this command in your second PowerShell window:
```powershell
cd C:\Users\shubh\.gemini\antigravity\scratch\seenil
python -c "import sys; sys.path.insert(0, r'C:\Users\shubh\.gemini\antigravity\scratch\seenil'); import uvicorn; uvicorn.run('agent.src.local_server:app', host='127.0.0.1', port=8765)"
```
**What Success Looks Like in Terminal 2:**
```text
INFO:     Started server process [...]
INFO:seenil.agent.local_server:Agent daemon background collection loop started.
INFO:seenil.agent_service:[Heartbeat] Sent successfully for node_40b9c8e26f984f20
INFO:seenil.agent_service:[Egress] system.cpu.utilization=... sent (HTTP 200)
INFO:     Uvicorn running on http://127.0.0.1:8765 (Press CTRL+C to quit)
```
*Keep this terminal open.*

---

### 🖥️ TERMINAL 3 — Next.js Frontend (Port 3000)
Run this command in your third PowerShell window:
```powershell
cd C:\Users\shubh\.gemini\antigravity\scratch\seenil\web
npm run start
```
*(Alternatively, you can run `npm run dev` if you prefer development hot-reloading)*

**What Success Looks Like in Terminal 3:**
```text
> seenil-web@1.0.0 start
> next start -p 3000

▲ Next.js 14.2.5
- Local:        http://localhost:3000
- Network:      http://127.0.0.1:3000
✓ Ready in 650ms
```
*Keep this terminal open.*

---

## 4. How to Verify Health in 5 Seconds
Open a fourth PowerShell window (or run before the demo) to confirm all three services are green:
```powershell
powershell -Command "Invoke-RestMethod -Uri http://localhost:3000 -Method Head; (Invoke-RestMethod -Uri http://127.0.0.1:8000/health).service; (Invoke-RestMethod -Uri http://127.0.0.1:8765/status).status"
```
**Expected Output:**
```text
SEENIL Cloud
online
```
If both print `SEENIL Cloud` and `online`, the entire application is 100% healthy.

---

## 5. Web URLs & Login Credentials

| Page / Destination | Web URL | Credentials to Enter | Notes |
| :--- | :--- | :--- | :--- |
| **Main Gateway** | [http://localhost:3000](http://localhost:3000) | None | Displays Tier 1 vs Tier 2 selection cards. |
| **Tier 1: Customer Agent Login** | [http://localhost:3000/agent/login](http://localhost:3000/agent/login) | **Node Identifier:** `node_40b9c8e26f984f20`<br>**Secret Token:** `secret_alpha_hmac_key_2026` | Enforces local vault isolation & daemon connectivity. |
| **Tier 1: Agent Enclave Dashboard** | [http://localhost:3000/agent/dashboard](http://localhost:3000/agent/dashboard) | Pre-filled after login | 5 tabs: Console, Vault, Redaction Sandbox, Outbox Buffer, Egress Proof. |
| **Tier 2: Central Cloud Login** | [http://localhost:3000/cloud/login](http://localhost:3000/cloud/login) | **Tenant Alpha:** `admin@alpha.com` / `SeenilAdmin2026!`<br>**Tenant Beta:** `admin@beta.com` / `SeenilBeta2026!` | Connects to central multi-tenant cloud SaaS. |
| **Tier 2: Cloud Dashboard** | [http://localhost:3000/cloud/dashboard](http://localhost:3000/cloud/dashboard) | Pre-filled after login | Real-time charts, tenant switcher, RCA Anomaly modal. |
| **Zero-Knowledge Egress Proof** | [http://localhost:3000/egress-proof](http://localhost:3000/egress-proof) | None | Side-by-side local vs sanitized payload verification. |
| **Chaos Control Center** | [http://localhost:3000/demo-controls](http://localhost:3000/demo-controls) | None | Instant live buttons to trigger CPU spike, inject canary, sever network, etc. |

---

## 6. Safe Shutdown & Reset

### How to Shut Down Everything Safely:
Simply press `CTRL + C` in each of the 3 terminal windows.

Or run our dedicated shutdown script:
```powershell
.\stop_seenil_demo.ps1
```

### How to Reset Demo Data Cleanly (Without breaking anything):
If you ran chaos tests and want to restore baseline telemetry and clear temporary outbox items before the evaluation:
```powershell
cd C:\Users\shubh\.gemini\antigravity\scratch\seenil
python -c "import sqlite3; conn = sqlite3.connect('agent/src/storage/agent_local.db'); conn.execute('DELETE FROM outbox_queue'); conn.commit(); conn.close(); print('Outbox reset clean.')"
```
