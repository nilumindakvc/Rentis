from datetime import datetime

from pydantic import BaseModel

from app.models.enums import (
    AvailabilityStatus,
    FuelType,
    FurnishingType,
    ListingStatus,
    PropertyCondition,
    RentalTerm,
    SizeUnit,
    TransmissionType,
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


class VehicleDetailsIn(BaseModel):
    make: str
    model: str
    year: int | None = None
    color: str | None = None
    fuel_type: FuelType | None = None
    transmission: TransmissionType | None = None
    mileage_km: int | None = None
    seats: int | None = None
    engine_cc: int | None = None
    has_ac: bool = False
    has_gps: bool = False
    driver_included: bool = False


class VehicleDetailsOut(VehicleDetailsIn):
    model_config = {"from_attributes": True}


class GoodDetailsIn(BaseModel):
    brand: str | None = None
    model_number: str | None = None
    quantity_available: int = 1
    returnable: bool = True
    condition_notes: str | None = None


class GoodDetailsOut(GoodDetailsIn):
    model_config = {"from_attributes": True}


class PropertyBase(BaseModel):
    primary_category_id: int
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
    vehicle_details: VehicleDetailsIn | None = None
    good_details: GoodDetailsIn | None = None


class PropertyUpdate(PropertyCreate):
    pass


class PropertyStatusUpdate(BaseModel):
    status: ListingStatus | None = None
    availability_status: AvailabilityStatus | None = None


class PropertySummaryOut(BaseModel):
    id: int
    title: str
    primary_category_id: int
    primary_category_name: str
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
    is_featured: bool = False
    primary_photo_url: str | None = None


class PropertyOut(BaseModel):
    id: int
    owner_id: int
    owner_name: str
    primary_category_id: int
    primary_category_name: str
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
    is_featured: bool = False
    created_at: datetime
    photos: list[PhotoOut]
    is_favorited: bool = False
    vehicle_details: VehicleDetailsOut | None = None
    good_details: GoodDetailsOut | None = None


class OwnerPropertyOut(PropertyOut):
    conversation_count: int = 0
