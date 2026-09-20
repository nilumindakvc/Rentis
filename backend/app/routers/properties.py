from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud import properties as properties_crud
from app.database import get_db
from app.deps import get_current_owner, get_optional_user
from app.models.enums import RentalTerm
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.property import (
    OwnerPropertyOut,
    PropertyCreate,
    PropertyOut,
    PropertyStatusUpdate,
    PropertySummaryOut,
    PropertyUpdate,
)

router = APIRouter(prefix="/properties", tags=["properties"])


@router.get("", response_model=PaginatedResponse[PropertySummaryOut])
def search_properties(
    category_id: int | None = None,
    subtype_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    rental_term: RentalTerm | None = None,
    q: str | None = None,
    north: float | None = None,
    south: float | None = None,
    east: float | None = None,
    west: float | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=9, ge=1, le=100),
    sort: str = "newest",
    db: Session = Depends(get_db),
):
    items, total = properties_crud.search_properties(
        db,
        category_id=category_id,
        subtype_id=subtype_id,
        min_price=min_price,
        max_price=max_price,
        rental_term=rental_term.value if rental_term else None,
        q=q,
        north=north,
        south=south,
        east=east,
        west=west,
        page=page,
        page_size=page_size,
        sort=sort,
    )
    return {
        "items": [properties_crud.serialize_summary(p) for p in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/mine", response_model=list[OwnerPropertyOut])
def my_properties(db: Session = Depends(get_db), owner: User = Depends(get_current_owner)):
    pairs = properties_crud.get_owner_properties(db, owner.id)
    return [properties_crud.serialize_full(p, conversation_count=count) for p, count in pairs]


@router.get("/{property_id}", response_model=PropertyOut)
def get_property(
    property_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    prop = properties_crud.get_property(db, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    if user is None or user.id != prop.owner_id:
        properties_crud.increment_view_count(db, prop)

    favorited = properties_crud.is_favorited(db, property_id, user.id if user else None)
    return properties_crud.serialize_full(prop, favorited=favorited)


@router.post("", response_model=PropertyOut, status_code=status.HTTP_201_CREATED)
def create_property(
    payload: PropertyCreate,
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
):
    prop = properties_crud.create_property(db, owner.id, payload)
    return properties_crud.serialize_full(prop)


def _get_owned_property(db: Session, property_id: int, owner: User):
    prop = properties_crud.get_property(db, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if prop.owner_id != owner.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this listing")
    return prop


@router.put("/{property_id}", response_model=PropertyOut)
def update_property(
    property_id: int,
    payload: PropertyUpdate,
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
):
    prop = _get_owned_property(db, property_id, owner)
    prop = properties_crud.update_property(db, prop, payload)
    return properties_crud.serialize_full(prop)


@router.patch("/{property_id}/status", response_model=PropertyOut)
def update_property_status(
    property_id: int,
    payload: PropertyStatusUpdate,
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
):
    prop = _get_owned_property(db, property_id, owner)
    prop = properties_crud.update_property_status(db, prop, payload)
    return properties_crud.serialize_full(prop)


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
):
    prop = _get_owned_property(db, property_id, owner)
    properties_crud.delete_property(db, prop)
