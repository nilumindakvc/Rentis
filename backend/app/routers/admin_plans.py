from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.admin_deps import get_current_super_admin
from app.crud import plans as plans_crud
from app.database import get_db
from app.models.admin import Admin
from app.schemas.plan import PlanCreate, PlanOut, PlanUpdate

router = APIRouter(prefix="/admin/plans", tags=["admin-plans"])


@router.get("", response_model=list[PlanOut])
def list_plans(db: Session = Depends(get_db), _: Admin = Depends(get_current_super_admin)):
    return plans_crud.list_all(db)


@router.post("", response_model=PlanOut, status_code=status.HTTP_201_CREATED)
def create_plan(
    payload: PlanCreate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_super_admin),
):
    if plans_crud.get_by_code(db, payload.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A plan with code '{payload.code}' already exists",
        )
    return plans_crud.create(db, payload)


@router.patch("/{plan_id}", response_model=PlanOut)
def update_plan(
    plan_id: int,
    payload: PlanUpdate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_super_admin),
):
    plan = plans_crud.get(db, plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return plans_crud.update(db, plan, payload)


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_super_admin),
):
    plan = plans_crud.get(db, plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    if plan.code == "free":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The Free plan cannot be deleted — new owners are assigned to it automatically at signup.",
        )

    subscriber_count = plans_crud.count_subscribers(db, plan_id)
    if subscriber_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot delete plan '{plan.code}' — {subscriber_count} owner(s) are "
                "currently subscribed to it."
            ),
        )

    plans_crud.delete(db, plan)
