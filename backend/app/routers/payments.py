import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

import app.stripe_client  # noqa: F401  (configures the stripe SDK on import)
from app.config import settings
from app.crud import bookings as bookings_crud
from app.crud import payments as payments_crud
from app.database import get_db
from app.deps import get_current_owner
from app.models.enums import NotificationType, PaymentStatus
from app.models.notification import Notification
from app.models.user import User
from app.schemas.payment import ConnectOnboardIn, ConnectOnboardOut, ConnectStatusOut
from app.ws_manager import manager

router = APIRouter(tags=["payments"])


@router.post("/payments/connect/onboard", response_model=ConnectOnboardOut)
def connect_onboard(
    payload: ConnectOnboardIn,
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
):
    account_id = payments_crud.get_or_create_connect_account(db, owner, payload.country)
    return_url = f"{settings.frontend_base_url}/owner/dashboard?tab=payouts"
    url = payments_crud.create_account_link(account_id, return_url=return_url, refresh_url=return_url)
    return {"url": url}


@router.get("/payments/connect/status", response_model=ConnectStatusOut)
def connect_status(owner: User = Depends(get_current_owner)):
    return {"connected": bool(owner.stripe_account_id), "payouts_enabled": owner.stripe_payouts_enabled}


@router.post("/webhooks/stripe", status_code=status.HTTP_204_NO_CONTENT)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        booking = bookings_crud.get_by_checkout_session(db, session["id"])
        if booking is not None and booking.payment_status != PaymentStatus.paid:
            booking = bookings_crud.mark_paid(db, booking, session.to_dict().get("payment_intent"))
            notification = Notification(
                user_id=booking.owner_id,
                type=NotificationType.booking_paid,
                title="Payment received",
                body=f'Payment received for "{booking.property.title}" ({booking.start_date} → {booking.end_date}).',
                related_property_id=booking.property_id,
                related_booking_id=booking.id,
            )
            db.add(notification)
            db.commit()
            await manager.send_to_user(booking.owner_id, {"type": "booking_paid", "booking_id": booking.id})

    elif event["type"] == "account.updated":
        account = event["data"]["object"]
        user = db.query(User).filter(User.stripe_account_id == account["id"]).first()
        if user is not None:
            payments_crud.sync_account_status(db, user, account)

    return None
