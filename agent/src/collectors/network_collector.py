import time
import socket
import psutil
from typing import List, Dict, Any, Optional

_last_net_time: Optional[float] = None
_last_bytes_sent: Optional[int] = None
_last_bytes_recv: Optional[int] = None
_last_packets_sent: Optional[int] = None
_last_packets_recv: Optional[int] = None

def collect_network_metrics(target_host: str = "8.8.8.8", target_port: int = 53) -> List[Dict[str, Any]]:
    """
    Collects real Network telemetry:
    - Network bandwidth (upload/download bytes/sec)
    - Incoming and outgoing traffic (packets sent/recv per sec)
    - Network latency (RTT in ms)
    - Packet loss (%)
    - Network interface status (1.0 = UP, 0.0 = DOWN)
    - Connection health
    """
    global _last_net_time, _last_bytes_sent, _last_bytes_recv, _last_packets_sent, _last_packets_recv
    metrics = []
    now = time.time()

    # 1. Bandwidth and Traffic Rates (Bytes & Packets)
    try:
        net_io = psutil.net_io_counters()
        if _last_net_time is not None and now > _last_net_time:
            dt = now - _last_net_time
            bytes_sent_sec = round((net_io.bytes_sent - _last_bytes_sent) / dt, 2)
            bytes_recv_sec = round((net_io.bytes_recv - _last_bytes_recv) / dt, 2)
            pkts_sent_sec = round((net_io.packets_sent - _last_packets_sent) / dt, 2)
            pkts_recv_sec = round((net_io.packets_recv - _last_packets_recv) / dt, 2)

            metrics.append({
                "metric": "network.bandwidth.bytes_sent_sec",
                "value": max(0.0, float(bytes_sent_sec)),
                "category": "network",
                "alert_context": f"Egress bandwidth: {bytes_sent_sec/1024:.1f} KB/s"
            })
            metrics.append({
                "metric": "network.bandwidth.bytes_recv_sec",
                "value": max(0.0, float(bytes_recv_sec)),
                "category": "network",
                "alert_context": f"Ingress bandwidth: {bytes_recv_sec/1024:.1f} KB/s"
            })
            metrics.append({
                "metric": "network.packets.sent_sec",
                "value": max(0.0, float(pkts_sent_sec)),
                "category": "network",
                "alert_context": f"Packets transmitted: {pkts_sent_sec:.1f} pkts/s"
            })
            metrics.append({
                "metric": "network.packets.recv_sec",
                "value": max(0.0, float(pkts_recv_sec)),
                "category": "network",
                "alert_context": f"Packets received: {pkts_recv_sec:.1f} pkts/s"
            })

        _last_net_time = now
        _last_bytes_sent = net_io.bytes_sent
        _last_bytes_recv = net_io.bytes_recv
        _last_packets_sent = net_io.packets_sent
        _last_packets_recv = net_io.packets_recv
    except Exception:
        pass

    # 2. Network Latency (RTT) & Packet Loss
    start_t = time.perf_counter()
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1.2)
    packet_loss = 0.0
    try:
        sock.connect((target_host, target_port))
        rtt_ms = (time.perf_counter() - start_t) * 1000.0
        sock.close()
    except Exception:
        rtt_ms = 1200.0
        packet_loss = 100.0
        try:
            sock.close()
        except Exception:
            pass

    metrics.append({
        "metric": "network.latency.rtt",
        "value": round(float(rtt_ms), 2),
        "category": "network",
        "alert_context": f"Network RTT to {target_host}:{target_port} is {rtt_ms:.1f}ms"
    })
    metrics.append({
        "metric": "network.packet_loss",
        "value": round(float(packet_loss), 2),
        "category": "network",
        "alert_context": f"Packet loss rate: {packet_loss:.1f}%"
    })

    # 3. Network Interface Status & Connection Health
    try:
        stats = psutil.net_if_stats()
        # Find active non-loopback interface
        up_count = sum(1 for ifname, s in stats.items() if s.isup and "loopback" not in ifname.lower())
        status_val = 1.0 if up_count > 0 else 0.0
        metrics.append({
            "metric": "network.interface.status",
            "value": status_val,
            "category": "network",
            "alert_context": f"Physical network interfaces UP: {up_count}"
        })
        metrics.append({
            "metric": "network.connection.health",
            "value": 1.0 if packet_loss == 0.0 else 0.0,
            "category": "network",
            "alert_context": "Network connection healthy" if packet_loss == 0.0 else "Network connection degraded"
        })
    except Exception:
        pass

    return metrics
