# ==============================================================================
# SEENIL Safe Demo Shutdown Script
# Terminates ONLY the processes listening on SEENIL ports (8000, 8765, 3000)
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " SEENIL — Safe Shutdown (Ports 8000, 8765, 3000)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ports = @(8000, 8765, 3000)
$stoppedAny = $false

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            try {
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "Stopping $($proc.ProcessName) (PID: $procId) on port $port..." -ForegroundColor Yellow
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                    $stoppedAny = $true
                }
            } catch {
                Write-Host "Could not terminate PID $procId ($($_.Exception.Message))" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "Port $port is already free." -ForegroundColor Gray
    }
}

if ($stoppedAny) {
    Write-Host "`nAll SEENIL background processes terminated safely." -ForegroundColor Green
} else {
    Write-Host "`nNo SEENIL services were running." -ForegroundColor Cyan
}

Write-Host "==========================================================" -ForegroundColor Cyan
