import psutil
from typing import List, Dict, Any

def collect_host_metrics() -> List[Dict[str, Any]]:
    """
    Collects real OS metrics using psutil: CPU, Memory, Disk.
    """
    metrics = []

    # CPU utilization (non-blocking sampling)
    cpu_pct = psutil.cpu_percent(interval=None)
    metrics.append({
        "metric": "system.cpu.utilization",
        "value": round(float(cpu_pct), 2),
        "category": "infrastructure",
        "alert_context": f"Host CPU load at {cpu_pct:.1f}%"
    })

    # Memory utilization
    mem = psutil.virtual_memory()
    metrics.append({
        "metric": "system.memory.utilization",
        "value": round(float(mem.percent), 2),
        "category": "infrastructure",
        "alert_context": f"Physical RAM load at {mem.percent:.1f}%"
    })

    # Disk utilization
    try:
        disk_path = "C:\\" if psutil.WINDOWS else "/"
        disk = psutil.disk_usage(disk_path)
        metrics.append({
            "metric": "system.disk.utilization",
            "value": round(float(disk.percent), 2),
            "category": "infrastructure",
            "alert_context": f"Storage volume at {disk.percent:.1f}% capacity"
        })
    except Exception:
        pass

    return metrics
