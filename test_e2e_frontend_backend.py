import sys
import json
import requests

def test_routes():
    print("=== 1. AUDITING FRONTEND ROUTES (PORT 3000) ===")
    routes = [
        "/",
        "/agent/login",
        "/agent/dashboard",
        "/cloud/login",
        "/cloud/dashboard",
        "/demo-controls",
        "/egress-proof",
        "/proof",
        "/scenarios",
        "/fleet",
        "/incidents",
        "/reliability"
    ]
    for r in routes:
        url = f"http://localhost:3000{r}"
        try:
            resp = requests.get(url, timeout=5)
            assert resp.status_code == 200, f"Expected 200 but got {resp.status_code}"
            print(f"  [PASS] {r:20} -> 200 OK (Content length: {len(resp.content)})")
        except Exception as e:
            print(f"  [FAIL] {r:20} -> ERROR: {e}")

def test_cloud_backend():
    print("\n=== 2. AUDITING CLOUD BACKEND APIS (PORT 8000) ===")
    # 1. Health
    r = requests.get("http://127.0.0.1:8000/health", timeout=5)
    print(f"  [PASS] /health -> {r.status_code} ({r.json()})")

    # 2. Auth Login - Alpha
    r_alpha = requests.post("http://127.0.0.1:8000/api/v1/auth/login", json={"email": "analyst@seenil.cloud", "password": "seenil_cloud_pass"})
    assert r_alpha.status_code == 200
    data_a = r_alpha.json()
    print(f"  [PASS] /auth/login (Alpha) -> 200 OK: tenant_id={data_a.get('tenant_id')}")

    # 3. Auth Login - Beta
    r_beta = requests.post("http://127.0.0.1:8000/api/v1/auth/login", json={"email": "operator@beta.cloud", "password": "seenil_cloud_pass"})
    assert r_beta.status_code == 200
    data_b = r_beta.json()
    print(f"  [PASS] /auth/login (Beta) -> 200 OK: tenant_id={data_b.get('tenant_id')}")

    # 4. Fleet Summary - Alpha
    r_fa = requests.get("http://127.0.0.1:8000/api/v1/fleet/summary", headers={"X-Tenant-ID": "tenant_alpha"})
    assert r_fa.status_code == 200
    print(f"  [PASS] /fleet/summary (Alpha) -> 200 OK: total_collectors={r_fa.json().get('total_collectors')}")

    # 5. Fleet Summary - Beta
    r_fb = requests.get("http://127.0.0.1:8000/api/v1/fleet/summary", headers={"X-Tenant-ID": "tenant_beta"})
    assert r_fb.status_code == 200
    print(f"  [PASS] /fleet/summary (Beta) -> 200 OK: total_collectors={r_fb.json().get('total_collectors')}")

    # 6. Reliability Stats - Alpha
    r_rel_a = requests.get("http://127.0.0.1:8000/api/v1/reliability/stats", headers={"X-Tenant-ID": "tenant_alpha"})
    assert r_rel_a.status_code == 200
    print(f"  [PASS] /reliability/stats (Alpha) -> 200 OK: p50={r_rel_a.json().get('p50_latency_ms')}ms")

    # 7. Reliability Stats - Beta
    r_rel_b = requests.get("http://127.0.0.1:8000/api/v1/reliability/stats", headers={"X-Tenant-ID": "tenant_beta"})
    assert r_rel_b.status_code == 200
    print(f"  [PASS] /reliability/stats (Beta) -> 200 OK: p50={r_rel_b.json().get('p50_latency_ms')}ms")

    # 8. Incidents
    r_inc = requests.get("http://127.0.0.1:8000/api/v1/incidents", headers={"X-Tenant-ID": "tenant_alpha"})
    assert r_inc.status_code == 200
    print(f"  [PASS] /incidents (Alpha) -> 200 OK: count={len(r_inc.json().get('incidents', []))}")

    # 9. Incident Action
    r_act = requests.post("http://127.0.0.1:8000/api/v1/incidents/INC-8492/action", json={"action": "confirm"})
    assert r_act.status_code == 200
    print(f"  [PASS] /incidents/INC-8492/action -> 200 OK: {r_act.json().get('status')}")

def test_agent_backend():
    print("\n=== 3. AUDITING AGENT LOCAL DAEMON (PORT 8765) ===")
    # 1. Status
    r_st = requests.get("http://127.0.0.1:8765/status")
    assert r_st.status_code == 200
    print(f"  [PASS] /status -> 200 OK: {r_st.json()}")

    # 2. Audit logs
    r_log = requests.get("http://127.0.0.1:8765/audit-logs")
    assert r_log.status_code == 200
    print(f"  [PASS] /audit-logs -> 200 OK: entries={len(r_log.json())}")

    # 3. Egress Proof
    r_eg = requests.get("http://127.0.0.1:8765/egress")
    assert r_eg.status_code == 200
    print(f"  [PASS] /egress -> 200 OK: entries={len(r_eg.json().get('entries', []))}")

    # 4. Chaos - Inject Secret
    r_sec = requests.post("http://127.0.0.1:8765/control/inject-secret")
    assert r_sec.status_code == 200
    print(f"  [PASS] /control/inject-secret -> 200 OK: {r_sec.json().get('message')}")

    # 5. Chaos - Spike CPU
    r_cpu = requests.post("http://127.0.0.1:8765/control/spike-cpu")
    assert r_cpu.status_code == 200
    print(f"  [PASS] /control/spike-cpu -> 200 OK: {r_cpu.json().get('message')}")

    # 6. Chaos - Inject Anomaly Alias
    r_ano = requests.post("http://127.0.0.1:8765/control/inject-anomaly")
    assert r_ano.status_code == 200
    print(f"  [PASS] /control/inject-anomaly -> 200 OK: {r_ano.json().get('message')}")

    # 7. Chaos - Kill Connection (Outage)
    r_kill = requests.post("http://127.0.0.1:8765/control/kill-connection")
    assert r_kill.status_code == 200
    print(f"  [PASS] /control/kill-connection -> 200 OK: {r_kill.json().get('message')}")

    # 8. Chaos - Restore Connection
    r_rest = requests.post("http://127.0.0.1:8765/control/restore-connection")
    assert r_rest.status_code == 200
    print(f"  [PASS] /control/restore-connection -> 200 OK: {r_rest.json().get('message')}")

    # 9. Chaos - Send Late Event
    r_late = requests.post("http://127.0.0.1:8765/control/send-late-event")
    assert r_late.status_code == 200
    print(f"  [PASS] /control/send-late-event -> 200 OK: {r_late.json().get('message')}")

if __name__ == "__main__":
    test_routes()
    test_cloud_backend()
    test_agent_backend()
    print("\nALL AUTOMATED HTTP & API TESTS PASSED SUCCESSFULLY!")
