import sqlite3

conn = sqlite3.connect(r'cloud/seenil.db')
c = conn.cursor()
c.execute("SELECT payload_id, received_at, metric, value, ingest_latency_ms FROM telemetry_events WHERE tenant_id='tenant_alpha' ORDER BY received_at DESC LIMIT 15")
for r in c.fetchall():
    print(r)
