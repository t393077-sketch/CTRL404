import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Float, DateTime, Boolean, Integer, ForeignKey, Text, Index
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class GUID(TypeDecorator):
    """Platform-independent GUID/UUID type"""
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if isinstance(value, uuid.UUID):
                return str(value)
            return str(uuid.UUID(str(value)))

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value))


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    tokens = relationship("TenantAgentToken", back_populates="tenant")


class TenantAgentToken(Base):
    __tablename__ = "tenant_agent_tokens"

    token = Column(String(128), primary_key=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    hmac_secret = Column(String(128), nullable=False)
    name = Column(String(128), default="Collector Agent")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    tenant = relationship("Tenant", back_populates="tokens")


class TelemetryEvent(Base):
    __tablename__ = "telemetry_events"

    # Idempotency constraint: payload_id is the primary key
    payload_id = Column(GUID(), primary_key=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    source_id = Column(String(128), nullable=False, index=True)
    metric = Column(String(128), nullable=False, index=True)
    value = Column(Float, nullable=False)
    event_time_utc = Column(DateTime(timezone=True), nullable=False, index=True)
    received_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
    ingest_latency_ms = Column(Float, nullable=False)
    source_tz = Column(String(64), nullable=False)
    health = Column(String(16), nullable=False)
    category = Column(String(32), nullable=False)
    severity = Column(String(16), nullable=False)
    alert_context = Column(String(200), nullable=False)
    payload_sha256 = Column(String(64), nullable=True)

    __table_args__ = (
        Index("idx_tenant_event_time", "tenant_id", "event_time_utc"),
        Index("idx_tenant_source", "tenant_id", "source_id"),
    )


class DuplicateMetric(Base):
    __tablename__ = "duplicate_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String(64), nullable=False, index=True)
    payload_id = Column(GUID(), nullable=False, unique=True, index=True)
    first_seen_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    duplicate_count = Column(Integer, default=1)
    last_seen_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class CollectorStatus(Base):
    __tablename__ = "collector_statuses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String(64), nullable=False, index=True)
    source_id = Column(String(128), nullable=False, index=True)
    status = Column(String(16), nullable=False, default="online") # online / offline
    last_heartbeat_utc = Column(DateTime(timezone=True), nullable=False)
    version = Column(String(32), default="1.0.0")
    resource_usage = Column(Text, nullable=True)
    config_status = Column(String(64), default="healthy")
    offline_reason = Column(String(256), nullable=True)

    __table_args__ = (
        Index("idx_collector_tenant_source", "tenant_id", "source_id", unique=True),
    )


class HealthTransition(Base):
    __tablename__ = "health_transitions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String(64), nullable=False, index=True)
    source_id = Column(String(128), nullable=False, index=True)
    from_health = Column(String(16), nullable=False)
    to_health = Column(String(16), nullable=False)
    reason = Column(String(256), nullable=False)
    transition_time_utc = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
