from pydantic import BaseModel


class BannerOut(BaseModel):
    enabled: bool
    message: str


class BannerUpdate(BaseModel):
    enabled: bool
    message: str
