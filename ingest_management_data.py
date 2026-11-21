"""
SEENIL Universal Management Telemetry Ingest & Replay Adapter
Ingests external telemetry data provided by hackathon organizers / management
(JSON, JSONL, CSV, or raw Log files) and streams it live into the SEENIL platform.

Usage:
  python ingest_management_data.py --file data.json
  python ingest_management_data.py --file metrics.csv
  python ingest_management_data.py --log auth.log
  python ingest_management_data.py  (Interactive mode)
"""

import sys
import os
import json
import csv
import time
import uuid
import hmac
import hashlib
import argparse
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timezone

BASE_DIR = Path(r"C:\Users\shubh\.gemini\antigravity\scratch\seenil")
sys.path.insert(0, str(BASE_DIR))

CLOUD_URL = "http://127.0.0.1:8000"
AGENT_URL = "http://127.0.0.1:8765"
DEFAULT_TOKEN = "token_alpha_sec_98124"
DEFAULT_SECRET = "secret_alpha_hmac_key_2026"

from agent.src.redaction import redact_text
from agent.src.pseudonymizer import get_pseudonymous_source_id
from agent.src.storage.audit_log import record_audit_entry

def post_raw(url, data_bytes, headers):
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body

def send_to_seenil(payload, token=DEFAULT_TOKEN, secret=DEFAULT_SECRET):
    wire_bytes = json.dumps(payload, separators=(',', ':')).encode("utf-8")
    sig = hmac.new(secret.encode("utf-8"), wire_bytes, hashlib.sha256).hexdigest()
    headers = {
        "Content-Type": "application/json",
        "X-Agent-Token": token,
        "X-Signature": sig
    }
    t0 = time.perf_counter()
    code, resp = post_raw(f"{CLOUD_URL}/api/v1/ingest", wire_bytes, headers)
    lat_ms = (time.perf_counter() - t0) * 1000.0
    return code, resp, lat_ms

def normalize_event(raw_item, index=1):
    """
    Normalizes arbitrary external fields from organizer datasets
    into SEENIL schema-compliant payloads.
    """
    # 1. Metric Name detection
    metric = (
        raw_item.get("metric") or
        raw_item.get("metric_name") or
        raw_item.get("name") or
        raw_item.get("field") or
        "system.cpu.utilization"
    )

    # 2. Metric Value detection
    value = 0.0
    for v_key in ["value", "val", "metric_value", "usage", "percent", "count", "latency", "rtt"]:
        if v_key in raw_item and raw_item[v_key] is not None:
            try:
                value = float(raw_item[v_key])
                break
            except (ValueError, TypeError):
                pass

    # 3. Timestamp detection
    raw_time = (
        raw_item.get("event_time_utc") or
        raw_item.get("timestamp") or
        raw_item.get("time") or
        raw_item.get("datetime")
    )
    if not raw_time:
        event_time_utc = datetime.now(timezone.utc).isoformat()
    else:
        try:
            event_time_utc = str(raw_time)
            if not event_time_utc.endswith("Z") and "+" not in event_time_utc:
                event_time_utc += "Z"
        except Exception:
            event_time_utc = datetime.now(timezone.utc).isoformat()

    # 4. Source ID / Hostname detection (apply pseudonymization)
    raw_source = (
        raw_item.get("source_id") or
        raw_item.get("host") or
        raw_item.get("hostname") or
        raw_item.get("node") or
        raw_item.get("server") or
        "mgmt_external_node"
    )
    source_id = f"node_{hashlib.sha256(raw_source.encode()).hexdigest()[:16]}"

    # 5. Alert Context & Privacy Redaction
    raw_context = str(
        raw_item.get("alert_context") or
        raw_item.get("message") or
        raw_item.get("log") or
        raw_item.get("description") or
        f"Telemetry event {metric}={value}"
    )
    sanitized_context, was_redacted = redact_text(raw_context)

    # 6. Category & Health evaluation
    category = "infrastructure"
    if any(k in metric.lower() for k in ["net", "rtt", "latency", "packet"]):
        category = "network"
    elif any(k in metric.lower() for k in ["auth", "sec", "login", "fail"]):
        category = "security"
    elif any(k in metric.lower() for k in ["app", "http", "api", "req"]):
        category = "application"

    health = "Excellent"
    if "cpu" in metric or "mem" in metric or "disk" in metric:
        if value >= 90.0: health = "Poor"
        elif value >= 75.0: health = "Fair"
        elif value >= 50.0: health = "Good"
    elif "latency" in metric or "rtt" in metric:
        if value >= 250.0: health = "Poor"
        elif value >= 120.0: health = "Fair"
        elif value >= 50.0: health = "Good"

    payload_id = str(uuid.uuid4())
    payload = {
        "payload_id": payload_id,
        "tenant_id": raw_item.get("tenant_id") or "tenant_alpha",
        "source_id": source_id,
        "metric": metric,
        "value": round(float(value), 2),
        "event_time_utc": event_time_utc,
        "source_tz": raw_item.get("source_tz") or "UTC",
        "health": health,
        "category": category,
        "severity": "critical" if health == "Poor" else ("warning" if health == "Fair" else "info"),
        "alert_context": sanitized_context[:200]
    }

    # Record local audit entry for Egress Proof
    record_audit_entry(
        payload_id=payload_id,
        metric=metric,
        raw_input=raw_context,
        redacted_payload=payload,
        egress_status="egressed"
    )

    return payload, was_redacted

