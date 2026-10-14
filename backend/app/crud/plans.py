from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.owner_subscription import OwnerSubscription
from app.models.plan import Plan
from app.schemas.plan import PlanCreate, PlanUpdate


def list_all(db: Session) -> list[Plan]:
    return db.query(Plan).order_by(Plan.sort_order).all()


def get(db: Session, plan_id: int) -> Plan | None:
    return db.get(Plan, plan_id)


def get_by_code(db: Session, code: str) -> Plan | None:
    return db.query(Plan).filter(Plan.code == code).first()


def create(db: Session, payload: PlanCreate) -> Plan:
    plan = Plan(**payload.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def update(db: Session, plan: Plan, payload: PlanUpdate) -> Plan:
    for field, value in payload.model_dump().items():
        setattr(plan, field, value)
    db.commit()
    db.refresh(plan)
    return plan


def count_subscribers(db: Session, plan_id: int) -> int:
    return (
        db.query(func.count(OwnerSubscription.id))
        .filter(OwnerSubscription.plan_id == plan_id)
        .scalar()
        or 0
    )


def delete(db: Session, plan: Plan) -> None:
    db.delete(plan)
    db.commit()
