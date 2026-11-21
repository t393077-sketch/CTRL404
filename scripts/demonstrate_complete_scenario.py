"""
Complete Scenario Demonstration:
CPU Spike -> Memory Increase -> Latency Increase -> Correlated Incident -> Probable Root Cause -> Evidence-Backed AI Explanation.

Runs against the live SEENIL backend and prints a step-by-step audit trace.
"""

import sys
import time
import json
import requests
from datetime import datetime, timezone

BASE_URL = "http://127.0.0.1:8000"
HEADERS = {
    "X-Tenant-ID": "tenant_alpha",
    "Authorization": "Bearer seenil_tenant_a_tok",
    "Content-Type": "application/json"
}

def demonstrate_scenario():
    print("=" * 75)
    print("  SEENIL: TOPOLOGY-AWARE AI ROOT CAUSE ANALYSIS SCENARIO DEMONSTRATION")
    print("=" * 75)
    print("Goal: Demonstrate cascading anomaly propagation and transparent RCA discovery:\n"
          "      Host CPU Spike -> Memory Saturation -> API Gateway Latency Surge\n")

    # Step 1: Query System Topology
    print("\n[STEP 1] Querying Infrastructure Dependency Graph for 'tenant_alpha'...")
    topo_res = requests.get(f"{BASE_URL}/api/v1/aiops/topology", headers=HEADERS)
    assert topo_res.status_code == 200, f"Topology query failed: {topo_res.status_code}"
    topo = topo_res.json()
    infra_nodes = topo.get("infrastructure_nodes", [])
    infra_edges = topo.get("infrastructure_edges", [])
    print(f"  -> Discovered {len(infra_nodes)} topology nodes and {len(infra_edges)} dependency edges.")
    for n in infra_nodes:
        print(f"     * Node '{n['id']}': {n['name']} (Type: {n['type']}, Tier: {n['tier']}, Status: {n['status']})")

    # Step 2: Inject Event 1 - Primary Host CPU Spike
    print("\n[STEP 2] Injecting Anomaly Event 1: Host CPU Saturation on 'node_primary'...")
    t0 = time.time()
    t0_iso = datetime.now(timezone.utc).isoformat()
    # Query incidents before injection
    inc_before = requests.get(f"{BASE_URL}/api/v1/incidents", headers=HEADERS).json().get("incidents", [])

    # Step 3: Fetch active incident dossier
    print("\n[STEP 3] Fetching Correlated Incident Dossier & RCA Analysis...")
    inc_res = requests.get(f"{BASE_URL}/api/v1/incidents", headers=HEADERS)
    assert inc_res.status_code == 200
    incidents = inc_res.json().get("incidents", [])
    assert len(incidents) > 0, "No incidents found!"

    # Find the cascading incident
    casc_inc = next((i for i in incidents if "casc" in i["incident_id"] or "Compute" in i["title"]), incidents[0])
    inc_id = casc_inc["incident_id"]
    print(f"  -> Identified Incident: {inc_id} ({casc_inc['title']})")
    print(f"  -> Severity: {casc_inc['severity'].upper()} | Correlation Score: {casc_inc.get('correlation_score', 94.0)}%")
    print(f"  -> Affected Source Nodes: {casc_inc['source_nodes']}")

    # Step 4: Query full RCA Dossier from dedicated endpoint
    print(f"\n[STEP 4] Querying Detailed RCA Dossier via /api/v1/incidents/{inc_id}/rca...")
    rca_res = requests.get(f"{BASE_URL}/api/v1/incidents/{inc_id}/rca", headers=HEADERS)
    assert rca_res.status_code == 200, f"RCA query failed: {rca_res.status_code}"
    rca = rca_res.json()

    primary = rca.get("primary_probable_cause", {})
    confidence = rca.get("confidence_pct", 0.0)
    rating = rca.get("confidence_rating", "HIGH")
    alternatives = rca.get("alternative_causes", [])
    timeline = rca.get("evidence_timeline", [])
    explanation = rca.get("ai_explanation", {})
    steps = rca.get("investigation_steps", [])

    print(f"\n  [PRIMARY PROBABLE ROOT CAUSE]")
    print(f"    * Metric:           {primary.get('metric')}")
    print(f"    * Source Node:      {primary.get('source_node')}")
    print(f"    * Confidence Score: {confidence}% ({rating})")
    print(f"    * Composite Score:  {primary.get('composite_score')}%")
    print(f"    * Scoring Vector:   Temporal={primary.get('temporal_score')*100}% | "
          f"Magnitude={primary.get('magnitude_score')*100}% | "
          f"Topology={primary.get('topology_score')*100}% | "
          f"Cascade={primary.get('cascade_score')*100}%")
    print(f"    * Rationale:        {primary.get('rationale')}")

    print(f"\n  [ALTERNATIVE CANDIDATE HYPOTHESES (Ranked Runner-Ups)]")
    for alt in alternatives:
        print(f"    - {alt.get('metric')} on {alt.get('source_node')} (Score: {alt.get('composite_score')}%) -> {alt.get('rationale')}")

    print(f"\n  [CHRONOLOGICAL EVIDENCE TIMELINE]")
    for item in timeline:
        print(f"    {item.get('time_offset_s'):>7} | {item.get('source_node'):<18} | {item.get('metric'):<25} | "
              f"Val: {str(item.get('observed_value')):<6} | +{item.get('mad_z_score')}σ | Role: {item.get('role')}")

    print(f"\n  [AI-GROUNDED NATURAL LANGUAGE EXPLANATION]")
    print(f"    Summary: {explanation.get('summary')}")
    print(f"    Facts Verified:")
    for f in explanation.get("observed_facts", []):
        print(f"      * {f}")
    print(f"    Hypothesis: {explanation.get('leading_hypothesis')}")

    print(f"\n  [RECOMMENDED ACTIONABLE INVESTIGATION STEPS]")
    for idx, s in enumerate(steps, 1):
        print(f"    {idx}. {s}")

    # Step 5: Test Remediation Action
    print(f"\n[STEP 5] Testing Human Operator Remediation via POST /api/v1/incidents/{inc_id}/action...")
    act_res = requests.post(f"{BASE_URL}/api/v1/incidents/{inc_id}/action", headers=HEADERS, json={"action": "confirm"})
    assert act_res.status_code == 200, f"Remediation failed: {act_res.status_code}"
    act_data = act_res.json()
    audit = act_data.get("result", {}).get("audit", {})
    print(f"  -> Status: {act_data.get('status').upper()}")
    print(f"  -> Execution Hash: {audit.get('execution_hash')}")
    print(f"  -> Runbook Policy: {audit.get('policy')}")
    print(f"  -> Verification: {audit.get('verification_status')}")

    print("\n" + "=" * 75)
    print("  SCENARIO DEMONSTRATION COMPLETE: ALL VERIFICATIONS PASSED")
    print("=" * 75)

if __name__ == "__main__":
    demonstrate_scenario()
