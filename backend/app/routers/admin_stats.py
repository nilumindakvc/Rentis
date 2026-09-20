from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.admin_deps import get_current_admin
from app.crud import admin_stats as admin_stats_crud
from app.database import get_db
from app.models.admin import Admin
from app.schemas.admin import PlatformStatsOut

router = APIRouter(prefix="/admin/stats", tags=["admin-stats"])


@router.get("/summary", response_model=PlatformStatsOut)
def stats_summary(db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    return admin_stats_crud.summary(db)
