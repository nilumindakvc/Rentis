from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.taxonomy import PropertyCategory
from app.schemas.taxonomy import CategoryOut

router = APIRouter(prefix="/taxonomy", tags=["taxonomy"])


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return (
        db.query(PropertyCategory)
        .options(joinedload(PropertyCategory.subtypes))
        .order_by(PropertyCategory.id)
        .all()
    )
