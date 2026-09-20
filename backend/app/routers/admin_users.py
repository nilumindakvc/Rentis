from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.admin_deps import get_current_admin
from app.crud import users as users_crud
from app.database import get_db
from app.models.admin import Admin
from app.schemas.admin import PlatformUserOut, UserStatusUpdate

router = APIRouter(prefix="/admin/users", tags=["admin-users"])


@router.get("", response_model=list[PlatformUserOut])
def list_users(
    q: str | None = None,
    role: str | None = None,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    return users_crud.search(db, q=q, role=role)


@router.patch("/{user_id}/status", response_model=PlatformUserOut)
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    user = users_crud.get(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return users_crud.set_active(db, user, payload.is_active)
