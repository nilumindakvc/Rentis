from sqlalchemy.orm import Session

from app.models.taxonomy import (
    PropertyPrimaryCategory,
    PropertySecondaryCategory,
    PropertySubtype,
)
from app.schemas.taxonomy import (
    CategoryCreate,
    CategoryUpdate,
    PrimaryCategoryCreate,
    SubtypeCreate,
)


def get_primary(db: Session, primary_category_id: int) -> PropertyPrimaryCategory | None:
    return db.get(PropertyPrimaryCategory, primary_category_id)


def get_primary_by_slug(db: Session, slug: str) -> PropertyPrimaryCategory | None:
    return db.query(PropertyPrimaryCategory).filter(PropertyPrimaryCategory.slug == slug).first()


def create_primary(db: Session, payload: PrimaryCategoryCreate) -> PropertyPrimaryCategory:
    primary = PropertyPrimaryCategory(**payload.model_dump())
    db.add(primary)
    db.commit()
    db.refresh(primary)
    return primary


def get_secondary(db: Session, category_id: int) -> PropertySecondaryCategory | None:
    return db.get(PropertySecondaryCategory, category_id)


def get_secondary_by_slug(db: Session, slug: str) -> PropertySecondaryCategory | None:
    return (
        db.query(PropertySecondaryCategory)
        .filter(PropertySecondaryCategory.slug == slug)
        .first()
    )


def create_secondary(db: Session, payload: CategoryCreate) -> PropertySecondaryCategory:
    category = PropertySecondaryCategory(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_secondary(
    db: Session, category: PropertySecondaryCategory, payload: CategoryUpdate
) -> PropertySecondaryCategory:
    for field, value in payload.model_dump().items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    return category


def get_subtype_by_slug(db: Session, slug: str) -> PropertySubtype | None:
    return db.query(PropertySubtype).filter(PropertySubtype.slug == slug).first()


def create_subtype(db: Session, payload: SubtypeCreate) -> PropertySubtype:
    subtype = PropertySubtype(**payload.model_dump())
    db.add(subtype)
    db.commit()
    db.refresh(subtype)
    return subtype
