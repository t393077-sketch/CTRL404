import sys
import os
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from cloud.app.database import SessionLocal, init_db
from cloud.app.models import Tenant, TenantAgentToken

def seed_tenants():
    print("[SEENIL] Initializing database and tables...")
    init_db()

    db = SessionLocal()
    try:
        tenants_data = [
            {
                "id": "tenant_alpha",
                "name": "Alpha Retail Corp",
                "token": "token_alpha_sec_98124",
                "hmac_secret": "secret_alpha_hmac_key_2026",
                "agent_name": "Alpha-Host-01 Collector"
            },
            {
                "id": "tenant_beta",
                "name": "Beta Logistics Inc",
                "token": "token_beta_sec_33918",
                "hmac_secret": "secret_beta_hmac_key_2026",
                "agent_name": "Beta-Cluster-01 Collector"
            }
        ]

        for t_info in tenants_data:
            existing_tenant = db.query(Tenant).filter(Tenant.id == t_info["id"]).first()
            if not existing_tenant:
                tenant = Tenant(id=t_info["id"], name=t_info["name"])
                db.add(tenant)
                print(f" -> Created Tenant: {t_info['name']} ({t_info['id']})")
            else:
                print(f" -> Tenant {t_info['id']} already exists.")

            existing_token = db.query(TenantAgentToken).filter(TenantAgentToken.token == t_info["token"]).first()
            if not existing_token:
                token_rec = TenantAgentToken(
                    token=t_info["token"],
                    tenant_id=t_info["id"],
                    hmac_secret=t_info["hmac_secret"],
                    name=t_info["agent_name"],
                    is_active=True
                )
                db.add(token_rec)
                print(f"    -> Registered Token for {t_info['id']}: {t_info['token']}")
            else:
                print(f"    -> Token for {t_info['id']} already exists.")

        db.commit()
        print("[SEENIL] Tenant seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"[SEENIL ERROR] Seeding failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_tenants()
