from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import app_settings as app_settings_crud
from app.database import get_db
from app.schemas.app_setting import BannerOut

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/banner", response_model=BannerOut)
def get_banner(db: Session = Depends(get_db)):
    return app_settings_crud.get_banner(db)
