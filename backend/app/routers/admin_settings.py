from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.admin_deps import get_current_admin
from app.crud import app_settings as app_settings_crud
from app.database import get_db
from app.models.admin import Admin
from app.schemas.app_setting import BannerOut, BannerUpdate

router = APIRouter(prefix="/admin/settings", tags=["admin-settings"])


@router.get("/banner", response_model=BannerOut)
def get_banner(db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    return app_settings_crud.get_banner(db)


@router.put("/banner", response_model=BannerOut)
def update_banner(
    payload: BannerUpdate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    return app_settings_crud.set_banner(db, payload.enabled, payload.message)
