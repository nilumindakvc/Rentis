import stripe
from sqlalchemy.orm import Session

import app.stripe_client  # noqa: F401  (configures the stripe SDK on import)
from app.config import settings
from app.models.user import User


def get_or_create_connect_account(db: Session, owner: User, country: str) -> str:
    if owner.stripe_account_id:
        return owner.stripe_account_id

    # Only `transfers` is requested: this platform uses destination charges,
    # meaning the customer's card is charged on Rentis's own account and the
    # amount is transferred to the owner afterward. The connected account
    # itself never processes a card directly, so `card_payments` isn't
    # needed.
    params = {
        "type": "express",
        "country": country,
        "email": owner.email,
        "capabilities": {"transfers": {"requested": True}},
    }
    # A `recipient` service agreement is required (and only valid) when the
    # connected account's country differs from the platform's own country —
    # e.g. this platform is US, an owner in Sri Lanka is a cross-border
    # payout. Same-country accounts must NOT set this — Stripe rejects it.
    if country != settings.stripe_platform_country:
        params["tos_acceptance"] = {"service_agreement": "recipient"}

    account = stripe.Account.create(**params)
    owner.stripe_account_id = account.id
    db.commit()
    return account.id


def create_account_link(account_id: str, return_url: str, refresh_url: str) -> str:
    link = stripe.AccountLink.create(
        account=account_id,
        return_url=return_url,
        refresh_url=refresh_url,
        type="account_onboarding",
    )
    return link.url


def sync_account_status(db: Session, user: User, stripe_account) -> User:
    user.stripe_payouts_enabled = bool(stripe_account.to_dict().get("payouts_enabled", False))
    db.commit()
    return user
