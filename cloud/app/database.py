import os
import socket
import logging
from contextlib import contextmanager
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from .config import settings, BASE_DIR
from .models import Base

logger = logging.getLogger("seenil.database")

_engine = None
_SessionLocal = None

def get_engine():
    global _engine
    if _engine is None:
        db_url = settings.DATABASE_URL
        if "postgresql" in db_url:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.5)
            try:
                sock.connect((settings.POSTGRES_HOST, settings.POSTGRES_PORT))
                sock.close()
                _engine = create_engine(
                    db_url,
                    pool_pre_ping=True,
                    pool_size=10,
                    max_overflow=20,
                    connect_args={"connect_timeout": 3}
                )
                logger.info(f"Connected to PostgreSQL database at {settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}.")
            except Exception:
                logger.warning(f"PostgreSQL on {settings.POSTGRES_HOST}:{settings.POSTGRES_PORT} not reachable. Using resilient local SQLite engine.")
                sqlite_path = BASE_DIR / "cloud" / "seenil.db"
                _engine = create_engine(
                    f"sqlite:///{sqlite_path}",
                    connect_args={"check_same_thread": False}
                )
        else:
            _engine = create_engine(
                db_url,
                connect_args={"check_same_thread": False}
            )
    return _engine

def get_sessionmaker():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal

def SessionLocal() -> Session:
    sm = get_sessionmaker()
    return sm()

def reset_engine_for_test(db_url: str):
    global _engine, _SessionLocal
    if "sqlite" in db_url:
        _engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False}
        )
    else:
        _engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            connect_args={"connect_timeout": 3}
        )
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)

def create_database_if_not_exists():
    """Connects to default postgres maintenance DB and creates 'seenil' if missing"""
    if "postgresql" not in settings.DATABASE_URL:
        return
    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

        conn = psycopg2.connect(
            dbname="postgres",
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            connect_timeout=1
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute(f"SELECT 1 FROM pg_database WHERE datname = '{settings.POSTGRES_DB}';")
        exists = cur.fetchone()
        if not exists:
            logger.info(f"Database '{settings.POSTGRES_DB}' does not exist. Creating...")
            cur.execute(f"CREATE DATABASE {settings.POSTGRES_DB};")
            logger.info(f"Database '{settings.POSTGRES_DB}' created successfully.")
        cur.close()
        conn.close()
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL on {settings.POSTGRES_HOST}:{settings.POSTGRES_PORT} ({e}).")

def apply_row_level_security():
    """Applies PostgreSQL Row Level Security (RLS) on all tenant-scoped tables"""
    engine = get_engine()
    if engine.dialect.name != "postgresql":
        logger.info("Non-Postgres dialect detected; RLS handled via application session context.")
        return

    tables = ["telemetry_events", "duplicate_metrics", "collector_statuses", "health_transitions"]
    with engine.begin() as conn:
        for table in tables:
            conn.execute(text(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;"))
            conn.execute(text(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;"))
            conn.execute(text(f"DROP POLICY IF EXISTS {table}_tenant_isolation ON {table};"))
            conn.execute(text(f"""
                CREATE POLICY {table}_tenant_isolation ON {table}
                FOR ALL
                USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
                WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''));
            """))
    logger.info("PostgreSQL Row Level Security (RLS) policies successfully enforced.")

def init_db():
    create_database_if_not_exists()
    engine = get_engine()
    try:
        Base.metadata.create_all(bind=engine)
        apply_row_level_security()
    except Exception as e:
        logger.warning(f"Database table/RLS creation warning: {e}")

@contextmanager
def get_tenant_session(tenant_id: str):
    """Yields a database session scoped strictly to the given tenant_id via RLS"""
    session: Session = SessionLocal()
    engine = get_engine()
    try:
        if engine.dialect.name == "postgresql":
            session.execute(
                text("SET LOCAL app.current_tenant_id = :tenant_id"),
                {"tenant_id": tenant_id}
            )
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

def get_db():
    """Dependency for standard un-scoped DB queries (auth, tenant provisioning)"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
