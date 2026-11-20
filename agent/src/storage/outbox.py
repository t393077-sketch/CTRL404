import json
import sqlite3
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from .db import get_connection

def enqueue_outbox(payload: Dict[str, Any]) -> str:
    """Inserts an event into the local SQLite outbox queue"""
    conn = get_connection()
    payload_id = str(payload["payload_id"])
    now_utc = datetime.now(timezone.utc).isoformat()
    raw_json = json.dumps(payload, separators=(',', ':'))

    try:
        with conn:
            conn.execute("""
                INSERT OR IGNORE INTO outbox (payload_id, payload_json, created_at_utc, retry_count, status)
                VALUES (?, ?, ?, 0, 'pending')
            """, (payload_id, raw_json, now_utc))
    finally:
        conn.close()

    return payload_id

def fetch_pending_outbox(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves pending outbox items strictly in FIFO creation order"""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT payload_id, payload_json, retry_count 
            FROM outbox 
            WHERE status = 'pending'
            ORDER BY created_at_utc ASC 
            LIMIT ?
        """, (limit,))
        rows = cur.fetchall()

        items = []
        for r in rows:
            items.append({
                "payload_id": r["payload_id"],
                "payload": json.loads(r["payload_json"]),
                "retry_count": r["retry_count"]
            })
        return items
    finally:
        conn.close()

def mark_outbox_sent(payload_id: str):
    """Removes successfully ingested payload from outbox"""
    conn = get_connection()
    try:
        with conn:
            conn.execute("DELETE FROM outbox WHERE payload_id = ?", (payload_id,))
    finally:
        conn.close()

def record_outbox_failure(payload_id: str):
    """Increments retry counter on failure"""
    conn = get_connection()
    try:
        with conn:
            conn.execute("""
                UPDATE outbox 
                SET retry_count = retry_count + 1 
                WHERE payload_id = ?
            """, (payload_id,))
    finally:
        conn.close()

def count_pending_outbox() -> int:
    """Returns number of items buffered locally"""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM outbox WHERE status = 'pending'")
        return cur.fetchone()[0]
    finally:
        conn.close()
