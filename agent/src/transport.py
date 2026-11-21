import json
import hmac
import hashlib
import logging
from typing import Tuple, List, Dict, Any, Optional
import httpx
from jsonschema import Draft202012Validator
from .config import agent_settings

logger = logging.getLogger("seenil.transport")

# Load shared schema
with open(agent_settings.SCHEMA_PATH, "r", encoding="utf-8") as f:
    SCHEMA = json.load(f)
SCHEMA_VALIDATOR = Draft202012Validator(SCHEMA)

# Global flag to simulate network partition for demo / chaos engineering
SIMULATE_OUTAGE = False

def set_simulate_outage(simulate: bool):
    global SIMULATE_OUTAGE
    SIMULATE_OUTAGE = simulate
    state = "ENABLED (Outage active)" if simulate else "DISABLED (Network online)"
    logger.info(f"Simulated network outage is now: {state}")

def is_outage_simulated() -> bool:
    return SIMULATE_OUTAGE

def validate_outgoing_payload(payload: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validates event against /shared/payload.schema.json before sending.
    Requirement 4: If invalid, drop locally and log why. Never send malformed payloads.
    """
    errors = sorted([e.message for e in SCHEMA_VALIDATOR.iter_errors(payload)])
    return (len(errors) == 0, errors)

def sign_payload_bytes(raw_bytes: bytes, secret: str = None) -> str:
    """Signs exact byte array using HMAC-SHA256"""
    key = (secret or agent_settings.HMAC_SECRET).encode("utf-8")
    return hmac.new(key, raw_bytes, hashlib.sha256).hexdigest()

_client: Optional[httpx.Client] = None

def get_http_client() -> httpx.Client:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.Client(timeout=1.5, limits=httpx.Limits(max_keepalive_connections=30, max_connections=50))
    return _client

def send_payload_to_cloud(
    payload: Dict[str, Any],
    cloud_url: str = None,
    token: str = None,
    secret: str = None,
    timeout_sec: float = 3.0
) -> Tuple[bool, Optional[int], str]:
    """
    Sends signed payload to Cloud /api/v1/ingest.
    Returns: (success_bool, status_code, message)
    """
    if SIMULATE_OUTAGE:
        return False, None, "Simulated network partition: Cloud unreachable."

    # 1. Pre-egress Schema Validation
    is_valid, validation_errors = validate_outgoing_payload(payload)
    if not is_valid:
        err_msg = f"Local validation rejected payload {payload.get('payload_id')}: {'; '.join(validation_errors)}"
        logger.error(err_msg)
        return False, 422, err_msg

    # 2. Deterministic serialization and signature
    url = f"{cloud_url or agent_settings.CLOUD_BASE_URL}/api/v1/ingest"
    raw_bytes = json.dumps(payload, separators=(',', ':')).encode("utf-8")
    signature = sign_payload_bytes(raw_bytes, secret)

    headers = {
        "Content-Type": "application/json",
        "X-Agent-Token": token or agent_settings.AGENT_TOKEN,
        "X-Signature": signature
    }

    try:
        client = get_http_client()
        resp = client.post(url, content=raw_bytes, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            return True, 200, data.get("message", "Ingested successfully")
        else:
            return False, resp.status_code, resp.text
    except Exception as e:
        return False, None, f"Network transport error: {e}"

def send_heartbeat_to_cloud(
    source_id: str,
    resource_usage: dict = None,
    cloud_url: str = None,
    token: str = None,
    timeout_sec: float = 2.0
) -> bool:
    """Sends heartbeat to /api/v1/heartbeat"""
    if SIMULATE_OUTAGE:
        return False

    url = f"{cloud_url or agent_settings.CLOUD_BASE_URL}/api/v1/heartbeat"
    headers = {
        "Content-Type": "application/json",
        "X-Agent-Token": token or agent_settings.AGENT_TOKEN
    }
    body = {
        "source_id": source_id,
        "version": agent_settings.VERSION,
        "resource_usage": resource_usage or {},
        "config_status": "healthy"
    }

    try:
        with httpx.Client(timeout=timeout_sec) as client:
            resp = client.post(url, json=body, headers=headers)
            return resp.status_code == 200
    except Exception:
        return False
