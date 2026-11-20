import logging
from datetime import datetime, timezone, timedelta
from typing import Tuple, Dict, Any
from sqlalchemy.orm import Session
from .models import CollectorStatus, HealthTransition

logger = logging.getLogger("seenil.health_engine")

# Configurable metric thresholds
HEALTH_THRESHOLDS: Dict[str, Dict[str, Any]] = {
    "system.cpu.utilization": {
        "Excellent": (0.0, 50.0),
        "Good": (50.0, 75.0),
        "Fair": (75.0, 90.0),
        "Poor": (90.0, float("inf")),
        "unit": "%"
    },
    "system.memory.utilization": {
        "Excellent": (0.0, 60.0),
        "Good": (60.0, 80.0),
        "Fair": (80.0, 92.0),
        "Poor": (92.0, float("inf")),
        "unit": "%"
    },
    "network.latency.rtt": {
        "Excellent": (0.0, 50.0),
        "Good": (50.0, 120.0),
        "Fair": (120.0, 250.0),
        "Poor": (250.0, float("inf")),
        "unit": "ms"
    },
    "security.failed_logins": {
        "Excellent": (0.0, 0.5),
        "Good": (0.5, 2.5),
        "Fair": (2.5, 5.5),
        "Poor": (5.5, float("inf")),
        "unit": "events"
    }
}

def evaluate_metric_health(metric: str, value: float) -> Tuple[str, str]:
    """
    Evaluates metric against configurable thresholds.
    Returns: (health_state, reason_string)
    """
    cfg = HEALTH_THRESHOLDS.get(metric)
    if not cfg:
        # Default baseline heuristic if unconfigured
        if value < 50.0:
            return "Excellent", f"{metric} at {value:.1f} within normal bounds (< 50)"
        elif value < 75.0:
            return "Good", f"{metric} elevated at {value:.1f} (< 75 threshold)"
        elif value < 90.0:
            return "Fair", f"{metric} stressed at {value:.1f} (< 90 threshold)"
        else:
            return "Poor", f"{metric} critical breach at {value:.1f} (>= 90 threshold)"

    unit = cfg.get("unit", "")
    for state in ["Excellent", "Good", "Fair", "Poor"]:
        low, high = cfg[state]
        if low <= value < high:
            return state, f"{metric} is {value:.1f}{unit} (range for {state}: {low}-{high}{unit})"

    return "Poor", f"{metric} critical value {value:.1f}{unit}"

def record_health_transition_if_changed(
    db: Session,
    tenant_id: str,
    source_id: str,
    new_health: str,
    reason: str
) -> bool:
    """
    Checks previous health state for source_id.
    If changed, writes an immutable transition log with exact reason and UTC time.
    """
    collector = db.query(CollectorStatus).filter(
        CollectorStatus.tenant_id == tenant_id,
        CollectorStatus.source_id == source_id
    ).first()

    now_utc = datetime.now(timezone.utc)

    if not collector:
        # First time seeing this collector
        collector = CollectorStatus(
            tenant_id=tenant_id,
            source_id=source_id,
            status="online",
            last_heartbeat_utc=now_utc,
            config_status="healthy"
        )
        db.add(collector)
        # Log initial state
        transition = HealthTransition(
            tenant_id=tenant_id,
            source_id=source_id,
            from_health="Unknown",
            to_health=new_health,
            reason=f"Initial registration: {reason}",
            transition_time_utc=now_utc
        )
        db.add(transition)
        db.flush()
        return True

    # Check if state changed
    old_health = collector.config_status or "Unknown"
    if old_health != new_health:
        transition = HealthTransition(
            tenant_id=tenant_id,
            source_id=source_id,
            from_health=old_health,
            to_health=new_health,
            reason=reason,
            transition_time_utc=now_utc
        )
        collector.config_status = new_health
        db.add(transition)
        db.flush()
        logger.info(f"[{tenant_id}/{source_id}] Health transition: {old_health} -> {new_health} ({reason})")
        return True

    return False

def check_and_downgrade_stale_sources(db: Session, max_stale_seconds: int = 30) -> int:
    """
    Checks for sources with no new telemetry within expected window.
    Downgrades their health to prevent stale telemetry being reported as 'fine'.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=max_stale_seconds)
    stale_collectors = db.query(CollectorStatus).filter(
        CollectorStatus.status == "online",
        CollectorStatus.last_heartbeat_utc < cutoff,
        CollectorStatus.config_status != "Poor"
    ).all()

    downgraded_count = 0
    now_utc = datetime.now(timezone.utc)

    for c in stale_collectors:
        hb_time = c.last_heartbeat_utc
        if hb_time.tzinfo is None:
            hb_time = hb_time.replace(tzinfo=timezone.utc)
        delta_s = int((now_utc - hb_time).total_seconds())
        old_state = c.config_status
        new_state = "Fair" if delta_s < (max_stale_seconds * 2) else "Poor"

        if old_state != new_state:
            reason = f"Stale telemetry: no data/heartbeat for {delta_s}s (threshold >{max_stale_seconds}s)"
            transition = HealthTransition(
                tenant_id=c.tenant_id,
                source_id=c.source_id,
                from_health=old_state,
                to_health=new_state,
                reason=reason,
                transition_time_utc=now_utc
            )
            c.config_status = new_state
            db.add(transition)
            downgraded_count += 1
            logger.warning(f"[{c.tenant_id}/{c.source_id}] Auto-downgraded to {new_state} due to staleness.")

    if downgraded_count > 0:
        db.commit()

    return downgraded_count
