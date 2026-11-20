# SEENIL Architecture: "See everything. Leave nothing."

Two-tier zero-leak AIOps observability architecture.

```text
================================================================================================
   TIER 1: CUSTOMER ENVIRONMENT (LENS AGENT)
================================================================================================
   [Host Metrics]        [Network Pings]       [App/Security Logs]    [Simulated Stream]
   (psutil: CPU/Mem/Disk) (ICMP / TCP latency)  (Auth / ShopSim logs)  (Organizer Adapter)
         │                     │                      │                       │
         └─────────────────────┼──────────────────────┴───────────────────────┘
                               ▼
                   ┌───────────────────────┐
                   │   COLLECT & SAMPLE    │
                   └───────────┬───────────┘
                               ▼
                   ┌───────────────────────┐
                   │     FILTER & REDACT   │  <-- Regex + Shannon Entropy:
                   │   (Raw logs/secrets   │      Secrets, Tokens, Passwords,
                   │     stay on host)     │      PII stripped permanently
                   └───────────┬───────────┘
                               ▼
                   ┌───────────────────────┐
                   │  ALLOW-LIST VALIDATOR │  <-- Only 11 metadata fields allowed
                   │ (Drop unknown fields) │      Pseudonymous HMAC source IDs
                   └───────────┬───────────┘
                               ▼
                   ┌───────────────────────┐
                   │    SQLITE OUTBOX      │  <-- Local buffer & retry queue
                   │   (WAL Mode / Replay) │      Zero data loss during outages
                   └───────────┬───────────┘
                               ▼
                   ┌───────────────────────┐
                   │    EGRESS & SIGN      │
                   └───────────┬───────────┘
                               │
═══════════════════════════════╪════════════════════════════════════════════════════════════════
                      TRUST BOUNDARY (TLS 1.3 / HMAC Auth)
                Only Allow-Listed Metadata Crosses. Zero Raw Data.
═══════════════════════════════╪════════════════════════════════════════════════════════════════
                               │
                               ▼
================================================================================================
   TIER 2: CENTRAL SAAS (LENS CLOUD)
================================================================================================
                   ┌───────────────────────┐
                   │    REGIONAL INGEST    │  <-- Strict schema validation
                   │ (FastAPI / Auth Gate) │      Rejects non-allowlisted keys
                   └───────────┬───────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│     POSTGRES + RLS    │             │     AIOps ENGINE      │
│  - Strict Tenant RLS  │             │  - MAD Baselines      │
│  - Idempotent dedupe  │             │  - Cross-signal Corr. │
│  - Event time sorting │             │  - Incident merging   │
└───────────┬───────────┘             └───────────┬───────────┘
            │                                     │
            └──────────────────┬──────────────────┘
                               ▼
                   ┌───────────────────────┐
                   │  EXPLAINABLE ADVISOR  │  <-- LLM on safe metadata only
                   │ (Root Cause Analysis) │      Confidence + Reasoning path
                   └───────────┬───────────┘
                               ▼
                   ┌───────────────────────┐
                   │   WEB DASHBOARD UI    │  <-- Next.js 14 + WebSockets
                   │  - 4 Health States    │      p95 Latency Scorecard (<10s)
                   │  - Egress Proof Panel │      Incident details + Chaos panel
                   └───────────────────────┘
```

## Key Invariants
1. **Zero Raw Egress**: Payloads and secrets are redacted and discarded at Tier 1 before transmission.
2. **Strict Schema Enforce**: Ingest drops any request carrying undeclared properties.
3. **Idempotent Delivery**: Payload UUID guarantees zero duplicates across replayed outbox queues.
4. **Resilience**: SQLite local buffering handles network partitions without data loss.
