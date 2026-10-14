"""Stripe Billing webhook handler.

Separate from the existing /webhooks/stripe (Connect + Checkout payments)
to allow a distinct webhook secret and clear separation of concerns.
"""

from datetime import datetime, timedelta, timezone

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

import app.stripe_client  # noqa: F401
from app.config import settings
from app.crud import subscriptions as subscriptions_crud
from app.database import get_db
from app.models.enums import NotificationType
from app.models.notification import Notification
from app.models.owner_subscription import OwnerSubscription
from app.models.plan import Plan
from app.models.user import User

router = APIRouter(tags=["webhooks"])


def _find_subscription_by_customer(
    db: Session, stripe_customer_id: str
) -> OwnerSubscription | None:
    user = db.query(User).filter(User.stripe_customer_id == stripe_customer_id).first()
    if user is None:
        return None
    return subscriptions_crud.get_for_owner(db, user.id)


def _get_free_plan(db: Session) -> Plan | None:
    return db.query(Plan).filter(Plan.code == "free").first()


@router.post("/webhooks/stripe-billing", status_code=status.HTTP_200_OK)
async def stripe_billing_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_billing_webhook_secret
        )
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")

    event_type = event["type"]

    if event_type == "customer.subscription.created":
        stripe_sub = event["data"]["object"].to_dict()
        customer_id = stripe_sub.get("customer")
        sub = _find_subscription_by_customer(db, customer_id)
        if sub is None:
            return {"received": True}

        subscriptions_crud.sync_from_stripe(db, sub, stripe_sub)
        sub.has_used_trial = True

        # Sync plan from Stripe price ID
        price_id = None
        items = stripe_sub.get("items", {}).get("data", [])
        if items:
            price_id = items[0].get("price", {}).get("id")
        if price_id:
            plan = db.query(Plan).filter(Plan.stripe_price_id == price_id).first()
            if plan:
                sub.plan_id = plan.id

        db.commit()

    elif event_type == "customer.subscription.updated":
        stripe_sub = event["data"]["object"].to_dict()
        customer_id = stripe_sub.get("customer")
        sub = _find_subscription_by_customer(db, customer_id)
        if sub is None:
            return {"received": True}

        subscriptions_crud.sync_from_stripe(db, sub, stripe_sub)

        # Sync plan if price changed
        items = stripe_sub.get("items", {}).get("data", [])
        if items:
            price_id = items[0].get("price", {}).get("id")
            if price_id:
                plan = db.query(Plan).filter(Plan.stripe_price_id == price_id).first()
                if plan:
                    sub.plan_id = plan.id

        db.commit()

    elif event_type == "customer.subscription.deleted":
        stripe_sub = event["data"]["object"].to_dict()
        customer_id = stripe_sub.get("customer")
        sub = _find_subscription_by_customer(db, customer_id)
        if sub is None:
            return {"received": True}

        sub.billing_status = "canceled"
        free_plan = _get_free_plan(db)
        if free_plan:
            sub.plan_id = free_plan.id

        db.commit()
        subscriptions_crud.archive_owner_listings(db, sub.owner_id)

    elif event_type == "invoice.payment_succeeded":
        invoice = event["data"]["object"].to_dict()
        customer_id = invoice.get("customer")
        sub = _find_subscription_by_customer(db, customer_id)
        if sub is None:
            return {"received": True}

        sub.billing_status = "active"
        sub.grace_ends_at = None
        db.commit()

    elif event_type == "invoice.payment_failed":
        invoice = event["data"]["object"].to_dict()
        customer_id = invoice.get("customer")
        sub = _find_subscription_by_customer(db, customer_id)
        if sub is None:
            return {"received": True}

        sub.billing_status = "past_due"
        invoice_created = invoice.get("created")
        if invoice_created:
            sub.grace_ends_at = datetime.fromtimestamp(invoice_created, tz=timezone.utc) + timedelta(days=3)
        db.commit()

        # In-app notification for the owner
        notification = Notification(
            user_id=sub.owner_id,
            type=NotificationType.payment_failed,
            title="Payment failed",
            body=(
                "Your subscription payment failed. "
                "You have 3 days to update your payment method before your listings are archived."
            ),
        )
        db.add(notification)
        db.commit()

    return {"received": True}
