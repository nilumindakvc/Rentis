from datetime import date

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.availability_block import AvailabilityBlock
from app.schemas.availability import AvailabilityBlockCreate


def list_for_property(db: Session, property_id: int) -> list[AvailabilityBlock]:
    return (
        db.query(AvailabilityBlock)
        .filter(AvailabilityBlock.property_id == property_id)
        .order_by(AvailabilityBlock.start_date)
        .all()
    )


def overlaps(db: Session, property_id: int, start_date: date, end_date: date) -> bool:
    return (
        db.query(AvailabilityBlock)
        .filter(
            AvailabilityBlock.property_id == property_id,
            and_(AvailabilityBlock.start_date <= end_date, AvailabilityBlock.end_date >= start_date),
        )
        .first()
        is not None
    )


def create_block(db: Session, property_id: int, payload: AvailabilityBlockCreate) -> AvailabilityBlock:
    block = AvailabilityBlock(
        property_id=property_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        reason=payload.reason,
    )
    db.add(block)
    db.commit()
    db.refresh(block)
    return block


def get_block(db: Session, block_id: int) -> AvailabilityBlock | None:
    return db.get(AvailabilityBlock, block_id)


def delete_block(db: Session, block: AvailabilityBlock) -> None:
    db.delete(block)
    db.commit()
