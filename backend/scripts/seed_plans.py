"""Seed or update plan rows after migration.

Run once (or re-run safely) after `alembic upgrade head` on the fresh DB:

    cd backend
    python -m scripts.seed_plans

Fill in stripe_product_id and stripe_price_id after creating the Products
and Prices in the Stripe dashboard (test mode first).
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal
from app.models.plan import Plan

PLANS = [
    {
        "code": "free",
        "name": "Free",
        "description": "Get started with up to 3 listings. No booking or payout features.",
        "max_active_listings": 3,
        "allows_booking": False,
        "allows_connect": False,
        "monthly_price_lkr": 0,
        "stripe_product_id": None,
        "stripe_price_id": None,
        "features": [
            {"text": "Up to 3 active listings", "included": True},
            {"text": "Messaging with customers", "included": True},
            {"text": "Real-time notifications", "included": True},
            {"text": "Booking requests & Stripe checkout", "included": False},
            {"text": "Stripe payouts (Connect account)", "included": False},
        ],
        "sort_order": 0,
    },
    {
        "code": "pro",
        "name": "Pro",
        "description": "Up to 10 listings with booking requests and Stripe payouts.",
        "max_active_listings": 10,
        "allows_booking": True,
        "allows_connect": True,
        "monthly_price_lkr": 4999,
        "stripe_product_id": "prod_VQHl5Wz9eVQDDL",
        "stripe_price_id": "price_1UPRC4RYkbWfFLiHvDcVnhmU",    # fill after Stripe dashboard setup
        "features": [
            {"text": "Up to 10 active listings", "included": True},
            {"text": "Messaging with customers", "included": True},
            {"text": "Real-time notifications", "included": True},
            {"text": "Booking requests & Stripe checkout", "included": True},
            {"text": "Stripe payouts (Connect account)", "included": True},
        ],
        "sort_order": 1,
    },
    {
        "code": "business",
        "name": "Business",
        "description": "Unlimited listings with booking requests and Stripe payouts.",
        "max_active_listings": None,
        "allows_booking": True,
        "allows_connect": True,
        "monthly_price_lkr": 9999,
        "stripe_product_id": "prod_VQHoooJzPhrH27",  # fill after Stripe dashboard setup
        "stripe_price_id": "price_1UPRFCRYkbWfFLiHUBuQW1IB",    # fill after Stripe dashboard setup
        "features": [
            {"text": "Unlimited active listings", "included": True},
            {"text": "Messaging with customers", "included": True},
            {"text": "Real-time notifications", "included": True},
            {"text": "Booking requests & Stripe checkout", "included": True},
            {"text": "Stripe payouts (Connect account)", "included": True},
        ],
        "sort_order": 2,
    },
]


def main():
    db = SessionLocal()
    try:
        for data in PLANS:
            plan = db.query(Plan).filter(Plan.code == data["code"]).first()
            if plan is None:
                plan = Plan(**data)
                db.add(plan)
                print(f"  created plan: {data['code']}")
            else:
                for k, v in data.items():
                    setattr(plan, k, v)
                print(f"  updated plan: {data['code']}")
        db.commit()
        print("Done.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
