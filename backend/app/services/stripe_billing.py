"""Pure Stripe API calls for billing. No direct DB writes — callers receive
Stripe objects and write to DB themselves."""

import stripe
from sqlalchemy.orm import Session

import app.stripe_client  # noqa: F401 — configures the SDK on import
from app.config import settings
from app.models.user import User


def get_or_create_customer(db: Session, user: User) -> stripe.Customer:
    if user.stripe_customer_id:
        return stripe.Customer.retrieve(user.stripe_customer_id)
    customer = stripe.Customer.create(email=user.email, name=user.name)
    user.stripe_customer_id = customer["id"]
    db.commit()
    return customer


def create_checkout_session(
    db: Session,
    user: User,
    plan,  # Plan model instance
    subscription,  # OwnerSubscription model instance
    success_url: str,
    cancel_url: str,
) -> str:
    """Return the Stripe Checkout session URL."""
    customer = get_or_create_customer(db, user)
    params: dict = {
        "customer": customer["id"],
        "mode": "subscription",
        "line_items": [{"price": plan.stripe_price_id, "quantity": 1}],
        "success_url": success_url,
        "cancel_url": cancel_url,
    }
    if not subscription.has_used_trial:
        params["subscription_data"] = {"trial_period_days": 14}
    session = stripe.checkout.Session.create(**params)
    return session["url"]


def switch_plan(stripe_subscription_item_id: str, new_price_id: str) -> stripe.SubscriptionItem:
    """Switch a subscription to a different price (Pro ↔ Business)."""
    return stripe.SubscriptionItem.modify(
        stripe_subscription_item_id,
        price=new_price_id,
        proration_behavior="always_invoice",
    )


def cancel_subscription(stripe_subscription_id: str) -> stripe.Subscription:
    """Cancel immediately. The webhook fires the cleanup."""
    return stripe.Subscription.delete(stripe_subscription_id)


def create_portal_session(stripe_customer_id: str, return_url: str) -> str:
    """Return a Stripe Billing Portal URL for the owner."""
    session = stripe.billing_portal.Session.create(
        customer=stripe_customer_id,
        return_url=return_url,
    )
    return session["url"]
