from pydantic import BaseModel


class ConnectOnboardIn(BaseModel):
    country: str


class ConnectOnboardOut(BaseModel):
    url: str


class ConnectStatusOut(BaseModel):
    connected: bool
    payouts_enabled: bool
