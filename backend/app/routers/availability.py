from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import availability as availability_crud
from app.crud import properties as properties_crud
from app.database import get_db
from app.deps import get_current_owner
from app.models.user import User
from app.schemas.availability import AvailabilityBlockCreate, AvailabilityBlockOut

router = APIRouter(prefix="/properties", tags=["availability"])


def _get_owned_property(db: Session, property_id: int, owner: User):
    prop = properties_crud.get_property(db, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if prop.owner_id != owner.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this listing")
    return prop


@router.get("/{property_id}/availability", response_model=list[AvailabilityBlockOut])
def list_availability(property_id: int, db: Session = Depends(get_db)):
    prop = properties_crud.get_property(db, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return availability_crud.list_for_property(db, property_id)


@router.post(
    "/{property_id}/availability", response_model=AvailabilityBlockOut, status_code=status.HTTP_201_CREATED
)
def create_availability_block(
    property_id: int,
    payload: AvailabilityBlockCreate,
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
):
    _get_owned_property(db, property_id, owner)
    if payload.start_date > payload.end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="start_date must not be after end_date")
    if availability_crud.overlaps(db, property_id, payload.start_date, payload.end_date):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Overlaps an existing blocked period")
    return availability_crud.create_block(db, property_id, payload)


@router.delete("/{property_id}/availability/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_availability_block(
    property_id: int,
    block_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
):
    _get_owned_property(db, property_id, owner)
    block = availability_crud.get_block(db, block_id)
    if block is None or block.property_id != property_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blocked period not found")
    availability_crud.delete_block(db, block)
