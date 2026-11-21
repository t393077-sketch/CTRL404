"""
Comprehensive Test Suite for Topology-Aware AI Root Cause Analysis (SEENIL AIOps).

Verifies:
1. Multiple related events forming one incident (CPU spike -> memory increase -> latency increase).
2. Unrelated events remaining separate (outside time window, disconnected nodes).
3. Correct event ordering and temporal precedence analysis (t0 < t1 < t2).
4. Missing telemetry and handling unknown relationships (explicit 'unknown' tag).
5. Low-confidence RCA handling when signals are ambiguous.
6. Multi-tenant isolation (Tenant Alpha vs Tenant Beta data separation).
7. LLM failure / unavailability with deterministic grounded fallback.
"""

import sys
import os
import time
from datetime import datetime, timezone

sys.path.insert(0, r"C:\Users\shubh\.gemini\antigravity\scratch\seenil")

from cloud.app.aiops.topology import TopologyGraph, TopologyNode, TopologyEdge, NodeType, EdgeType, topology_registry
from cloud.app.aiops.rca_scorer import RCAScorer, CandidateCause
from cloud.app.aiops.ai_explainer import AIIncidentExplainer
from cloud.app.aiops.correlator import IncidentCorrelator, Incident


def test_1_multiple_related_events_form_one_incident():
    print("\n--- Test 1: Multiple Related Events Forming One Incident ---")
    correlator = IncidentCorrelator(window_seconds=90)
    now = time.time()

    # Step 1: CPU spike on node_primary
    sig1 = correlator.record_signal(
        tenant_id="tenant_alpha",
        source_id="node_primary",
        metric="system.cpu.utilization",
        value=95.5,
        health="Poor",
        category="compute",
        severity="critical",
        alert_context="CPU spike",
        mad_result={"is_anomaly": True, "modified_z_score": 4.6}
    )
    assert sig1 is not None
    inc_id = sig1["incident_id"]

    # Step 2: Memory increases 10s later on same host
    time.sleep(0.05)
    sig2 = correlator.record_signal(
        tenant_id="tenant_alpha",
        source_id="node_primary",
        metric="system.memory.percent",
        value=89.0,
        health="Fair",
        category="compute",
        severity="high",
        alert_context="Memory saturation",
        mad_result={"is_anomaly": True, "modified_z_score": 3.4}
    )
    assert sig2 is not None
    # Must join the same incident!
    assert sig2["incident_id"] == inc_id, f"Expected {inc_id} but got {sig2['incident_id']}"

    # Step 3: API Gateway latency surge (runs on node_primary)
    sig3 = correlator.record_signal(
        tenant_id="tenant_alpha",
        source_id="svc_api_gateway",
        metric="api.latency.ms",
        value=1750.0,
        health="Poor",
        category="service",
        severity="high",
        alert_context="Gateway latency spike",
        mad_result={"is_anomaly": True, "modified_z_score": 3.8}
    )
    assert sig3 is not None
    assert sig3["incident_id"] == inc_id

    # Verify RCA identifies CPU as primary probable cause
    inc = correlator._incidents[inc_id]
    rca = inc.rca_dossier
    assert rca is not None
    primary_metric = rca["primary_probable_cause"]["metric"]
    assert primary_metric == "system.cpu.utilization", f"Expected CPU as root cause, got {primary_metric}"
    print(f"  [PASS] 3 signals clustered into 1 incident '{inc_id}'. Primary probable cause: {primary_metric}")


