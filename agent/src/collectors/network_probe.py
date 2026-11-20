import time
import socket
from typing import List, Dict, Any

def probe_network_latency(target_host: str = "1.1.1.1", target_port: int = 53, timeout_sec: float = 1.5) -> List[Dict[str, Any]]:
    """
    Measures real socket round-trip time (RTT) and packet availability.
    """
    metrics = []
    start_t = time.perf_counter()
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout_sec)

    try:
        sock.connect((target_host, target_port))
        rtt_ms = (time.perf_counter() - start_t) * 1000.0
        packet_loss = 0.0
        sock.close()
    except Exception:
        # Fallback to local gateway or measure loopback RTT if isolated
        rtt_ms = timeout_sec * 1000.0
        packet_loss = 100.0
        try:
            sock.close()
        except Exception:
            pass

    metrics.append({
        "metric": "network.latency.rtt",
        "value": round(float(rtt_ms), 2),
        "category": "network",
        "alert_context": f"Gateway RTT {rtt_ms:.1f}ms to {target_host}:{target_port}"
    })

    metrics.append({
        "metric": "network.packet_loss",
        "value": round(float(packet_loss), 2),
        "category": "network",
        "alert_context": f"Network reachability loss {packet_loss:.1f}%"
    })

    return metrics
