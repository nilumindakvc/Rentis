from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.taxonomy import PropertyPrimaryCategory, PropertySecondaryCategory
from app.schemas.taxonomy import CategoryOut, PrimaryCategoryOut

router = APIRouter(prefix="/taxonomy", tags=["taxonomy"])


@router.get("/primary-categories", response_model=list[PrimaryCategoryOut])
def list_primary_categories(db: Session = Depends(get_db)):
    return (
        db.query(PropertyPrimaryCategory)
        .options(
            joinedload(PropertyPrimaryCategory.secondary_categories).joinedload(
                PropertySecondaryCategory.subtypes
            )
        )
        .order_by(PropertyPrimaryCategory.id)
        .all()
    )


@router.get("/categories", response_model=list[CategoryOut])
def list_secondary_categories(
    primary_category_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(PropertySecondaryCategory)
        .options(joinedload(PropertySecondaryCategory.subtypes))
        .order_by(PropertySecondaryCategory.id)
    )
    if primary_category_id is not None:
        query = query.filter(
            PropertySecondaryCategory.primary_category_id == primary_category_id
        )
    return query.all()
