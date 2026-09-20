from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.admin_deps import get_current_super_admin
from app.crud import admins as admins_crud
from app.database import get_db
from app.models.admin import Admin
from app.schemas.admin import AdminCreate, AdminOut

router = APIRouter(prefix="/admin/admins", tags=["admin-management"])


@router.get("", response_model=list[AdminOut])
def list_admins(db: Session = Depends(get_db), _: Admin = Depends(get_current_super_admin)):
    return admins_crud.list_all(db)


@router.post("", response_model=AdminOut, status_code=status.HTTP_201_CREATED)
def create_admin(
    payload: AdminCreate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_super_admin),
):
    if admins_crud.get_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    return admins_crud.create_admin(db, payload)


@router.delete("/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_super_admin),
):
    target = admins_crud.get(db, admin_id)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")
    try:
        admins_crud.delete(db, target)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
