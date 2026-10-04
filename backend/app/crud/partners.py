from sqlalchemy.orm import Session

from app.models.partner import Partner
from app.schemas.partner import PartnerCreate


def list_all(db: Session) -> list[Partner]:
    return db.query(Partner).order_by(Partner.sort_order, Partner.created_at).all()


def get(db: Session, partner_id: int) -> Partner | None:
    return db.get(Partner, partner_id)


def create(db: Session, payload: PartnerCreate) -> Partner:
    partner = Partner(**payload.model_dump())
    db.add(partner)
    db.commit()
    db.refresh(partner)
    return partner


def delete(db: Session, partner: Partner) -> None:
    db.delete(partner)
    db.commit()
