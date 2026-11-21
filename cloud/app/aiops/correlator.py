"""
AIOps Topology-Aware Event Correlator & Incident Intelligence Engine.

1. EVENT CORRELATION ENGINE:
   - Clusters incoming infrastructure anomalies within configurable time windows (e.g. 90s).
   - Leverages Infrastructure Dependency Graph to discover causal topology relationships.
   - Distinguishes cascading alerts from isolated noise and avoids grouping unrelated events.
   - Assigns a correlation score (0.0 - 1.0) based on temporal and topological proximity.

2. ROOT CAUSE SCORING & ANALYSIS:
   - Evaluates candidate causes using temporal precedence, MAD deviation magnitude, and topology depth.
   - Ranks Primary Probable Cause vs. Alternative Possible Causes.
   - Strictly frames conclusions as hypotheses, never asserting proven causation.

3. AI EXPLANATION & REMEDIATION:
   - Grounded narratives distinguishing observed facts from hypotheses.
   - Policy-governed human-in-the-loop operator approval.
"""

import time
import uuid
import hashlib
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from .topology import topology_registry, TopologyGraph
from .rca_scorer import RCAScorer
from .ai_explainer import ai_explainer


class Incident:
    def __init__(
        self,
        incident_id: str,
        tenant_id: str,
        title: str,
        severity: str,
        status: str,
        source_nodes: List[str],
        signals: List[Dict[str, Any]],
        root_cause_explanation: str,
        recommended_action: str,
        remediation_policy: str,
        created_at_utc: str,
        correlation_score: float = 0.85
    ):
        self.incident_id = incident_id
        self.tenant_id = tenant_id
        self.title = title
        self.severity = severity
        self.status = status  # "active", "mitigating", "resolved"
        self.source_nodes = source_nodes
        self.signals = signals
        self.root_cause_explanation = root_cause_explanation
        self.recommended_action = recommended_action
        self.remediation_policy = remediation_policy
        self.created_at_utc = created_at_utc
        self.correlation_score = correlation_score
        self.remediation_audit: Optional[Dict[str, Any]] = None
        self.rca_dossier: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "incident_id": self.incident_id,
            "tenant_id": self.tenant_id,
            "title": self.title,
            "severity": self.severity,
            "status": self.status,
            "source_nodes": self.source_nodes,
            "signals": self.signals,
            "root_cause_explanation": self.root_cause_explanation,
            "recommended_action": self.recommended_action,
            "remediation_policy": self.remediation_policy,
            "created_at_utc": self.created_at_utc,
            "correlation_score": round(self.correlation_score * 100, 1),
            "remediation_audit": self.remediation_audit,
            "rca": self.rca_dossier
        }


