import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List
from .db import get_connection

def record_audit_entry(
    payload_id: str,
    metric: str,
    raw_input: str,
    redacted_payload: Dict[str, Any],
    egress_status: str
) -> str:
    """
    Stores an immutable entry in the Agent's local audit log.
    Powers the Egress Proof Panel by showing the side-by-side diff
    of the raw input vs redacted payload sent across the trust boundary.
    """
    conn = get_connection()
    now_utc = datetime.now(timezone.utc).isoformat()
    redacted_json = json.dumps(redacted_payload, separators=(',', ':'))
    payload_sha256 = hashlib.sha256(redacted_json.encode("utf-8")).hexdigest()

    try:
        with conn:
            conn.execute("""
                INSERT INTO egress_audit (
                    payload_id, metric, raw_input, redacted_payload, 
                    payload_sha256, egress_status, timestamp_utc
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                payload_id, metric, raw_input, redacted_json,
                payload_sha256, egress_status, now_utc
            ))
    finally:
        conn.close()

    return payload_sha256

def fetch_audit_entries(limit: int = 50) -> List[Dict[str, Any]]:
    """Returns local audit entries for proof verification"""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, payload_id, metric, raw_input, redacted_payload, payload_sha256, egress_status, timestamp_utc
            FROM egress_audit
            ORDER BY id DESC
            LIMIT ?
        """, (limit,))
        rows = cur.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()
