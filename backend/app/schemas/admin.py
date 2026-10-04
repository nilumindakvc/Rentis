from datetime import datetime

from pydantic import BaseModel

from app.models.enums import AdminRole, ListingStatus, UserRole


class AdminLogin(BaseModel):
    email: str
    password: str


class AdminCreate(BaseModel):
    name: str
    email: str
    password: str


class AdminOut(BaseModel):
    id: int
    name: str
    email: str
    role: AdminRole
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminTokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    admin: AdminOut


class AdminRefreshRequest(BaseModel):
    refresh_token: str


class PlatformUserOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    phone: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserStatusUpdate(BaseModel):
    is_active: bool


class PlatformPropertyOut(BaseModel):
    id: int
    title: str
    owner_id: int
    owner_name: str
    primary_category_name: str
    category_name: str
    subtype_name: str
    status: ListingStatus
    min_price: float
    price_currency: str
    view_count: int
    is_featured: bool = False
    created_at: datetime


class PropertyStatusUpdate(BaseModel):
    status: ListingStatus


class PropertyFeaturedUpdate(BaseModel):
    is_featured: bool


class PlatformStatsOut(BaseModel):
    total_owners: int
    total_customers: int
    listings_by_status: dict[str, int]
    total_conversations: int
    total_messages: int
