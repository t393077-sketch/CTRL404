import hmac
import hashlib
import json
import logging
from typing import Tuple
from fastapi import Request, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from jsonschema import validate, ValidationError, Draft202012Validator
from .config import settings
from .database import SessionLocal
from .models import TenantAgentToken

logger = logging.getLogger("seenil.security")

API_KEY_HEADER = APIKeyHeader(name="X-Agent-Token", auto_error=False)
SIGNATURE_HEADER = APIKeyHeader(name="X-Signature", auto_error=False)

# Load JSON schema once at startup
with open(settings.SCHEMA_FILE, "r", encoding="utf-8") as f:
    RAW_SCHEMA = json.load(f)
SCHEMA_VALIDATOR = Draft202012Validator(RAW_SCHEMA)

def verify_payload_schema(raw_json: dict):
    """Strictly validates payload against /shared/payload.schema.json, forbidding extra fields"""
    errors = sorted(SCHEMA_VALIDATOR.iter_errors(raw_json), key=lambda e: e.path)
    if errors:
        err_msgs = [e.message for e in errors]
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "Schema validation failed", "violations": err_msgs}
        )

def verify_token_and_signature(
    request_body: bytes,
    agent_token_header: str,
    signature_header: str
) -> Tuple[str, str]:
    """
    Validates agent token and HMAC-SHA256 signature.
    Returns: (tenant_id, hmac_secret)
    """
    if not agent_token_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing 'X-Agent-Token' header."
        )

    # Query token from DB
    db = SessionLocal()
    try:
        token_record = db.query(TenantAgentToken).filter(
            TenantAgentToken.token == agent_token_header,
            TenantAgentToken.is_active == True
        ).first()

        if not token_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or deactivated agent token."
            )

        tenant_id = token_record.tenant_id
        secret = token_record.hmac_secret

        # Validate HMAC signature
        if not signature_header:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing 'X-Signature' header for payload verification."
            )

        computed_sig = hmac.new(
            secret.encode("utf-8"),
            request_body,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(computed_sig, signature_header):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HMAC signature verification failed."
            )

        return tenant_id, secret
    finally:
        db.close()
