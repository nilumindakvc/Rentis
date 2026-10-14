from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import subscriptions as subscriptions_crud
from app.database import get_db
from app.deps import get_current_owner
from app.models.user import User
from app.schemas.subscription import OwnerSubscriptionOut, SubscriptionSwitchIn

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/mine", response_model=OwnerSubscriptionOut)
def my_subscription(db: Session = Depends(get_db), owner: User = Depends(get_current_owner)):
    sub = subscriptions_crud.get_for_owner(db, owner.id)
    if sub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No subscription found")
    return subscriptions_crud.serialize(db, sub)


@router.post("/checkout")
def create_checkout(
    payload: SubscriptionSwitchIn,
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
):
    from app.config import settings
    from app.crud import plans as plans_crud
    from app.services import stripe_billing

    plan = plans_crud.get_by_code(db, payload.plan_code)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown plan code")
    if not plan.stripe_price_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This plan does not have Stripe billing configured",
        )

    sub = subscriptions_crud.get_for_owner(db, owner.id)
    if sub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No subscription found")

    success_url = f"{settings.frontend_base_url}/owner/dashboard?checkout=success"
    cancel_url = f"{settings.frontend_base_url}/pricing"

    url = stripe_billing.create_checkout_session(db, owner, plan, sub, success_url, cancel_url)
    return {"url": url}


@router.post("/portal")
def billing_portal(
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
):
    from app.config import settings
    from app.services import stripe_billing

    sub = subscriptions_crud.get_for_owner(db, owner.id)
    if sub is None or sub.billing_status == "free":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Billing portal is only available for paid subscriptions",
        )
    if not owner.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Stripe customer found for this account",
        )

    return_url = f"{settings.frontend_base_url}/owner/dashboard"
    url = stripe_billing.create_portal_session(owner.stripe_customer_id, return_url)
    return {"url": url}


@router.post("/cancel")
def cancel_subscription(
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
):
    from app.services import stripe_billing

    sub = subscriptions_crud.get_for_owner(db, owner.id)
    if sub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No subscription found")
    if sub.billing_status not in ("active", "trialing", "past_due"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active subscription to cancel",
        )
    if not sub.stripe_subscription_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Stripe subscription ID on record",
        )

    stripe_billing.cancel_subscription(sub.stripe_subscription_id)
    return {"message": "Cancellation initiated — your subscription will end shortly."}
