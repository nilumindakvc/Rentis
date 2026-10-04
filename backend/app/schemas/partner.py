from datetime import datetime

from pydantic import BaseModel


class PartnerCreate(BaseModel):
    name: str
    logo_url: str
    website_url: str | None = None
    sort_order: int = 0


class PartnerOut(BaseModel):
    id: int
    name: str
    logo_url: str
    website_url: str | None
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}
