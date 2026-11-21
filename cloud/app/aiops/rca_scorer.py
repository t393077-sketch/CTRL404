"""
Topology-Aware AI Root Cause Scoring Engine.

Analyzes correlated incident signals across 4 transparent dimensions:
1. Temporal Precedence (Did this metric change first?)
2. Metric Deviation Magnitude (How severe is the MAD Modified Z-score?)
3. Infrastructure Dependency Depth (Is the node upstream in the topology graph?)
4. Symptom Cascade Consistency (Did downstream services degrade after this event?)

Calculates transparent scores, ranks candidate hypotheses, and outputs:
- Primary Probable Cause
- Alternative Possible Causes
- Contributing Metrics
- Evidence Timeline
- Confidence Score
- Actionable Investigation Steps

Strictly treats findings as hypotheses, never asserting proven causation.
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
from .topology import TopologyGraph, NodeType


class CandidateCause:
    def __init__(
        self,
        metric: str,
        source_node: str,
        first_seen_ts: float,
        first_seen_utc: str,
        peak_value: float,
        baseline_median: float,
        mad_z_score: float,
        category: str,
        role: str = "candidate_cause"
    ):
        self.metric = metric
        self.source_node = source_node
        self.first_seen_ts = first_seen_ts
        self.first_seen_utc = first_seen_utc
        self.peak_value = peak_value
        self.baseline_median = baseline_median
        self.mad_z_score = mad_z_score
        self.category = category
        self.role = role

        # Scoring dimensions (0.0 - 1.0)
        self.temporal_score: float = 0.0
        self.magnitude_score: float = 0.0
        self.topology_score: float = 0.0
        self.cascade_score: float = 0.0
        self.composite_score: float = 0.0
        self.score_rationale: str = ""

    def calculate_scores(
        self,
        earliest_ts: float,
        topo: TopologyGraph,
        all_signals: List[Dict[str, Any]],
        weights: Tuple[float, float, float, float] = (0.35, 0.30, 0.25, 0.10)
    ):
        w_time, w_mag, w_topo, w_casc = weights

        # 1. Temporal Precedence Score: earlier onset gets higher score
        delta_seconds = max(0.0, self.first_seen_ts - earliest_ts)
        # Decays linearly over 60 seconds
        self.temporal_score = max(0.0, 1.0 - (delta_seconds / 60.0))

        # 2. Magnitude Score: MAD Modified Z-score relative to 5.0 sigma
        self.magnitude_score = min(1.0, max(0.1, abs(self.mad_z_score) / 5.0))

        # 3. Topology Score: Upstream nodes (hosts, DBs) rank higher than downstream leaves
        node = topo.get_node(self.source_node)
        if node:
            depth = topo.get_dependency_depth(self.source_node)
            if node.node_type in [NodeType.HOST, NodeType.DATABASE]:
                self.topology_score = min(1.0, 0.70 + (depth * 0.10))
            elif node.node_type == NodeType.NETWORK:
                self.topology_score = 0.65
            else:
                # Leaf service
                self.topology_score = max(0.30, 0.40 + (depth * 0.10))
        else:
            # Unknown node relationship
            self.topology_score = 0.40

        # 4. Cascade Score: Do downstream events follow after this trigger?
        downstream_after_count = 0
        for s in all_signals:
            s_ts = s.get("timestamp", 0.0)
            if s_ts > self.first_seen_ts:
                downstream_after_count += 1
        
        self.cascade_score = min(1.0, downstream_after_count / max(1, len(all_signals) - 1)) if len(all_signals) > 1 else 0.5

        # Composite Weighted Score
        self.composite_score = round(
            (w_time * self.temporal_score) +
            (w_mag * self.magnitude_score) +
            (w_topo * self.topology_score) +
            (w_casc * self.cascade_score),
            4
        )

        self.score_rationale = (
            f"Onset offset: +{delta_seconds:.1f}s (Time: {self.temporal_score:.2f}), "
            f"MAD deviation: {self.mad_z_score:.2f}σ (Mag: {self.magnitude_score:.2f}), "
            f"Topology upstream rank: {self.topology_score:.2f}, "
            f"Downstream cascade: {self.cascade_score:.2f}"
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "metric": self.metric,
            "source_node": self.source_node,
            "first_seen_utc": self.first_seen_utc,
            "peak_value": self.peak_value,
            "baseline_median": self.baseline_median,
            "mad_z_score": round(self.mad_z_score, 2),
            "composite_score": round(self.composite_score * 100, 1),
            "temporal_score": round(self.temporal_score, 2),
            "magnitude_score": round(self.magnitude_score, 2),
            "topology_score": round(self.topology_score, 2),
            "cascade_score": round(self.cascade_score, 2),
            "rationale": self.score_rationale
        }


class RCAScorer:
    """
    Transparent RCA Scorer that evaluates all candidate anomalies in an incident.
    """
    def __init__(self, topo: TopologyGraph):
        self.topo = topo

    def score_incident(self, signals: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not signals:
            return self._empty_result()

        # Group signals by (source_node, metric) to find earliest occurrence and peak
        candidates_map: Dict[str, CandidateCause] = {}
        earliest_overall_ts = min(s.get("timestamp", 0.0) for s in signals)

        for s in signals:
            node = s.get("source_id", "unknown_node")
            metric = s.get("metric", "unknown_metric")
            key = f"{node}::{metric}"
            ts = s.get("timestamp", 0.0)
            ts_utc = s.get("timestamp_utc") or datetime.now(timezone.utc).isoformat()
            val = float(s.get("value", 0.0))
            z = float(s.get("mad_z_score", 0.0))
            cat = s.get("category", "general")

            if key not in candidates_map:
                candidates_map[key] = CandidateCause(
                    metric=metric,
                    source_node=node,
                    first_seen_ts=ts,
                    first_seen_utc=ts_utc,
                    peak_value=val,
                    baseline_median=val / (1.0 + (z * 0.15)) if z > 0 else val,
                    mad_z_score=z,
                    category=cat
                )
            else:
                c = candidates_map[key]
                if ts < c.first_seen_ts:
                    c.first_seen_ts = ts
                    c.first_seen_utc = ts_utc
                if abs(z) > abs(c.mad_z_score):
                    c.mad_z_score = z
                    c.peak_value = val

        # Score all candidate causes
        candidates = list(candidates_map.values())
        for c in candidates:
            c.calculate_scores(earliest_overall_ts, self.topo, signals)

        # Rank descending by composite score
        candidates.sort(key=lambda x: x.composite_score, reverse=True)

        primary = candidates[0]
        primary.role = "primary_probable_cause"

        alternatives = candidates[1:]
        for alt in alternatives:
            alt.role = "alternative_hypothesis"

        # Calculate confidence score
        if len(candidates) > 1:
            margin = primary.composite_score - alternatives[0].composite_score
            # Confidence is strong if margin is high, moderate if close
            conf = min(0.96, max(0.45, primary.composite_score * (0.85 + (margin * 0.4))))
        else:
            conf = min(0.85, max(0.50, primary.composite_score))

        conf_pct = round(conf * 100, 1)
        conf_rating = "HIGH" if conf_pct >= 80.0 else ("MEDIUM" if conf_pct >= 60.0 else "LOW")

        # Build chronological evidence timeline
        timeline = self._build_evidence_timeline(signals, earliest_overall_ts, primary.metric)

        # Build recommended investigation steps
        investigation_steps = self._generate_investigation_steps(primary, alternatives)

        return {
            "primary_probable_cause": primary.to_dict(),
            "alternative_causes": [a.to_dict() for a in alternatives],
            "confidence_score": conf,
            "confidence_pct": conf_pct,
            "confidence_rating": conf_rating,
            "contributing_metrics": list({s.get("metric") for s in signals if s.get("metric")}),
            "evidence_timeline": timeline,
            "supporting_events_count": len(signals),
            "investigation_steps": investigation_steps
        }

    def _build_evidence_timeline(
        self,
        signals: List[Dict[str, Any]],
        earliest_ts: float,
        primary_metric: str
    ) -> List[Dict[str, Any]]:
        sorted_sigs = sorted(signals, key=lambda s: s.get("timestamp", 0.0))
        timeline = []

        for i, s in enumerate(sorted_sigs):
            ts = s.get("timestamp", 0.0)
            offset = max(0.0, ts - earliest_ts)
            metric = s.get("metric", "metric")
            
            if metric == primary_metric and i == 0:
                role = "Initial Trigger (Suspected Cause)"
            elif "latency" in metric.lower() or "error" in metric.lower() or "timeout" in metric.lower():
                role = "Downstream Symptom"
            elif "duplicate" in metric.lower() or "retry" in metric.lower():
                role = "Secondary Retry / Transport Impact"
            else:
                role = "Correlated Anomaly"

            timeline.append({
                "step_order": i + 1,
                "timestamp_utc": s.get("timestamp_utc"),
                "time_offset_s": f"+{offset:.1f}s",
                "source_node": s.get("source_id"),
                "metric": metric,
                "observed_value": s.get("value"),
                "mad_z_score": round(float(s.get("mad_z_score", 0.0)), 2),
                "severity": s.get("severity", "medium"),
                "role": role,
                "alert_context": s.get("alert_context", "")
            })

        return timeline

    def _generate_investigation_steps(
        self,
        primary: CandidateCause,
        alternatives: List[CandidateCause]
    ) -> List[str]:
        metric = primary.metric.lower()
        node = primary.source_node

        steps = []
        if "cpu" in metric:
            steps.append(f"Inspect top resource-consuming processes and thread count on host '{node}'.")
            steps.append("Check for runaway worker loops or unthrottled background cron batches.")
            steps.append("Verify if horizontal pod autoscaling (HPA) was triggered or throttled.")
        elif "mem" in metric or "ram" in metric:
            steps.append(f"Capture heap dump and review garbage collection pause metrics on '{node}'.")
            steps.append("Inspect container memory limits (cgroups) for impending OOMKilled events.")
            steps.append("Check connection pool buffers and in-memory caches for unevicted leaks.")
        elif "latency" in metric or "rtt" in metric or "network" in metric:
            steps.append(f"Check VPC transit gateway metrics and cross-zone routing latency for '{node}'.")
            steps.append("Inspect downstream TCP socket connection backlog and SYN queues.")
            steps.append("Verify packet drop rates on monitored network interfaces.")
        elif "login" in metric or "auth" in metric or "security" in metric:
            steps.append(f"Audit ingress WAF logs for IP CIDR brute-force attack clusters against '{node}'.")
            steps.append("Verify local agent redaction audit records to confirm secrets were scrubbed.")
            steps.append("Rotate potentially exposed service credentials and enforce ingress rate-limits.")
        else:
            steps.append(f"Review recent configuration and deployment commits on node '{node}'.")
            steps.append("Inspect system event logs and service status around the onset timestamp.")

        if alternatives:
            alt_metric = alternatives[0].metric
            steps.append(f"Rule out secondary hypothesis: '{alt_metric}' on '{alternatives[0].source_node}'.")

        steps.append("Authorize operator remediation runbook once root cause is confirmed.")
        return steps

    def _empty_result(self) -> Dict[str, Any]:
        return {
            "primary_probable_cause": {
                "metric": "None",
                "source_node": "None",
                "composite_score": 0.0,
                "rationale": "No signals available"
            },
            "alternative_causes": [],
            "confidence_score": 0.0,
            "confidence_pct": 0.0,
            "confidence_rating": "LOW",
            "contributing_metrics": [],
            "evidence_timeline": [],
            "supporting_events_count": 0,
            "investigation_steps": ["Ensure collector agent is streaming telemetry to cloud."]
        }
