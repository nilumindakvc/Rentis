from datetime import date, datetime

from pydantic import BaseModel


class AvailabilityBlockCreate(BaseModel):
    start_date: date
    end_date: date
    reason: str | None = None


class AvailabilityBlockOut(BaseModel):
    id: int
    property_id: int
    start_date: date
    end_date: date
    reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