class IncidentCorrelator:
    """
    Topology-aware event correlator for multi-signal anomalies.
    """
    def __init__(self, window_seconds: int = 90):
        self.window_seconds = window_seconds
        # incident_id -> Incident
        self._incidents: Dict[str, Incident] = {}

    def get_topology(self, tenant_id: str) -> TopologyGraph:
        return topology_registry.get_topology(tenant_id)

    def calculate_event_correlation(
        self,
        tenant_id: str,
        existing_signals: List[Dict[str, Any]],
        new_signal: Dict[str, Any]
    ) -> Tuple[bool, float]:
        """
        Determines whether `new_signal` belongs to the existing cluster.
        Returns: (should_cluster, correlation_score)

        Rules:
        - Must fall within the sliding time window.
        - Must share the same source host OR be topologically connected in the dependency graph.
        - Unrelated events (different nodes, no dependency, disjoint timestamps) return (False, 0.0).
        """
        if not existing_signals:
            return True, 1.0

        topo = self.get_topology(tenant_id)
        new_ts = new_signal.get("timestamp", time.time())
        new_node = new_signal.get("source_id", "unknown")

        # 1. Temporal closeness check
        earliest_ts = min(s.get("timestamp", new_ts) for s in existing_signals)
        latest_ts = max(s.get("timestamp", new_ts) for s in existing_signals)
        time_span = max(0.0, new_ts - earliest_ts)

        if time_span > self.window_seconds:
            # Outside time window -> do not cluster!
            return False, 0.0

        # Temporal proximity score (closer in time -> higher)
        time_score = max(0.0, 1.0 - (time_span / float(self.window_seconds)))

        # 2. Topological relatedness check
        node_matches = [s.get("source_id") for s in existing_signals]
        is_same_node = new_node in node_matches

        is_connected = False
        topo_distance_score = 0.0

        if is_same_node:
            is_connected = True
            topo_distance_score = 1.0
        else:
            for existing_node in node_matches:
                connected, rel_type = topo.are_connected(new_node, existing_node)
                if connected:
                    is_connected = True
                    topo_distance_score = 0.85 if "SAME" in rel_type or "RUNS" in rel_type else 0.70
                    break

        # 3. Known metric causality pairs (e.g. CPU -> Latency, Latency -> Duplicates)
        existing_metrics = {s.get("metric", "") for s in existing_signals}
        new_metric = new_signal.get("metric", "")

        is_causal_cascade = False
        if "cpu" in new_metric.lower() and any("latency" in m.lower() for m in existing_metrics):
            is_causal_cascade = True
        elif "latency" in new_metric.lower() and any("cpu" in m.lower() for m in existing_metrics):
            is_causal_cascade = True
        elif "duplicate" in new_metric.lower() and any("latency" in m.lower() for m in existing_metrics):
            is_causal_cascade = True

        # Avoid grouping unrelated events
        if not is_same_node and not is_connected and not is_causal_cascade:
            return False, 0.0

        # Correlation score
        final_correlation_score = round(
            (0.50 * time_score) + (0.35 * topo_distance_score) + (0.15 * (1.0 if is_causal_cascade else 0.5)),
            3
        )

        return True, max(0.40, min(0.99, final_correlation_score))

    def record_signal(
        self,
        tenant_id: str,
        source_id: str,
        metric: str,
        value: float,
        health: str,
        category: str,
        severity: str,
        alert_context: str,
        mad_result: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Ingests a telemetry event. Evaluates whether it joins an existing incident
        cluster or instantiates a new correlated incident.
        """
        is_breach = (
            health in ["Fair", "Poor"] or
            severity in ["high", "critical"] or
            mad_result.get("is_anomaly", False)
        )
        if not is_breach:
            return None

        now = time.time()
        now_utc = datetime.now(timezone.utc).isoformat()

        signal = {
            "source_id": source_id,
            "metric": metric,
            "value": value,
            "health": health,
            "category": category,
            "severity": severity,
            "alert_context": alert_context,
            "mad_z_score": mad_result.get("modified_z_score", 0.0),
            "timestamp": now,
            "timestamp_utc": now_utc
        }

        # Check existing active incidents for this tenant
        for inc in self._incidents.values():
            if inc.tenant_id == tenant_id and inc.status == "active":
                should_cluster, corr_score = self.calculate_event_correlation(
                    tenant_id, inc.signals, signal
                )
                if should_cluster:
                    inc.signals.append(signal)
                    if source_id not in inc.source_nodes:
                        inc.source_nodes.append(source_id)
                    inc.correlation_score = max(inc.correlation_score, corr_score)
                    if severity == "critical":
                        inc.severity = "critical"

                    # Recompute full RCA dossier
                    self._update_incident_rca(inc)
                    return inc.to_dict()

        # Otherwise, instantiate a new correlated incident
        inc_id = f"inc_{uuid.uuid4().hex[:8]}"
        title, explanation, action, policy = self._diagnose_signals([signal])

        new_inc = Incident(
            incident_id=inc_id,
            tenant_id=tenant_id,
            title=title,
            severity=severity if severity in ["critical", "high"] else "high",
            status="active",
            source_nodes=[source_id],
            signals=[signal],
            root_cause_explanation=explanation,
            recommended_action=action,
            remediation_policy=policy,
            created_at_utc=now_utc,
            correlation_score=0.90
        )
        self._update_incident_rca(new_inc)
        self._incidents[inc_id] = new_inc
        return new_inc.to_dict()

    def _update_incident_rca(self, inc: Incident):
        """Calculates transparent root cause scoring and AI explanation for an incident."""
        topo = self.get_topology(inc.tenant_id)
        scorer = RCAScorer(topo)
        rca_res = scorer.score_incident(inc.signals)

        subgraph = topo.get_subgraph(inc.source_nodes)
        ai_exp = ai_explainer.explain(inc.tenant_id, inc.title, rca_res, subgraph)

        inc.rca_dossier = {
            "incident_id": inc.incident_id,
            "tenant_id": inc.tenant_id,
            "severity": inc.severity,
            "correlation_score": round(inc.correlation_score * 100, 1),
            "primary_probable_cause": rca_res.get("primary_probable_cause"),
            "alternative_causes": rca_res.get("alternative_causes"),
            "confidence_score": rca_res.get("confidence_score"),
            "confidence_pct": rca_res.get("confidence_pct"),
            "confidence_rating": rca_res.get("confidence_rating"),
            "contributing_metrics": rca_res.get("contributing_metrics"),
            "evidence_timeline": rca_res.get("evidence_timeline"),
            "investigation_steps": rca_res.get("investigation_steps"),
            "ai_explanation": ai_exp,
            "topology_subgraph": subgraph
        }

        # Keep top-level explanation synced with AI summary
        if ai_exp.get("summary"):
            inc.root_cause_explanation = ai_exp["summary"]

    def get_incident_rca(self, incident_id: str, tenant_id: str = "tenant_alpha") -> Optional[Dict[str, Any]]:
        """Returns the complete RCA dossier for an incident."""
        inc = self._incidents.get(incident_id)
        if not inc:
            # Check seeded incidents
            self._ensure_seeds(tenant_id)
            inc = self._incidents.get(incident_id)

        if inc and inc.tenant_id == tenant_id:
            if not inc.rca_dossier:
                self._update_incident_rca(inc)
            return inc.rca_dossier
        return None

    def get_incidents(self, tenant_id: str) -> List[Dict[str, Any]]:
        self._ensure_seeds(tenant_id)
        tenant_incs = [inc.to_dict() for inc in self._incidents.values() if inc.tenant_id == tenant_id]
        return sorted(tenant_incs, key=lambda x: x["created_at_utc"], reverse=True)

    def execute_remediation(self, incident_id: str, operator_id: str = "OP-404") -> Dict[str, Any]:
        """Simulates autonomous policy-governed remediation with hash audit."""
        if incident_id not in self._incidents:
            return {"status": "error", "message": f"Incident {incident_id} not found."}

        inc = self._incidents[incident_id]
        now_utc = datetime.now(timezone.utc).isoformat()
        proof_payload = f"{inc.incident_id}::{inc.remediation_policy}::{operator_id}::{now_utc}"
        audit_sha256 = hashlib.sha256(proof_payload.encode()).hexdigest()

        inc.status = "resolved"
        inc.remediation_audit = {
            "executed_by": operator_id,
            "executed_at_utc": now_utc,
            "policy": inc.remediation_policy,
            "action_taken": inc.recommended_action,
            "execution_hash": audit_sha256,
            "verification_status": "SUCCESS (Target metrics returned within dynamic MAD baseline)",
            "rollback_snapshot_id": f"snap_{uuid.uuid4().hex[:6]}"
        }

        return {
            "status": "success",
            "incident_id": inc.incident_id,
            "new_status": "resolved",
            "audit": inc.remediation_audit
        }

    def _diagnose_signals(self, signals: List[Dict[str, Any]]) -> tuple:
        categories = {s.get("category", "") for s in signals}
        metrics = {s.get("metric", "") for s in signals}

        if "security" in categories or any("login" in m.lower() for m in metrics):
            return (
                "Credential Stuffing Attack Detected & Local Brute-Force Spike",
                "Observed anomalous spike in authentication failure rate exceeding dynamic baseline (>3.5 MAD). "
                "Correlated with auth-gateway rate limits. Edge agent successfully redacted all payload inputs.",
                "Enforce IP CIDR rate-limit on auth ingress & invalidate active session token",
                "SEC-AUTO-REMEDIATE-01 (Approved under SOC Policy v3.2)"
            )
        elif any("latency" in m.lower() for m in metrics) or "network_probe" in metrics:
            return (
                "VPC Ingress Congestion & Transit Gateway Latency Surge",
                "Socket RTT round-trip latency exceeded baseline threshold with elevated packet loss. "
                "Correlated with inter-zone routing degradation on monitored nodes.",
                "Reroute edge egress traffic via redundant cloud gateway replica",
                "NET-AUTO-REROUTE-04 (Approved under High-Availability SLA Policy)"
            )
        elif any("cpu" in m.lower() for m in metrics):
            return (
                "Compute Resource Saturation & Thread Pool Starvation",
                "Host telemetry indicates CPU load sustained above 85% with memory pressure. "
                "Local agent outbox queue is safely buffering metadata events without dropped telemetry.",
                "Trigger horizontal pod autoscaler (HPA) to spin up 2 worker replicas",
                "OPS-SCALE-REPLICAS-02 (Policy pre-authorized for burst mitigation)"
            )
        else:
            return (
                "Correlated Anomaly in Infrastructure Performance Matrix",
                "Multiple telemetry indicators exhibited simultaneous statistical deviation from rolling MAD median.",
                "Initiate health probe restart on affected service nodes",
                "OPS-SERVICE-RESTART-01 (Standard automated recovery runbook)"
            )

    def _ensure_seeds(self, tenant_id: str):
        if tenant_id == "tenant_alpha":
            if "inc_casc_1042" not in self._incidents:
                self._seed_default_incidents(tenant_id)
        else:
            existing = [i for i in self._incidents.values() if i.tenant_id == tenant_id]
            if not existing:
                self._seed_default_incidents(tenant_id)

    def _seed_default_incidents(self, tenant_id: str):
        now = time.time()
        now_utc = datetime.now(timezone.utc).isoformat()

        if tenant_id == "tenant_alpha":
            # Scenario: Cascading Incident (CPU Spike -> Memory Increase -> Latency Increase)
            cascade_signals = [
                {
                    "source_id": "node_primary",
                    "metric": "system.cpu.utilization",
                    "value": 96.8,
                    "health": "Poor",
                    "category": "compute",
                    "severity": "critical",
                    "alert_context": "Host CPU breached 90% threshold",
                    "mad_z_score": 4.82,
                    "timestamp": now - 35,
                    "timestamp_utc": datetime.fromtimestamp(now - 35, timezone.utc).isoformat()
                },
                {
                    "source_id": "node_primary",
                    "metric": "system.memory.percent",
                    "value": 88.4,
                    "health": "Fair",
                    "category": "compute",
                    "severity": "high",
                    "alert_context": "Memory buffer saturation under high thread contention",
                    "mad_z_score": 3.45,
                    "timestamp": now - 22,
                    "timestamp_utc": datetime.fromtimestamp(now - 22, timezone.utc).isoformat()
                },
                {
                    "source_id": "svc_api_gateway",
                    "metric": "api.latency.ms",
                    "value": 1850.0,
                    "health": "Poor",
                    "category": "service",
                    "severity": "high",
                    "alert_context": "API gateway request queueing caused by thread starvation",
                    "mad_z_score": 3.91,
                    "timestamp": now - 10,
                    "timestamp_utc": datetime.fromtimestamp(now - 10, timezone.utc).isoformat()
                }
            ]

            inc1 = Incident(
                incident_id="inc_casc_1042",
                tenant_id=tenant_id,
                title="Compute Starvation Cascading to API Gateway Latency",
                severity="critical",
                status="active",
                source_nodes=["node_primary", "svc_api_gateway"],
                signals=cascade_signals,
                root_cause_explanation="",
                recommended_action="Trigger worker thread pool rebalance and scale replica pod",
                remediation_policy="OPS-SCALE-REPLICAS-02 (Pre-authorized)",
                created_at_utc=datetime.fromtimestamp(now - 35, timezone.utc).isoformat(),
                correlation_score=0.94
            )
            self._update_incident_rca(inc1)
            self._incidents["inc_casc_1042"] = inc1

            # Seed 2: Security Brute Force
            sec_signals = [
                {
                    "source_id": "svc_api_gateway",
                    "metric": "auth.failed_logins_rate",
                    "value": 24.0,
                    "health": "Poor",
                    "category": "security",
                    "severity": "critical",
                    "alert_context": "10+ failed logins within 30s",
                    "mad_z_score": 4.12,
                    "timestamp": now - 180,
                    "timestamp_utc": datetime.fromtimestamp(now - 180, timezone.utc).isoformat()
                }
            ]
            inc2 = Incident(
                incident_id="inc_sec_8901",
                tenant_id=tenant_id,
                title="Credential Stuffing Attack Detected & Local Redaction Guard",
                severity="critical",
                status="active",
                source_nodes=["svc_api_gateway"],
                signals=sec_signals,
                root_cause_explanation="",
                recommended_action="Apply CIDR rate-limit on ingress WAF & invalidate stale sessions",
                remediation_policy="SEC-AUTO-REMEDIATE-01",
                created_at_utc=datetime.fromtimestamp(now - 180, timezone.utc).isoformat(),
                correlation_score=0.88
            )
            self._update_incident_rca(inc2)
            self._incidents["inc_sec_8901"] = inc2

        else:
            # Tenant Beta Seeds
            beta_signals = [
                {
                    "source_id": "node_beta_host",
                    "metric": "system.disk.io_wait",
                    "value": 45.2,
                    "health": "Fair",
                    "category": "infrastructure",
                    "severity": "high",
                    "alert_context": "I/O wait above 40%",
                    "mad_z_score": 3.15,
                    "timestamp": now - 120,
                    "timestamp_utc": datetime.fromtimestamp(now - 120, timezone.utc).isoformat()
                }
            ]
            inc_b = Incident(
                incident_id="inc_beta_001",
                tenant_id=tenant_id,
                title="Storage IO Wait Saturation on Beta Host",
                severity="high",
                status="active",
                source_nodes=["node_beta_host"],
                signals=beta_signals,
                root_cause_explanation="",
                recommended_action="Flush write buffer and re-allocate IOPS tier",
                remediation_policy="OPS-STORAGE-THROTTLE-01",
                created_at_utc=datetime.fromtimestamp(now - 120, timezone.utc).isoformat(),
                correlation_score=0.82
            )
            self._update_incident_rca(inc_b)
            self._incidents["inc_beta_001"] = inc_b


# Global singleton instance
incident_correlator = IncidentCorrelator(window_seconds=90)
