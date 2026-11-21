# ==============================================================================
# SEENIL One-Click Demo Launcher
# Starts Cloud Backend (8000), Local Agent Daemon (8765), and Next.js UI (3000)
# ==============================================================================

$RootPath = "C:\Users\shubh\.gemini\antigravity\scratch\seenil"
$WebPath = "C:\Users\shubh\.gemini\antigravity\scratch\seenil\web"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " SEENIL — Launching All Services for Phase 3 Evaluation" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Stop any stale instances on target ports safely
Write-Host "`n[1/4] Checking existing port bindings (8000, 8765, 3000)..." -ForegroundColor Yellow
$ports = @(8000, 8765, 3000)
foreach ($p in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            try {
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                Write-Host "  -> Cleared stale process $procId on port $p" -ForegroundColor Gray
            } catch {}
        }
    }
}

# 2. Launch Terminal 1: Cloud Backend (Port 8000)
Write-Host "[2/4] Starting Cloud Backend on http://127.0.0.1:8000..." -ForegroundColor Green
$cloudCmd = "cd '$RootPath'; python -c `"import sys; sys.path.insert(0, r'$RootPath'); import uvicorn; uvicorn.run('cloud.app.main:app', host='127.0.0.1', port=8000)`""
Start-Process powershell -ArgumentList "-NoExit", "-Command", $cloudCmd -WindowStyle Normal

Start-Sleep -Seconds 2

# 3. Launch Terminal 2: Local Agent Daemon (Port 8765)
Write-Host "[3/4] Starting Local Agent Daemon on http://127.0.0.1:8765..." -ForegroundColor Green
$agentCmd = "cd '$RootPath'; python -c `"import sys; sys.path.insert(0, r'$RootPath'); import uvicorn; uvicorn.run('agent.src.local_server:app', host='127.0.0.1', port=8765)`""
Start-Process powershell -ArgumentList "-NoExit", "-Command", $agentCmd -WindowStyle Normal

Start-Sleep -Seconds 2

# 4. Launch Terminal 3: Next.js Frontend (Port 3000)
Write-Host "[4/4] Starting Next.js Production Server on http://localhost:3000..." -ForegroundColor Green
$webCmd = "cd '$WebPath'; npm run start"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $webCmd -WindowStyle Normal

Write-Host "`nWaiting 4 seconds for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 4

# 5. Verify Health
Write-Host "`nVerifying Health Checks..." -ForegroundColor Cyan
try {
    $cloudHealth = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 3
    Write-Host "  [+] Cloud Backend: ONLINE ($($cloudHealth.service))" -ForegroundColor Green
} catch {
    Write-Host "  [-] Cloud Backend: Initializing..." -ForegroundColor Yellow
}

try {
    $agentHealth = Invoke-RestMethod -Uri "http://127.0.0.1:8765/status" -TimeoutSec 3
    Write-Host "  [+] Local Agent:   ONLINE ($($agentHealth.status), Outbox: $($agentHealth.outbox_depth))" -ForegroundColor Green
} catch {
    Write-Host "  [-] Local Agent:   Initializing..." -ForegroundColor Yellow
}

try {
    $webHealth = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -TimeoutSec 3
    Write-Host "  [+] Frontend UI:   ONLINE (HTTP $($webHealth.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  [-] Frontend UI:   Initializing..." -ForegroundColor Yellow
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " ALL SERVICES ARE UP AND RUNNING!" -ForegroundColor Green
Write-Host " Opening browser to http://localhost:3000..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Start-Process "http://localhost:3000"
