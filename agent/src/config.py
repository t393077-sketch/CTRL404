import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SHARED_DIR = BASE_DIR / "shared"
AGENT_DIR = BASE_DIR / "agent"

class AgentSettings:
    CLOUD_BASE_URL: str = os.getenv("SEENIL_CLOUD_URL", "http://127.0.0.1:8000")
    TENANT_ID: str = os.getenv("SEENIL_TENANT_ID", "tenant_alpha")
    AGENT_TOKEN: str = os.getenv("SEENIL_AGENT_TOKEN", "token_alpha_sec_98124")
    HMAC_SECRET: str = os.getenv("SEENIL_HMAC_SECRET", "secret_alpha_hmac_key_2026")
    SITE_SECRET: str = os.getenv("SEENIL_SITE_SECRET", "seenil_edge_node_salt_2026")
    
    SOURCE_TZ: str = os.getenv("SEENIL_SOURCE_TZ", "Asia/Kolkata")
    COLLECT_INTERVAL_SECONDS: float = float(os.getenv("SEENIL_COLLECT_INTERVAL", "5.0"))
    HEARTBEAT_INTERVAL_SECONDS: float = float(os.getenv("SEENIL_HEARTBEAT_INTERVAL", "10.0"))
    
    SCHEMA_PATH: Path = SHARED_DIR / "payload.schema.json"
    LOCAL_DB_PATH: Path = AGENT_DIR / "src" / "storage" / "agent_local.db"
    WATCH_LOG_PATH: Path = AGENT_DIR / "logs" / "auth.log"

    VERSION: str = "1.0.0"

agent_settings = AgentSettings()
