import hmac
import hashlib
import socket
from .config import agent_settings

def get_pseudonymous_source_id(hostname: str = None) -> str:
    """
    Derives an irreversible pseudonymous source_id using HMAC-SHA256.
    The real local hostname or IP NEVER crosses the network boundary.
    """
    raw_host = hostname or socket.gethostname()
    derived = hmac.new(
        agent_settings.SITE_SECRET.encode("utf-8"),
        raw_host.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    return f"node_{derived[:16]}"
