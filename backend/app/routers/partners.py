from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import partners as partners_crud
from app.database import get_db
from app.schemas.partner import PartnerOut

router = APIRouter(prefix="/partners", tags=["partners"])


@router.get("", response_model=list[PartnerOut])
def list_partners(db: Session = Depends(get_db)):
    return partners_crud.list_all(db)
