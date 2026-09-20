from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.crud import favorites as favorites_crud
from app.crud import properties as properties_crud
from app.database import get_db
from app.deps import get_current_customer
from app.models.user import User
from app.schemas.favorite import FavoriteCreate
from app.schemas.property import PropertySummaryOut

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=list[PropertySummaryOut])
def list_favorites(db: Session = Depends(get_db), customer: User = Depends(get_current_customer)):
    props = favorites_crud.list_favorites(db, customer.id)
    return [properties_crud.serialize_summary(p) for p in props]


@router.post("", status_code=status.HTTP_204_NO_CONTENT)
def add_favorite(
    payload: FavoriteCreate,
    db: Session = Depends(get_db),
    customer: User = Depends(get_current_customer),
):
    favorites_crud.add_favorite(db, customer.id, payload.property_id)


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    property_id: int,
    db: Session = Depends(get_db),
    customer: User = Depends(get_current_customer),
):
    favorites_crud.remove_favorite(db, customer.id, property_id)
