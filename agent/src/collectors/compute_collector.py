import time
import psutil
from typing import List, Dict, Any

def collect_compute_metrics() -> List[Dict[str, Any]]:
    """
    Collects real Compute telemetry from the host operating system:
    - CPU utilization (%)
    - CPU logical core count
    - RAM utilization (%)
    - Available memory (MB)
    - Running process count
    - System uptime (seconds)
    """
    metrics = []

    # 1. CPU Utilization (%)
    try:
        cpu_pct = psutil.cpu_percent(interval=None)
        metrics.append({
            "metric": "system.cpu.utilization",
            "value": round(float(cpu_pct), 2),
            "category": "compute",
            "alert_context": f"Host CPU load at {cpu_pct:.1f}%"
        })
    except Exception:
        pass

    # 2. CPU Core Count
    try:
        core_count = psutil.cpu_count(logical=True) or 1
        metrics.append({
            "metric": "system.cpu.cores",
            "value": float(core_count),
            "category": "compute",
            "alert_context": f"Host compute core allocation: {core_count} logical cores"
        })
    except Exception:
        pass

    # 3. RAM Utilization (%) & Available Memory (MB)
    try:
        mem = psutil.virtual_memory()
        metrics.append({
            "metric": "system.memory.utilization",
            "value": round(float(mem.percent), 2),
            "category": "compute",
            "alert_context": f"Physical RAM utilization at {mem.percent:.1f}%"
        })
        available_mb = round(mem.available / (1024 * 1024), 2)
        metrics.append({
            "metric": "system.memory.available_mb",
            "value": float(available_mb),
            "category": "compute",
            "alert_context": f"Available physical memory: {available_mb:.1f} MB"
        })
    except Exception:
        pass

    # 4. Running Processes
    try:
        proc_count = len(psutil.pids())
        metrics.append({
            "metric": "system.load.processes",
            "value": float(proc_count),
            "category": "compute",
            "alert_context": f"Active running processes on host: {proc_count}"
        })
    except Exception:
        pass

    # 5. System Uptime (seconds)
    try:
        uptime = round(time.time() - psutil.boot_time(), 1)
        metrics.append({
            "metric": "system.uptime.seconds",
            "value": float(uptime),
            "category": "compute",
            "alert_context": f"System uptime: {int(uptime)} seconds ({round(uptime/3600, 1)} hours)"
        })
    except Exception:
        pass

    return metrics
