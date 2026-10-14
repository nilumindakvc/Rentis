from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.enums import ListingStatus
from app.models.owner_subscription import OwnerSubscription
from app.models.plan import Plan
from app.models.property import Property


def get_for_owner(db: Session, owner_id: int) -> OwnerSubscription | None:
    return (
        db.query(OwnerSubscription)
        .options(joinedload(OwnerSubscription.plan))
        .filter(OwnerSubscription.owner_id == owner_id)
        .first()
    )


def create_default(db: Session, owner_id: int) -> OwnerSubscription:
    free_plan = db.query(Plan).filter(Plan.code == "free").first()
    if free_plan is None:
        raise LookupError("Free plan is not seeded in the plans table")
    sub = OwnerSubscription(owner_id=owner_id, plan_id=free_plan.id, billing_status="free")
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def switch_plan(db: Session, owner_id: int, plan_code: str) -> OwnerSubscription:
    plan = db.query(Plan).filter(Plan.code == plan_code).first()
    if plan is None:
        raise ValueError(f"Unknown plan code: {plan_code}")

    sub = get_for_owner(db, owner_id)
    if sub is None:
        sub = OwnerSubscription(owner_id=owner_id, plan_id=plan.id)
        db.add(sub)
    else:
        sub.plan_id = plan.id
    db.commit()
    db.refresh(sub)
    return sub


def count_active_listings(db: Session, owner_id: int) -> int:
    return (
        db.query(func.count(Property.id))
        .filter(Property.owner_id == owner_id, Property.status != ListingStatus.archived)
        .scalar()
        or 0
    )


def has_billing_access(subscription: OwnerSubscription) -> bool:
    if subscription.billing_status == "free":
        return True
    if subscription.billing_status in ("trialing", "active"):
        return True
    if subscription.billing_status == "past_due":
        return (
            subscription.grace_ends_at is not None
            and datetime.now(timezone.utc) <= subscription.grace_ends_at
        )
    return False


def plan_allows_booking(db: Session, owner_id: int) -> bool:
    sub = get_for_owner(db, owner_id)
    if not sub:
        return False
    return sub.plan.allows_booking and has_billing_access(sub)


def archive_owner_listings(db: Session, owner_id: int) -> None:
    db.query(Property).filter(
        Property.owner_id == owner_id,
        Property.status != ListingStatus.archived,
    ).update(
        {
            "status": ListingStatus.archived,
            "archived_by_role": "system",
            "archived_by_name": "Subscription canceled",
        },
        synchronize_session=False,
    )
    db.commit()


def sync_from_stripe(db: Session, sub: OwnerSubscription, stripe_sub: dict) -> None:
    """Write Stripe Subscription fields onto the local row. `stripe_sub` is a Stripe
    Subscription object (treated as a dict by the Stripe Python SDK)."""
    status = stripe_sub["status"]
    billing_status_map = {
        "trialing": "trialing",
        "active": "active",
        "past_due": "past_due",
        "canceled": "canceled",
        "incomplete": "past_due",
        "incomplete_expired": "canceled",
        "unpaid": "past_due",
        "paused": "past_due",
    }
    sub.billing_status = billing_status_map.get(status, status)
    sub.stripe_subscription_id = stripe_sub["id"]

    items = stripe_sub.get("items", {}).get("data", [])
    if items:
        sub.stripe_subscription_item_id = items[0]["id"]

    trial_end_ts = stripe_sub.get("trial_end")
    sub.trial_end = (
        datetime.fromtimestamp(trial_end_ts, tz=timezone.utc) if trial_end_ts else None
    )

    period_end_ts = stripe_sub.get("current_period_end")
    sub.current_period_end = (
        datetime.fromtimestamp(period_end_ts, tz=timezone.utc) if period_end_ts else None
    )

    sub.cancel_at_period_end = bool(stripe_sub.get("cancel_at_period_end", False))
    db.commit()


def serialize(db: Session, sub: OwnerSubscription) -> dict:
    return {
        "id": sub.id,
        "owner_id": sub.owner_id,
        "plan": {
            "id": sub.plan.id,
            "code": sub.plan.code,
            "name": sub.plan.name,
            "description": sub.plan.description,
            "max_active_listings": sub.plan.max_active_listings,
            "allows_booking": sub.plan.allows_booking,
            "allows_connect": sub.plan.allows_connect,
            "monthly_price_lkr": sub.plan.monthly_price_lkr,
            "stripe_product_id": sub.plan.stripe_product_id,
            "stripe_price_id": sub.plan.stripe_price_id,
            "sort_order": sub.plan.sort_order,
        },
        "active_listings_count": count_active_listings(db, sub.owner_id),
        "billing_status": sub.billing_status,
        "trial_end": sub.trial_end,
        "current_period_end": sub.current_period_end,
        "cancel_at_period_end": sub.cancel_at_period_end,
        "grace_ends_at": sub.grace_ends_at,
        "has_used_trial": sub.has_used_trial,
        "created_at": sub.created_at,
        "updated_at": sub.updated_at,
    }
