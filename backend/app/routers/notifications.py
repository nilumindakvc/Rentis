from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import notifications as notifications_crud
from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationOut, UnreadCountOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    unread_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return notifications_crud.list_notifications(db, user.id, unread_only, limit)


@router.get("/unread-count", response_model=UnreadCountOut)
def unread_count(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {"unread_count": notifications_crud.unread_count(db, user.id)}


@router.patch("/{notification_id}/read", status_code=204)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    notifications_crud.mark_read(db, user.id, notification_id)


@router.patch("/read-all", status_code=204)
def mark_all_read(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    notifications_crud.mark_all_read(db, user.id)
