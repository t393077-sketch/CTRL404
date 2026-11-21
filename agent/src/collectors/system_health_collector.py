import time
from typing import List, Dict, Any
from ..storage.outbox import count_pending_outbox

_last_sync_time: float = time.time()
_collection_failures: int = 0
_last_transmission_status: float = 1.0

def update_transmission_status(success: bool):
    global _last_sync_time, _collection_failures, _last_transmission_status
    if success:
        _last_sync_time = time.time()
        _last_transmission_status = 1.0
    else:
        _collection_failures += 1
        _last_transmission_status = 0.0

def collect_system_health_metrics() -> List[Dict[str, Any]]:
    """
    Collects real System Health telemetry:
    - Agent heartbeat pulse
    - Collection failures
    - Telemetry transmission status
    - Local outbox buffer depth
    - Last successful synchronization
    """
    metrics = []
    buffered_count = count_pending_outbox()

    # 1. Heartbeat Pulse
    metrics.append({
        "metric": "agent.heartbeat.pulse",
        "value": 1.0,
        "category": "system_health",
        "alert_context": "Agent daemon active and transmitting"
    })

    # 2. Collection / Transmission Failures
    metrics.append({
        "metric": "agent.collection.failures",
        "value": float(_collection_failures),
        "category": "system_health",
        "alert_context": f"Total transmission/collection errors: {_collection_failures}"
    })

    # 3. Transmission Status
    metrics.append({
        "metric": "agent.transmission.status",
        "value": _last_transmission_status,
        "category": "system_health",
        "alert_context": "Telemetry transmission online" if _last_transmission_status == 1.0 else "Telemetry transmission degraded/offline"
    })

    # 4. Outbox Buffer Count
    metrics.append({
        "metric": "agent.outbox.buffered_count",
        "value": float(buffered_count),
        "category": "system_health",
        "alert_context": f"Buffered outbox depth: {buffered_count} records pending sync"
    })

    # 5. Last Sync Elapsed Seconds
    elapsed_sync = round(time.time() - _last_sync_time, 1)
    metrics.append({
        "metric": "agent.sync.elapsed_seconds",
        "value": float(elapsed_sync),
        "category": "system_health",
        "alert_context": f"Seconds since last cloud synchronization: {elapsed_sync}s"
    })

    return metrics