def test_2_unrelated_events_remain_separate():
    print("\n--- Test 2: Unrelated Events Remain Separate ---")
    correlator = IncidentCorrelator(window_seconds=10) # 10s narrow window
    now = time.time()

    # Event 1 on node_primary at T-20s
    sig1 = correlator.record_signal(
        tenant_id="tenant_alpha",
        source_id="node_primary",
        metric="system.cpu.utilization",
        value=92.0,
        health="Poor",
        category="compute",
        severity="critical",
        alert_context="Old CPU event",
        mad_result={"is_anomaly": True, "modified_z_score": 4.0}
    )
    inc1_id = sig1["incident_id"]

    # Manipulate timestamp to make it outside window (> 10s ago)
    correlator._incidents[inc1_id].signals[0]["timestamp"] = now - 60

    # Event 2 on completely independent unknown node
    sig2 = correlator.record_signal(
        tenant_id="tenant_alpha",
        source_id="isolated_unknown_node_99",
        metric="unrelated.disk.smart_temp",
        value=78.0,
        health="Fair",
        category="hardware",
        severity="high",
        alert_context="Unrelated disk temp",
        mad_result={"is_anomaly": True, "modified_z_score": 3.2}
    )
    inc2_id = sig2["incident_id"]

    assert inc1_id != inc2_id, f"Unrelated events should NOT cluster: {inc1_id} vs {inc2_id}"
    print(f"  [PASS] Unrelated events separated into distinct incidents '{inc1_id}' and '{inc2_id}'")


def test_3_temporal_precedence_ordering():
    print("\n--- Test 3: Correct Temporal Precedence Ordering (t0 < t1 < t2) ---")
    topo = topology_registry.get_topology("tenant_alpha")
    scorer = RCAScorer(topo)
    base_t = time.time()

    # Create signals where Memory spiked at T, CPU spiked at T+15s
    signals = [
        {
            "source_id": "node_primary",
            "metric": "system.memory.percent",
            "value": 94.0,
            "mad_z_score": 4.5,
            "timestamp": base_t - 20,
            "timestamp_utc": "2026-11-21T10:00:00Z"
        },
        {
            "source_id": "node_primary",
            "metric": "system.cpu.utilization",
            "value": 91.0,
            "mad_z_score": 3.8,
            "timestamp": base_t - 5,
            "timestamp_utc": "2026-11-21T10:00:15Z"
        }
    ]

    res = scorer.score_incident(signals)
    # Memory changed first -> must have higher temporal score
    primary = res["primary_probable_cause"]
    assert primary["metric"] == "system.memory.percent", f"Earliest metric should be primary: {primary['metric']}"
    print(f"  [PASS] Earliest event 'system.memory.percent' correctly scored as primary probable cause")


def test_4_missing_telemetry_and_unknown_relationships():
    print("\n--- Test 4: Missing Telemetry & Explicit Unknown Relationships ---")
    topo = topology_registry.get_topology("tenant_alpha")

    # Node that does not exist in topology
    connected, rel = topo.are_connected("node_primary", "phantom_node_xyz")
    assert connected is False
    assert rel == "unknown", f"Expected 'unknown' relationship but got {rel}"

    # Extract subgraph for unknown node
    subgraph = topo.get_subgraph(["phantom_node_xyz"])
    phantom_nodes = [n for n in subgraph["nodes"] if n["id"] == "phantom_node_xyz"]
    assert len(phantom_nodes) == 1
    assert phantom_nodes[0]["is_known"] is False
    assert phantom_nodes[0]["type"] == "unknown"
    print("  [PASS] Missing/unmapped components explicitly marked with is_known=False and type='unknown'")


def test_5_low_confidence_rca_handling():
    print("\n--- Test 5: Low-Confidence RCA Handling for Conflicting Signals ---")
    topo = topology_registry.get_topology("tenant_alpha")
    scorer = RCAScorer(topo)
    base_t = time.time()

    # Two identical strength signals arriving simultaneously with no clear upstream lead
    signals = [
        {
            "source_id": "svc_order_service",
            "metric": "service.error_rate",
            "value": 12.0,
            "mad_z_score": 3.1,
            "timestamp": base_t,
            "timestamp_utc": "2026-11-21T10:00:00Z"
        },
        {
            "source_id": "svc_api_gateway",
            "metric": "service.timeout_rate",
            "value": 11.8,
            "mad_z_score": 3.0,
            "timestamp": base_t,
            "timestamp_utc": "2026-11-21T10:00:00Z"
        }
    ]

    res = scorer.score_incident(signals)
    assert res["confidence_score"] < 0.85
    assert res["confidence_rating"] in ["MEDIUM", "LOW"]
    print(f"  [PASS] Ambiguous signals flagged with realistic confidence {res['confidence_pct']}% ({res['confidence_rating']})")


