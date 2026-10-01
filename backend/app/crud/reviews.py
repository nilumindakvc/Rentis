from sqlalchemy.orm import Session, joinedload

from app.models.booking import Booking
from app.models.enums import BookingStatus, PaymentStatus, RentalTerm
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewUpdate

BOOKABLE_RENTAL_TERMS = (RentalTerm.short_term, RentalTerm.medium_term)


def list_for_property(db: Session, property_id: int) -> list[Review]:
    return (
        db.query(Review)
        .options(joinedload(Review.customer))
        .filter(Review.property_id == property_id)
        .order_by(Review.created_at.desc())
        .all()
    )


def list_for_customer(db: Session, customer_id: int) -> list[Review]:
    return (
        db.query(Review)
        .options(joinedload(Review.customer))
        .filter(Review.customer_id == customer_id)
        .order_by(Review.created_at.desc())
        .all()
    )


def get_for_customer(db: Session, review_id: int, customer_id: int) -> Review | None:
    return (
        db.query(Review)
        .options(joinedload(Review.customer))
        .filter(Review.id == review_id, Review.customer_id == customer_id)
        .first()
    )


def create_for_booking(db: Session, customer_id: int, payload: ReviewCreate) -> Review:
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.property))
        .filter(Booking.id == payload.booking_id)
        .first()
    )
    if booking is None:
        raise LookupError("Booking not found")
    if booking.customer_id != customer_id:
        raise PermissionError("You can only review your own bookings")
    if booking.property.rental_term not in BOOKABLE_RENTAL_TERMS:
        raise PermissionError(
            "Reviews are only available for short-term and medium-term listings"
        )
    if (
        booking.status != BookingStatus.accepted
        and booking.payment_status != PaymentStatus.paid
    ):
        raise PermissionError("Only accepted or paid bookings can be reviewed")
    if db.query(Review).filter(Review.booking_id == booking.id).first() is not None:
        raise ValueError("This booking has already been reviewed")

    review = Review(
        property_id=booking.property_id,
        booking_id=booking.id,
        customer_id=customer_id,
        rating=payload.rating,
        comment=payload.comment,
        show_name=payload.show_name,
    )
    db.add(review)
    db.commit()
    return (
        db.query(Review)
        .options(joinedload(Review.customer))
        .filter(Review.id == review.id)
        .one()
    )


def update(db: Session, review: Review, payload: ReviewUpdate) -> Review:
    review.rating = payload.rating
    review.comment = payload.comment
    review.show_name = payload.show_name
    db.commit()
    return (
        db.query(Review)
        .options(joinedload(Review.customer))
        .filter(Review.id == review.id)
        .one()
    )


def serialize(review: Review, *, public: bool = False) -> dict:
    return {
        "id": review.id,
        "property_id": review.property_id,
        "booking_id": review.booking_id,
        "customer_id": review.customer_id,
        "customer_name": review.customer.name if not public or review.show_name else "Anonymous",
        "rating": review.rating,
        "comment": review.comment,
        "show_name": review.show_name,
        "created_at": review.created_at,
    }
