from datetime import datetime

from pydantic import BaseModel

from app.models.enums import (
    AvailabilityStatus,
    FurnishingType,
    ListingStatus,
    PropertyCondition,
    RentalTerm,
    SizeUnit,
)


class ChargeItem(BaseModel):
    label: str
    amount: float


class PhotoIn(BaseModel):
    url: str
    sort_order: int = 0


class PhotoOut(BaseModel):
    id: int
    url: str
    sort_order: int

    model_config = {"from_attributes": True}


class PropertyBase(BaseModel):
    category_id: int
    subtype_id: int
    title: str
    description: str | None = None

    address_text: str | None = None
    latitude: float | None = None
    longitude: float | None = None

    size_value: float | None = None
    size_unit: SizeUnit | None = None
    layout_description: str | None = None

    facilities: list[str] = []
    condition: PropertyCondition | None = None
    furnishing: FurnishingType | None = None
    capacity: int | None = None

    min_price: float
    price_currency: str = "LKR"
    security_deposit: float | None = None
    rental_term: RentalTerm
    renewal_terms: str | None = None
    availability_status: AvailabilityStatus = AvailabilityStatus.available
    additional_charges: list[ChargeItem] = []

    permitted_usage: str | None = None
    restrictions: str | None = None
    parking_access: str | None = None

    status: ListingStatus = ListingStatus.published


class PropertyCreate(PropertyBase):
    photos: list[PhotoIn] = []


class PropertyUpdate(PropertyCreate):
    pass


class PropertyStatusUpdate(BaseModel):
    status: ListingStatus | None = None
    availability_status: AvailabilityStatus | None = None


class PropertySummaryOut(BaseModel):
    id: int
    title: str
    category_id: int
    category_name: str
    subtype_id: int
    subtype_name: str
    address_text: str | None
    latitude: float | None
    longitude: float | None
    min_price: float
    price_currency: str
    rental_term: RentalTerm
    status: ListingStatus
    view_count: int
    primary_photo_url: str | None = None


class PropertyOut(BaseModel):
    id: int
    owner_id: int
    owner_name: str
    category_id: int
    category_name: str
    subtype_id: int
    subtype_name: str
    title: str
    description: str | None
    address_text: str | None
    latitude: float | None
    longitude: float | None
    size_value: float | None
    size_unit: SizeUnit | None
    layout_description: str | None
    facilities: list[str]
    condition: PropertyCondition | None
    furnishing: FurnishingType | None
    capacity: int | None
    min_price: float
    price_currency: str
    security_deposit: float | None
    rental_term: RentalTerm
    renewal_terms: str | None
    availability_status: AvailabilityStatus
    additional_charges: list[ChargeItem]
    permitted_usage: str | None
    restrictions: str | None
    parking_access: str | None
    status: ListingStatus
    view_count: int
    created_at: datetime
    photos: list[PhotoOut]
    is_favorited: bool = False


class OwnerPropertyOut(PropertyOut):
    conversation_count: int = 0
