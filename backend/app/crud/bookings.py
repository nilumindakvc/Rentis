from sqlalchemy import and_
from sqlalchemy.orm import Session, joinedload

from app.crud import availability as availability_crud
from app.models.booking import Booking
from app.models.enums import BookingStatus, RentalTerm
from app.models.property import Property
from app.schemas.availability import AvailabilityBlockCreate
from app.schemas.booking import BookingCreate

BOOKABLE_RENTAL_TERMS = (RentalTerm.short_term, RentalTerm.medium_term)

RELATIONSHIPS = (joinedload(Booking.property), joinedload(Booking.customer), joinedload(Booking.owner))


def _base_query(db: Session):
    return db.query(Booking).options(*RELATIONSHIPS)


def get(db: Session, booking_id: int) -> Booking | None:
    return _base_query(db).filter(Booking.id == booking_id).first()


def create_booking(db: Session, customer_id: int, payload: BookingCreate) -> Booking:
    prop = db.get(Property, payload.property_id)
    if prop is None:
        raise ValueError("Property not found")
    if prop.rental_term not in BOOKABLE_RENTAL_TERMS:
        raise PermissionError("Booking requests are only available for short-term and medium-term listings")
    if payload.start_date > payload.end_date:
        raise ValueError("start_date must not be after end_date")
    if availability_crud.overlaps(db, prop.id, payload.start_date, payload.end_date):
        raise LookupError("Those dates are not available")

    booking = Booking(
        property_id=prop.id,
        customer_id=customer_id,
        owner_id=prop.owner_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        message=payload.message,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return get(db, booking.id)


def list_for_customer(db: Session, customer_id: int) -> list[Booking]:
    return _base_query(db).filter(Booking.customer_id == customer_id).order_by(Booking.created_at.desc()).all()


def list_for_owner(db: Session, owner_id: int, status: str | None = None) -> list[Booking]:
    query = _base_query(db).filter(Booking.owner_id == owner_id)
    if status:
        query = query.filter(Booking.status == status)
    return query.order_by(Booking.created_at.desc()).all()


def accept(db: Session, booking: Booking) -> tuple[Booking, list[Booking]]:
    if availability_crud.overlaps(db, booking.property_id, booking.start_date, booking.end_date):
        raise LookupError("Those dates are no longer available")

    availability_crud.create_block(
        db,
        booking.property_id,
        AvailabilityBlockCreate(
            start_date=booking.start_date,
            end_date=booking.end_date,
            reason=f"Booked by {booking.customer.name}",
        ),
    )
    booking.status = BookingStatus.accepted
    db.commit()

    conflicting = (
        _base_query(db)
        .filter(
            Booking.property_id == booking.property_id,
            Booking.id != booking.id,
            Booking.status == BookingStatus.pending,
            and_(Booking.start_date <= booking.end_date, Booking.end_date >= booking.start_date),
        )
        .all()
    )
    for other in conflicting:
        other.status = BookingStatus.rejected
    db.commit()

    return get(db, booking.id), [get(db, b.id) for b in conflicting]


def reject(db: Session, booking: Booking) -> Booking:
    booking.status = BookingStatus.rejected
    db.commit()
    return get(db, booking.id)


def cancel(db: Session, booking: Booking) -> Booking:
    booking.status = BookingStatus.cancelled
    db.commit()
    return get(db, booking.id)


def serialize(booking: Booking) -> dict:
    return {
        "id": booking.id,
        "property_id": booking.property_id,
        "property_title": booking.property.title,
        "owner_id": booking.owner_id,
        "owner_name": booking.owner.name,
        "customer_id": booking.customer_id,
        "customer_name": booking.customer.name,
        "start_date": booking.start_date,
        "end_date": booking.end_date,
        "status": booking.status,
        "message": booking.message,
        "created_at": booking.created_at,
        "updated_at": booking.updated_at,
    }
