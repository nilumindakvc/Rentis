from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.admin_deps import get_current_super_admin
from app.crud import taxonomy as taxonomy_crud
from app.database import get_db
from app.models.admin import Admin
from app.models.taxonomy import PropertyPrimaryCategory, PropertySecondaryCategory
from app.schemas.taxonomy import (
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    PrimaryCategoryCreate,
    PrimaryCategoryOut,
    SubtypeCreate,
    SubtypeOut,
)

router = APIRouter(prefix="/admin/taxonomy", tags=["admin-taxonomy"])


@router.get("/primary-categories", response_model=list[PrimaryCategoryOut])
def list_primary_categories(
    db: Session = Depends(get_db), _: Admin = Depends(get_current_super_admin)
):
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


@router.post(
    "/primary-categories", response_model=PrimaryCategoryOut, status_code=status.HTTP_201_CREATED
)
def create_primary_category(
    payload: PrimaryCategoryCreate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_super_admin),
):
    if taxonomy_crud.get_primary_by_slug(db, payload.slug):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A primary category with slug '{payload.slug}' already exists",
        )
    return taxonomy_crud.create_primary(db, payload)


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_secondary_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_super_admin),
):
    if taxonomy_crud.get_primary(db, payload.primary_category_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Primary category not found"
        )
    if taxonomy_crud.get_secondary_by_slug(db, payload.slug):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A category with slug '{payload.slug}' already exists",
        )
    return taxonomy_crud.create_secondary(db, payload)


@router.patch("/categories/{category_id}", response_model=CategoryOut)
def update_secondary_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_super_admin),
):
    category = taxonomy_crud.get_secondary(db, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return taxonomy_crud.update_secondary(db, category, payload)


@router.post("/subtypes", response_model=SubtypeOut, status_code=status.HTTP_201_CREATED)
def create_subtype(
    payload: SubtypeCreate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_super_admin),
):
    if taxonomy_crud.get_secondary(db, payload.category_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    if taxonomy_crud.get_subtype_by_slug(db, payload.slug):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A subtype with slug '{payload.slug}' already exists",
        )
    return taxonomy_crud.create_subtype(db, payload)
