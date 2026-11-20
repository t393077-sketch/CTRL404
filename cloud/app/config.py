import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SHARED_DIR = BASE_DIR / "shared"
SCHEMA_PATH = SHARED_DIR / "payload.schema.json"

class Settings:
    @property
    def DATABASE_URL(self) -> str:
        return os.getenv("DATABASE_URL", "postgresql://postgres:seenil123@localhost:5432/seenil")

    @property
    def POSTGRES_USER(self) -> str:
        return os.getenv("POSTGRES_USER", "postgres")

    @property
    def POSTGRES_PASSWORD(self) -> str:
        return os.getenv("POSTGRES_PASSWORD", "seenil123")

    @property
    def POSTGRES_HOST(self) -> str:
        return os.getenv("POSTGRES_HOST", "localhost")

    @property
    def POSTGRES_PORT(self) -> int:
        return int(os.getenv("POSTGRES_PORT", "5432"))

    @property
    def POSTGRES_DB(self) -> str:
        return os.getenv("POSTGRES_DB", "seenil")

    SCHEMA_FILE: Path = SCHEMA_PATH
    HEARTBEAT_TIMEOUT_SECONDS: int = 60
    HEARTBEAT_CHECK_INTERVAL_SECONDS: int = 10
    STALE_DATA_TIMEOUT_SECONDS: int = 30

settings = Settings()
