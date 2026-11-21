import uuid
import time
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from .config import agent_settings
from .pseudonymizer import get_pseudonymous_source_id
from .redaction import redact_text
from .collectors.host_metrics import collect_host_metrics
from .collectors.network_probe import probe_network_latency
from .collectors.compute_collector import collect_compute_metrics
from .collectors.network_collector import collect_network_metrics
from .collectors.storage_collector import collect_storage_metrics
from .collectors.database_collector import collect_database_metrics
from .collectors.system_health_collector import collect_system_health_metrics, update_transmission_status
from .collectors.log_tailer import LogTailer
from .storage.db import init_agent_storage
from .storage.outbox import enqueue_outbox, fetch_pending_outbox, mark_outbox_sent, record_outbox_failure, count_pending_outbox
from .storage.audit_log import record_audit_entry
from .transport import send_payload_to_cloud, send_heartbeat_to_cloud

logger = logging.getLogger("seenil.agent_service")

class AgentService:
    def __init__(self):
        init_agent_storage()
        self.source_id = get_pseudonymous_source_id()
        self.log_tailer = LogTailer(agent_settings.WATCH_LOG_PATH)
        self.last_heartbeat_time = 0.0

    def calculate_health_state(self, metric: str, value: float) -> str:
        """Local health state evaluator (Excellent, Good, Fair, Poor)"""
        if "cpu" in metric or "memory" in metric or "disk" in metric:
            if value < 50.0:
                return "Excellent"
            elif value < 75.0:
                return "Good"
            elif value < 90.0:
                return "Fair"
            return "Poor"
        elif "latency" in metric:
            if value < 50.0:
                return "Excellent"
            elif value < 120.0:
                return "Good"
            elif value < 250.0:
                return "Fair"
            return "Poor"
        elif "failed_logins" in metric:
            if value < 1:
                return "Excellent"
            elif value < 3:
                return "Good"
            elif value < 6:
                return "Fair"
            return "Poor"
        return "Good"

    def process_telemetry_cycle(self) -> List[Dict[str, Any]]:
        """
        Runs one full collection, redaction, audit, and egress cycle.
        """
        raw_items: List[Dict[str, Any]] = []

        # 1. Real 5-Category Collectors (Compute, Network, Storage, Database, System Health)
        raw_items.extend(collect_compute_metrics())
        raw_items.extend(collect_network_metrics())
        raw_items.extend(collect_storage_metrics())
        raw_items.extend(collect_database_metrics())
        raw_items.extend(collect_system_health_metrics())
        raw_items.extend(self.log_tailer.process_new_lines())

        processed_events = []

        # 2. Process each item: Redact -> Construct allow-listed payload -> Audit -> Egress/Buffer
        for item in raw_items:
            payload_id = str(uuid.uuid4())
            raw_context = item.get("alert_context", "")

            # Apply strict redaction (regex + Shannon entropy)
            redacted_context, was_redacted = redact_text(raw_context)

            health = self.calculate_health_state(item["metric"], float(item["value"]))
            severity = item.get("severity", "warning" if health in ["Fair", "Poor"] else "info")
            item_event_time = datetime.now(timezone.utc).isoformat()

            # Strictly adhere to /shared/payload.schema.json
            payload = {
                "payload_id": payload_id,
                "tenant_id": agent_settings.TENANT_ID,
                "source_id": self.source_id,
                "metric": item["metric"],
                "value": float(item["value"]),
                "event_time_utc": item_event_time,
                "source_tz": agent_settings.SOURCE_TZ,
                "health": health,
                "category": item["category"],
                "severity": severity,
                "alert_context": redacted_context
            }

            # 3. Try Sending to Cloud
            success, code, msg = send_payload_to_cloud(payload)
            update_transmission_status(success)

            if success:
                egress_status = "egressed"
                record_audit_entry(
                    payload_id=payload_id,
                    metric=item["metric"],
                    raw_input=raw_context,
                    redacted_payload=payload,
                    egress_status=egress_status
                )
                logger.info(f"[Egress] {item['metric']}={item['value']} sent (HTTP {code})")
            else:
                # 4. Outbox buffering on network failure
                egress_status = "buffered_outbox"
                enqueue_outbox(payload)
                record_audit_entry(
                    payload_id=payload_id,
                    metric=item["metric"],
                    raw_input=raw_context,
                    redacted_payload=payload,
                    egress_status=egress_status
                )
                logger.warning(f"[Outbox Buffered] {item['metric']} saved to local SQLite: {msg}")

            processed_events.append({
                "payload": payload,
                "success": success,
                "egress_status": egress_status,
                "raw_input": raw_context
            })

        # 5. Flush any pending backlog if connection is online
        self.flush_outbox()

        # 6. Check Heartbeat
        self.check_heartbeat()

        return processed_events

    def flush_outbox(self, max_batch: int = 20) -> int:
        """
        Attempts to replay pending outbox items strictly in FIFO order.
        Uses original payload_id so Cloud deduplicates if already received.
        """
        pending = fetch_pending_outbox(limit=max_batch)
        if not pending:
            return 0

        flushed = 0
        for item in pending:
            payload = item["payload"]
            success, code, msg = send_payload_to_cloud(payload)
            if success:
                mark_outbox_sent(item["payload_id"])
                flushed += 1
                logger.info(f"[Outbox Flushed] Replayed payload {item['payload_id']} (HTTP {code})")
            else:
                record_outbox_failure(item["payload_id"])
                logger.warning(f"[Outbox Retry Failed] {item['payload_id']}: {msg}")
                # Stop flushing on consecutive failure to honor backoff
                break

        return flushed

    def check_heartbeat(self):
        """Sends heartbeat every 10s"""
        now = time.time()
        if (now - self.last_heartbeat_time) >= agent_settings.HEARTBEAT_INTERVAL_SECONDS:
            res_usage = collect_host_metrics()
            summary = {m["metric"]: m["value"] for m in res_usage}
            sent = send_heartbeat_to_cloud(self.source_id, resource_usage=summary)
            if sent:
                self.last_heartbeat_time = now
                logger.info(f"[Heartbeat] Sent successfully for {self.source_id}")
