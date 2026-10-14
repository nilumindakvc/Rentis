"""Upgrade all existing owners to the Pro plan (billing_status stays 'free').

Run AFTER `alembic upgrade head` (requires the billing_status column from 0017)
and AFTER `seed_plans.py` (requires the pro plan row to exist).

    cd backend
    python -m scripts.seed_upgrade_owners_to_pro

What this does:
  - Finds every owner_subscription whose current plan code is 'free'.
  - Switches plan_id to Pro.
  - Leaves billing_status = 'free' intentionally — has_billing_access() returns
    True for 'free', so these owners keep full Pro access without a Stripe
    subscription. When they subscribe via Stripe Checkout, billing_status will
    flip to 'trialing' or 'active' normally.

Safe to re-run: owners already on Pro (or Business) are skipped.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal
from app.models.owner_subscription import OwnerSubscription
from app.models.plan import Plan


def main():
    db = SessionLocal()
    try:
        pro_plan = db.query(Plan).filter(Plan.code == "pro").first()
        if pro_plan is None:
            print("ERROR: Pro plan not found. Run seed_plans.py first.")
            sys.exit(1)

        free_plan = db.query(Plan).filter(Plan.code == "free").first()
        if free_plan is None:
            print("ERROR: Free plan not found. Run seed_plans.py first.")
            sys.exit(1)

        subs_on_free = (
            db.query(OwnerSubscription)
            .filter(OwnerSubscription.plan_id == free_plan.id)
            .all()
        )

        if not subs_on_free:
            print("No owners on the Free plan — nothing to upgrade.")
            return

        for sub in subs_on_free:
            sub.plan_id = pro_plan.id
            # billing_status stays 'free' — grants access without requiring payment

        db.commit()
        print(f"Upgraded {len(subs_on_free)} owner(s) to Pro plan (billing_status='free').")
        print("These owners have full Pro access. When they subscribe via Stripe,")
        print("billing_status will automatically update via webhook.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
