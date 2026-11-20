import sqlite3
from pathlib import Path
from ..config import agent_settings

def get_connection(db_path: Path = None) -> sqlite3.Connection:
    path = db_path or agent_settings.LOCAL_DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path), timeout=10.0)
    conn.row_factory = sqlite3.Row
    # Fast WAL mode for atomic resilience and crash recovery
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn

def init_agent_storage(db_path: Path = None):
    conn = get_connection(db_path)
    try:
        with conn:
            # 1. Outbox table for offline queueing & idempotent backoff retry
            conn.execute("""
                CREATE TABLE IF NOT EXISTS outbox (
                    payload_id TEXT PRIMARY KEY,
                    payload_json TEXT NOT NULL,
                    created_at_utc TEXT NOT NULL,
                    retry_count INTEGER DEFAULT 0,
                    status TEXT DEFAULT 'pending'
                );
            """)

            # 2. Local Egress Proof Audit table (NEVER leaves the agent)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS egress_audit (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    payload_id TEXT NOT NULL,
                    metric TEXT NOT NULL,
                    raw_input TEXT NOT NULL,
                    redacted_payload TEXT NOT NULL,
                    payload_sha256 TEXT NOT NULL,
                    egress_status TEXT NOT NULL,
                    timestamp_utc TEXT NOT NULL
                );
            """)
    finally:
        conn.close()
