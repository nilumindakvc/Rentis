from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.admin_deps import get_current_admin
from app.crud import properties as properties_crud
from app.database import get_db
from app.models.admin import Admin
from app.schemas.admin import PlatformPropertyOut
from app.schemas.admin import PropertyStatusUpdate as AdminPropertyStatusUpdate
from app.schemas.property import PropertyOut, PropertyStatusUpdate

router = APIRouter(prefix="/admin/properties", tags=["admin-properties"])


def _serialize(prop) -> dict:
    return {
        "id": prop.id,
        "title": prop.title,
        "owner_id": prop.owner_id,
        "owner_name": prop.owner.name,
        "category_name": prop.category.name,
        "subtype_name": prop.subtype.name,
        "status": prop.status,
        "min_price": prop.min_price,
        "price_currency": prop.price_currency,
        "view_count": prop.view_count,
        "created_at": prop.created_at,
    }


@router.get("", response_model=list[PlatformPropertyOut])
def list_properties(
    status_filter: str | None = None,
    category_id: int | None = None,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    props = properties_crud.list_all_for_admin(db, status_filter=status_filter, category_id=category_id)
    return [_serialize(p) for p in props]


@router.get("/{property_id}", response_model=PropertyOut)
def get_property(
    property_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    prop = properties_crud.get_property(db, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return properties_crud.serialize_full(prop)


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    prop = properties_crud.get_property(db, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    properties_crud.delete_property(db, prop)


@router.patch("/{property_id}/status", response_model=PlatformPropertyOut)
def update_property_status(
    property_id: int,
    payload: AdminPropertyStatusUpdate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    prop = properties_crud.get_property(db, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    prop = properties_crud.update_property_status(
        db, prop, PropertyStatusUpdate(status=payload.status, availability_status=None)
    )
    return _serialize(prop)