def test_6_tenant_isolation():
    print("\n--- Test 6: Multi-Tenant Isolation ---")
    correlator = IncidentCorrelator(window_seconds=90)

    # Signal for tenant_alpha
    correlator.record_signal(
        tenant_id="tenant_alpha",
        source_id="node_primary",
        metric="system.cpu.utilization",
        value=95.0,
        health="Poor",
        category="compute",
        severity="critical",
        alert_context="Alpha event",
        mad_result={"is_anomaly": True, "modified_z_score": 4.5}
    )

    # Signal for tenant_beta
    correlator.record_signal(
        tenant_id="tenant_beta",
        source_id="node_beta_host",
        metric="system.cpu.utilization",
        value=91.0,
        health="Poor",
        category="compute",
        severity="high",
        alert_context="Beta event",
        mad_result={"is_anomaly": True, "modified_z_score": 3.7}
    )

    alpha_incs = correlator.get_incidents("tenant_alpha")
    beta_incs = correlator.get_incidents("tenant_beta")

    assert all(i["tenant_id"] == "tenant_alpha" for i in alpha_incs)
    assert all(i["tenant_id"] == "tenant_beta" for i in beta_incs)
    # Ensure neither sees the other's incidents
    alpha_ids = {i["incident_id"] for i in alpha_incs}
    beta_ids = {i["incident_id"] for i in beta_incs}
    assert alpha_ids.isdisjoint(beta_ids)
    print("  [PASS] Tenant Alpha and Tenant Beta incidents strictly isolated with zero cross-leakage")


def test_7_llm_failure_and_deterministic_fallback():
    print("\n--- Test 7: LLM Failure & Deterministic Grounded Fallback ---")
    explainer = AIIncidentExplainer()
    explainer.llm_enabled = False  # Simulate LLM unavailable

    topo = topology_registry.get_topology("tenant_alpha")
    scorer = RCAScorer(topo)
    signals = [
        {
            "source_id": "node_primary",
            "metric": "system.cpu.utilization",
            "value": 96.8,
            "mad_z_score": 4.82,
            "timestamp": time.time() - 30,
            "timestamp_utc": "2026-11-21T10:00:00Z"
        },
        {
            "source_id": "svc_api_gateway",
            "metric": "api.latency.ms",
            "value": 1850.0,
            "mad_z_score": 3.91,
            "timestamp": time.time() - 10,
            "timestamp_utc": "2026-11-21T10:00:20Z"
        }
    ]
    rca_res = scorer.score_incident(signals)
    explanation = explainer.explain("tenant_alpha", "Cascading CPU Incident", rca_res, topo.to_dict())

    assert explanation["generator"] == "deterministic_grounded_engine"
    assert "observed_facts" in explanation and len(explanation["observed_facts"]) >= 2
    assert "leading_hypothesis" in explanation
    assert "96.8" in explanation["summary"]
    print("  [PASS] Deterministic fallback successfully generated grounded explanation with zero external API dependencies:")
    print(f"         Summary: {explanation['summary']}")


if __name__ == "__main__":
    print("=================================================================")
    print(" RUNNING SEENIL AIOPS TOPOLOGY-AWARE RCA AUTOMATED TEST SUITE")
    print("=================================================================")
    test_1_multiple_related_events_form_one_incident()
    test_2_unrelated_events_remain_separate()
    test_3_temporal_precedence_ordering()
    test_4_missing_telemetry_and_unknown_relationships()
    test_5_low_confidence_rca_handling()
    test_6_tenant_isolation()
    test_7_llm_failure_and_deterministic_fallback()
    print("\n=================================================================")
    print(" ALL 7 TOPOLOGY-AWARE AI ROOT CAUSE ANALYSIS TESTS PASSED (100%)")
    print("=================================================================")
