from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import plans as plans_crud
from app.database import get_db
from app.schemas.plan import PlanOut

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("", response_model=list[PlanOut])
def list_plans(db: Session = Depends(get_db)):
    return plans_crud.list_all(db)
