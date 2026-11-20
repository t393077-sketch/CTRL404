import sys
import time
import argparse
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agent.src.config import agent_settings
from agent.src.agent_service import AgentService
from agent.src.transport import set_simulate_outage, is_outage_simulated
from agent.src.storage.outbox import count_pending_outbox, fetch_pending_outbox
from agent.src.storage.audit_log import fetch_audit_entries

def inject_secret_into_log(secret_str: str = None):
    """Simulates a live application appending an unauthorized secret into local logs"""
    log_file = agent_settings.WATCH_LOG_PATH
    log_file.parent.mkdir(parents=True, exist_ok=True)
    
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    secret = secret_str or "AdminSecretPass123! and sk-live-canary-7788990011223344"
    line = f"{timestamp} AUTH_FAIL user=admin password={secret} token=sk-live-9922883311445566 from 192.168.1.100\n"
    
    with open(log_file, "a", encoding="utf-8") as f:
        # Write 5 failed lines to trigger rate threshold breach
        for i in range(5):
            f.write(line)
            
    print(f"[DEMO PROP] Injected 5 auth failure lines with secrets into: {log_file}")
    print(f"            Sample Line: {line.strip()}")

def main():
    parser = argparse.ArgumentParser(description="SEENIL Lens Agent (Tier 1 Local Collector)")
    parser.add_argument("--run-once", action="store_true", help="Execute single collection cycle and exit")
    parser.add_argument("--daemon", action="store_true", help="Run continuously in background daemon loop")
    parser.add_argument("--inject-secret", nargs="?", const="default", help="Inject secret into watched auth log")
    parser.add_argument("--kill-connection", action="store_true", help="Simulate SaaS network outage (buffers in outbox)")
    parser.add_argument("--restore-connection", action="store_true", help="Restore SaaS connection and flush outbox")
    parser.add_argument("--show-outbox", action="store_true", help="Display local SQLite outbox queue status")
    parser.add_argument("--show-egress-proof", action="store_true", help="Display local Egress Proof Audit Log")
    
    args = parser.parse_args()
    service = AgentService()

    if args.inject_secret:
        custom_sec = None if args.inject_secret == "default" else args.inject_secret
        inject_secret_into_log(custom_sec)

    if args.kill_connection:
        set_simulate_outage(True)
        print("[DEMO SIMULATION] Network connection to Cloud is severed. Outbox mode ACTIVE.")
        service.process_telemetry_cycle()
        print(f" -> Local Outbox Backlog Count: {count_pending_outbox()} events buffered.")
        return

    if args.restore_connection:
        set_simulate_outage(False)
        print("[DEMO SIMULATION] Network connection restored. Flushing outbox backlog...")
        flushed = service.flush_outbox()
        print(f" -> Successfully flushed {flushed} events to Cloud.")
        print(f" -> Remaining Outbox Count: {count_pending_outbox()} events.")
        return

    if args.show_outbox:
        pending = fetch_pending_outbox(10)
        print(f"\n--- LOCAL SQLITE OUTBOX ({count_pending_outbox()} items pending) ---")
        for item in pending:
            p = item["payload"]
            print(f"  [{p['payload_id']}] metric={p['metric']} value={p['value']} retries={item['retry_count']}")
        return

    if args.show_egress_proof:
        entries = fetch_audit_entries(5)
        print(f"\n--- LOCAL EGRESS PROOF AUDIT LOG (Last {len(entries)} events) ---")
        for e in entries:
            print(f"ID {e['id']} | Metric: {e['metric']} | Status: {e['egress_status']}")
            print(f"   Raw Input:        {e['raw_input']}")
            print(f"   Redacted Payload: {e['redacted_payload']}")
            print(f"   SHA-256 Hash:     {e['payload_sha256']}")
            print("-" * 60)
        return

    if args.run_once or len(sys.argv) == 1:
        print("[SEENIL AGENT] Executing single collection cycle...")
        events = service.process_telemetry_cycle()
        print(f"[SEENIL AGENT] Processed {len(events)} telemetry events.")
        for ev in events:
            p = ev["payload"]
            print(f"  - {p['metric']}={p['value']} [{p['health']}] Status: {ev['egress_status']}")
        return

    if args.daemon:
        print(f"[SEENIL AGENT] Starting daemon loop (interval={agent_settings.COLLECT_INTERVAL_SECONDS}s)...")
        try:
            while True:
                service.process_telemetry_cycle()
                time.sleep(agent_settings.COLLECT_INTERVAL_SECONDS)
        except KeyboardInterrupt:
            print("\n[SEENIL AGENT] Stopping daemon.")

if __name__ == "__main__":
    main()