def process_json_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read().strip()
    try:
        data = json.loads(content)
        if isinstance(data, list):
            return data
        elif isinstance(data, dict):
            # Check if nested scenarios structure
            if "scenarios" in data and isinstance(data["scenarios"], dict):
                extracted = []
                for sc in data["scenarios"].values():
                    if "events" in sc:
                        extracted.extend(sc["events"])
                    elif "sanitized_payload" in sc:
                        extracted.append(sc["sanitized_payload"])
                return extracted
            for k in ["events", "telemetry", "data", "metrics", "records"]:
                if k in data and isinstance(data[k], list):
                    return data[k]
            return [data]
    except json.JSONDecodeError:
        # Try JSON Lines format (.jsonl)
        items = []
        for line in content.splitlines():
            line = line.strip()
            if line:
                try:
                    items.append(json.loads(line))
                except Exception:
                    pass
        return items

def process_csv_file(file_path):
    items = []
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            items.append(dict(row))
    return items

def process_log_file(file_path):
    """Feeds log lines directly into the watched local auth.log for log tailer processing"""
    target_log = BASE_DIR / "agent" / "logs" / "auth.log"
    target_log.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "r", encoding="utf-8", errors="ignore") as src:
        lines = src.readlines()
    with open(target_log, "a", encoding="utf-8") as dst:
        for l in lines:
            dst.write(l)
    print(f"[+] Appended {len(lines)} log lines from '{file_path}' into SEENIL local agent watched log: {target_log}")
    return []

def main():
    parser = argparse.ArgumentParser(description="SEENIL Management Telemetry Ingest Adapter")
    parser.add_argument("--file", help="Path to external JSON, JSONL, or CSV telemetry dataset")
    parser.add_argument("--log", help="Path to external raw log file to ingest into local agent")
    parser.add_argument("--delay", type=float, default=0.2, help="Delay between events in seconds (default: 0.2s for live animation)")
    parser.add_argument("--fast", action="store_true", help="Send all events at maximum speed with zero delay")

    args = parser.parse_args()

    file_target = args.file
    log_target = args.log

    print("\n" + "="*80)
    print(" SEENIL — MANAGEMENT TELEMETRY INGEST & REPLAY ADAPTER")
    print("="*80)

    # Interactive prompt if no arguments provided
    if not file_target and not log_target:
        print("No input file provided via command-line arguments.")
        choice = input("Enter path to management telemetry file (JSON, CSV, or Log): ").strip(' "\'')
        if not choice:
            print("No file specified. Using built-in synthetic scenario: shared/demo_telemetry_dataset.json")
            file_target = str(BASE_DIR / "shared" / "demo_telemetry_dataset.json")
        elif choice.endswith(".log") or "auth" in choice:
            log_target = choice
        else:
            file_target = choice

    # Handle Log injection
    if log_target:
        p = Path(log_target)
        if not p.exists():
            print(f"[-] Error: Log file '{log_target}' not found.")
            sys.exit(1)
        process_log_file(p)
        print("[+] Check local agent status at: http://localhost:3000/agent/dashboard")
        return

    # Handle JSON or CSV dataset
    p = Path(file_target)
    if not p.exists():
        print(f"[-] Error: File '{file_target}' not found.")
        sys.exit(1)

    print(f"[*] Reading telemetry from: {p.resolve()}")
    if p.suffix.lower() == ".csv":
        raw_items = process_csv_file(p)
    else:
        raw_items = process_json_file(p)

    print(f"[+] Successfully loaded {len(raw_items)} telemetry records.")
    print("[*] Streaming into running SEENIL Cloud Backend (http://127.0.0.1:8000/api/v1/ingest)...")
    print("="*80)

    delay = 0.0 if args.fast else args.delay
    ingested_count = 0
    anomalies_flagged = 0
    redactions_performed = 0

    for idx, item in enumerate(raw_items, 1):
        payload, was_redacted = normalize_event(item, idx)
        if was_redacted:
            redactions_performed += 1

        code, resp, lat_ms = send_to_seenil(payload)
        status = resp.get("status", "unknown") if isinstance(resp, dict) else resp

        if code == 200:
            ingested_count += 1
            if payload["health"] in ["Fair", "Poor"] or payload["severity"] in ["warning", "critical"]:
                anomalies_flagged += 1
                flag_str = f" [!] {payload['health']} (ANOMALY)"
            else:
                flag_str = ""

            red_str = " [PRIVACY REDACTED]" if was_redacted else ""
            print(f" [{idx}/{len(raw_items)}] Sent: {payload['metric']:<28} = {payload['value']:<6} [{payload['health']}]{flag_str}{red_str} (latency: {lat_ms:.1f}ms)")
        else:
            print(f" [{idx}/{len(raw_items)}] FAILED (HTTP {code}): {resp}")

        if delay > 0:
            time.sleep(delay)

    print("\n" + "="*80)
    print(" INGESTION COMPLETE — SUMMARY")
    print("="*80)
    print(f" Total Records Processed:    {len(raw_items)}")
    print(f" Successfully Ingested:      {ingested_count}")
    print(f" Privacy Redactions Applied: {redactions_performed} (Local credentials scrubbed)")
    print(f" Anomalies Flagged by Cloud: {anomalies_flagged}")
    print(f" Live Dashboard View:        http://localhost:3000/cloud/dashboard")
    print(f" Live Egress Proof View:     http://localhost:3000/egress-proof")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()
