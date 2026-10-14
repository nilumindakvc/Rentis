from pydantic import BaseModel


class PlanFeatureItem(BaseModel):
    text: str
    included: bool = True


class PlanOut(BaseModel):
    id: int
    code: str
    name: str
    description: str | None
    max_active_listings: int | None
    allows_booking: bool
    allows_connect: bool
    monthly_price_lkr: float
    stripe_product_id: str | None = None
    stripe_price_id: str | None = None
    features: list[PlanFeatureItem] = []
    sort_order: int

    model_config = {"from_attributes": True}


class PlanCreate(BaseModel):
    code: str
    name: str
    description: str | None = None
    max_active_listings: int | None = None
    allows_booking: bool = False
    allows_connect: bool = False
    monthly_price_lkr: float = 0
    stripe_product_id: str | None = None
    stripe_price_id: str | None = None
    features: list[PlanFeatureItem] = []
    sort_order: int = 0


class PlanUpdate(BaseModel):
    name: str
    description: str | None = None
    max_active_listings: int | None = None
    allows_booking: bool = False
    allows_connect: bool = False
    monthly_price_lkr: float = 0
    stripe_product_id: str | None = None
    stripe_price_id: str | None = None
    features: list[PlanFeatureItem] = []
    sort_order: int = 0
