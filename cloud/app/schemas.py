from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class TelemetryPayload(BaseModel):
    model_config = ConfigDict(extra="forbid") # Rejects any extra/unknown field

    payload_id: UUID = Field(..., description="Unique UUID for idempotency")
    tenant_id: str = Field(..., min_length=1, description="Tenant organization ID")
    source_id: str = Field(..., min_length=1, description="Pseudonymous HMAC source ID")
    metric: str = Field(..., min_length=1, description="Metric name")
    value: float = Field(..., description="Observed numeric value")
    event_time_utc: datetime = Field(..., description="UTC timestamp of occurrence")
    source_tz: str = Field(..., description="Origin timezone")
    health: str = Field(..., description="Excellent | Good | Fair | Poor")
    category: str = Field(..., description="infrastructure | network | application | security")
    severity: str = Field(..., description="info | warning | critical | error")
    alert_context: str = Field(..., max_length=200, description="Short alert summary max 200 chars")


class IngestResponse(BaseModel):
    status: str # "stored" or "duplicate"
    payload_id: str
    tenant_id: str
    received_at: datetime
    ingest_latency_ms: float
    message: str


class HeartbeatRequest(BaseModel):
    source_id: str = Field(..., min_length=1)
    version: str = Field(default="1.0.0")
    resource_usage: Optional[Dict[str, Any]] = Field(default_factory=dict)
    config_status: str = Field(default="healthy")


class HeartbeatResponse(BaseModel):
    status: str # "recorded"
    source_id: str
    tenant_id: str
    server_time_utc: datetime


class EventOut(BaseModel):
    payload_id: str
    tenant_id: str
    source_id: str
    metric: str
    value: float
    event_time_utc: datetime
    received_at: datetime
    ingest_latency_ms: float
    source_tz: str
    health: str
    category: str
    severity: str
    alert_context: str
    payload_sha256: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedEvents(BaseModel):
    total: int
    limit: int
    offset: int
    events: List[EventOut]


class CollectorStatusOut(BaseModel):
    source_id: str
    tenant_id: str
    status: str
    last_heartbeat_utc: datetime
    version: str
    resource_usage: Optional[str]
    config_status: str
    offline_reason: Optional[str]

    model_config = ConfigDict(from_attributes=True)
