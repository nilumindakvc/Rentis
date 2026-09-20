from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud.properties import PROPERTY_RELATIONSHIPS
from app.models.favorite import Favorite
from app.models.property import Property


def list_favorites(db: Session, customer_id: int) -> list[Property]:
    return (
        db.query(Property)
        .join(Favorite, Favorite.property_id == Property.id)
        .options(*PROPERTY_RELATIONSHIPS)
        .filter(Favorite.customer_id == customer_id)
        .order_by(Favorite.created_at.desc())
        .all()
    )


def add_favorite(db: Session, customer_id: int, property_id: int) -> None:
    favorite = Favorite(customer_id=customer_id, property_id=property_id)
    db.add(favorite)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()  # already favorited, treat as a no-op


def remove_favorite(db: Session, customer_id: int, property_id: int) -> None:
    db.query(Favorite).filter(
        Favorite.customer_id == customer_id, Favorite.property_id == property_id
    ).delete()
    db.commit()
