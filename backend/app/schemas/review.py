from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    booking_id: int
    rating: int = Field(ge=1, le=5)
    comment: str | None = None
    show_name: bool = False


class ReviewUpdate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = None
    show_name: bool = False


class ReviewOut(BaseModel):
    id: int
    property_id: int
    booking_id: int
    customer_id: int
    customer_name: str
    rating: int
    comment: str | None
    show_name: bool
    created_at: datetime


class ReviewStatusOut(BaseModel):
    has_review: bool
