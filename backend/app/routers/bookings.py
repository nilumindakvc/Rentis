import stripe
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import app.stripe_client  # noqa: F401  (configures the stripe SDK on import)
from app.config import settings
from app.crud import bookings as bookings_crud
from app.database import get_db
from app.deps import get_current_customer, get_current_owner
from app.models.booking import Booking
from app.models.enums import BookingStatus, NotificationType, PaymentStatus
from app.models.notification import Notification
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingOut, CheckoutSessionOut
from app.ws_manager import manager

router = APIRouter(prefix="/bookings", tags=["bookings"])


def _notify_and_push(db: Session, booking: Booking, recipient_id: int, notif_type: NotificationType, title: str, body: str):
    notification = Notification(
        user_id=recipient_id,
        type=notif_type,
        title=title,
        body=body,
        related_property_id=booking.property_id,
        related_booking_id=booking.id,
    )
    db.add(notification)
    db.commit()


def _get_owned_booking(db: Session, booking_id: int, owner: User) -> Booking:
    booking = bookings_crud.get(db, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.owner_id != owner.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your listing")
    return booking


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def create_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    customer: User = Depends(get_current_customer),
):
    try:
        booking = bookings_crud.create_booking(db, customer.id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    _notify_and_push(
        db,
        booking,
        booking.owner_id,
        NotificationType.booking_request,
        f"New booking request from {customer.name}",
        f'For "{booking.property.title}", {booking.start_date} → {booking.end_date}',
    )
    await manager.send_to_user(booking.owner_id, {"type": "booking_request", "booking_id": booking.id})
    return bookings_crud.serialize(booking)


@router.get("/mine", response_model=list[BookingOut])
def my_bookings(db: Session = Depends(get_db), customer: User = Depends(get_current_customer)):
    return [bookings_crud.serialize(b) for b in bookings_crud.list_for_customer(db, customer.id)]


@router.get("/owner", response_model=list[BookingOut])
def owner_bookings(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
):
    return [bookings_crud.serialize(b) for b in bookings_crud.list_for_owner(db, owner.id, status_filter)]


@router.patch("/{booking_id}/accept", response_model=BookingOut)
async def accept_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
):
    booking = _get_owned_booking(db, booking_id, owner)
    try:
        booking, auto_rejected = bookings_crud.accept(db, booking)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    _notify_and_push(
        db,
        booking,
        booking.customer_id,
        NotificationType.booking_accepted,
        "Booking accepted",
        f'Your request for "{booking.property.title}" ({booking.start_date} → {booking.end_date}) was accepted.',
    )
    await manager.send_to_user(booking.customer_id, {"type": "booking_accepted", "booking_id": booking.id})

    for other in auto_rejected:
        _notify_and_push(
            db,
            other,
            other.customer_id,
            NotificationType.booking_rejected,
            "Booking request declined",
            f'"{other.property.title}" was booked by someone else for those dates.',
        )
        await manager.send_to_user(other.customer_id, {"type": "booking_rejected", "booking_id": other.id})

    return bookings_crud.serialize(booking)


@router.patch("/{booking_id}/reject", response_model=BookingOut)
async def reject_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
):
    booking = _get_owned_booking(db, booking_id, owner)
    booking = bookings_crud.reject(db, booking)

    _notify_and_push(
        db,
        booking,
        booking.customer_id,
        NotificationType.booking_rejected,
        "Booking request declined",
        f'Your request for "{booking.property.title}" ({booking.start_date} → {booking.end_date}) was declined.',
    )
    await manager.send_to_user(booking.customer_id, {"type": "booking_rejected", "booking_id": booking.id})
    return bookings_crud.serialize(booking)


@router.post("/{booking_id}/checkout", response_model=CheckoutSessionOut)
def start_checkout(
    booking_id: int,
    db: Session = Depends(get_db),
    customer: User = Depends(get_current_customer),
):
    booking = bookings_crud.get(db, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.customer_id != customer.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your booking")
    if booking.status != BookingStatus.accepted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only an accepted booking can be paid")
    if booking.payment_status == PaymentStatus.paid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This booking is already paid")
    if not booking.owner.stripe_payouts_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The owner hasn't finished setting up payouts yet")

    return_base = f"{settings.frontend_base_url}/customer/dashboard?tab=bookings"
    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=[
            {
                "price_data": {
                    "currency": booking.currency.lower(),
                    "unit_amount": int(round(float(booking.amount) * 100)),
                    "product_data": {"name": booking.property.title},
                },
                "quantity": 1,
            }
        ],
        payment_intent_data={"transfer_data": {"destination": booking.owner.stripe_account_id}},
        success_url=f"{return_base}&payment=success",
        cancel_url=f"{return_base}&payment=cancelled",
        metadata={"booking_id": str(booking.id)},
    )
    bookings_crud.mark_checkout_started(db, booking, session.id)
    return {"url": session.url}


@router.patch("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    customer: User = Depends(get_current_customer),
):
    booking = bookings_crud.get(db, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.customer_id != customer.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your booking")
    if booking.status != BookingStatus.pending:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only a pending booking can be cancelled")
    booking = bookings_crud.cancel(db, booking)
    return bookings_crud.serialize(booking)
