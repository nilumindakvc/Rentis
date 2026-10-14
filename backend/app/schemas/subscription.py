from datetime import datetime

from pydantic import BaseModel

from app.schemas.plan import PlanOut


class SubscriptionSwitchIn(BaseModel):
    plan_code: str


class OwnerSubscriptionOut(BaseModel):
    id: int
    owner_id: int
    plan: PlanOut
    active_listings_count: int
    billing_status: str
    trial_end: datetime | None = None
    current_period_end: datetime | None = None
    cancel_at_period_end: bool = False
    grace_ends_at: datetime | None = None
    has_used_trial: bool = False
    created_at: datetime
    updated_at: datetime
