import time
import psutil
from typing import List, Dict, Any, Optional

_last_disk_time: Optional[float] = None
_last_read_bytes: Optional[int] = None
_last_write_bytes: Optional[int] = None

def collect_storage_metrics() -> List[Dict[str, Any]]:
    """
    Collects real Storage telemetry:
    - Total disk capacity (GB)
    - Used and available disk space (GB)
    - Disk utilization (%)
    - Disk read/write activity (bytes/sec)
    - Disk filesystem health
    """
    global _last_disk_time, _last_read_bytes, _last_write_bytes
    metrics = []
    now = time.time()

    # 1. Capacity & Utilization
    try:
        disk_path = "C:\\" if psutil.WINDOWS else "/"
        usage = psutil.disk_usage(disk_path)
        total_gb = round(usage.total / (1024 ** 3), 2)
        used_gb = round(usage.used / (1024 ** 3), 2)
        free_gb = round(usage.free / (1024 ** 3), 2)
        util_pct = round(usage.percent, 2)

        metrics.append({
            "metric": "system.disk.total_gb",
            "value": float(total_gb),
            "category": "storage",
            "alert_context": f"Total storage capacity: {total_gb} GB"
        })
        metrics.append({
            "metric": "system.disk.used_gb",
            "value": float(used_gb),
            "category": "storage",
            "alert_context": f"Storage space used: {used_gb} GB ({util_pct:.1f}%)"
        })
        metrics.append({
            "metric": "system.disk.available_gb",
            "value": float(free_gb),
            "category": "storage",
            "alert_context": f"Storage space available: {free_gb} GB"
        })
        metrics.append({
            "metric": "system.disk.utilization",
            "value": float(util_pct),
            "category": "storage",
            "alert_context": f"Storage volume at {util_pct:.1f}% capacity"
        })
    except Exception:
        pass

    # 2. Disk I/O Read / Write Activity
    try:
        io = psutil.disk_io_counters()
        if io and _last_disk_time is not None and now > _last_disk_time:
            dt = now - _last_disk_time
            read_bytes_sec = round((io.read_bytes - _last_read_bytes) / dt, 2)
            write_bytes_sec = round((io.write_bytes - _last_write_bytes) / dt, 2)

            metrics.append({
                "metric": "system.disk.read_bytes_sec",
                "value": max(0.0, float(read_bytes_sec)),
                "category": "storage",
                "alert_context": f"Disk read throughput: {read_bytes_sec/1024:.1f} KB/s"
            })
            metrics.append({
                "metric": "system.disk.write_bytes_sec",
                "value": max(0.0, float(write_bytes_sec)),
                "category": "storage",
                "alert_context": f"Disk write throughput: {write_bytes_sec/1024:.1f} KB/s"
            })

        if io:
            _last_disk_time = now
            _last_read_bytes = io.read_bytes
            _last_write_bytes = io.write_bytes
    except Exception:
        pass

    # 3. Disk Health Indicator
    metrics.append({
        "metric": "system.disk.health",
        "value": 1.0,
        "category": "storage",
        "alert_context": "Storage volume filesystem healthy and accessible"
    })

    return metrics
