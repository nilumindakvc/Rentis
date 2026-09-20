from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import owner_stats as owner_stats_crud
from app.database import get_db
from app.deps import get_current_owner
from app.models.user import User
from app.schemas.notification import OwnerStatsOut

router = APIRouter(prefix="/owner/stats", tags=["owner-stats"])


@router.get("/summary", response_model=OwnerStatsOut)
def stats_summary(db: Session = Depends(get_db), owner: User = Depends(get_current_owner)):
    return owner_stats_crud.summary(db, owner.id)
