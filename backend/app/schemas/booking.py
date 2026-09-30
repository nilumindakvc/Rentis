from datetime import date, datetime

from pydantic import BaseModel

from app.models.enums import BookingStatus, PaymentStatus


class BookingCreate(BaseModel):
    property_id: int
    start_date: date
    end_date: date
    message: str | None = None


class BookingOut(BaseModel):
    id: int
    property_id: int
    property_title: str
    owner_id: int
    owner_name: str
    customer_id: int
    customer_name: str
    start_date: date
    end_date: date
    status: BookingStatus
    message: str | None
    amount: float
    currency: str
    payment_status: PaymentStatus
    created_at: datetime
    updated_at: datetime


class CheckoutSessionOut(BaseModel):
    url: str
