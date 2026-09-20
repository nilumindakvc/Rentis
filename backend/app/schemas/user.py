from datetime import datetime

from pydantic import BaseModel, field_validator

from app.models.enums import UserRole


def _check_email_shape(value: str) -> str:
    value = value.strip()
    if "@" not in value or value.startswith("@") or value.endswith("@"):
        raise ValueError("must be a valid email address")
    return value


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: UserRole
    phone: str | None = None

    _check_email = field_validator("email")(_check_email_shape)


class UserLogin(BaseModel):
    email: str
    password: str

    _check_email = field_validator("email")(_check_email_shape)


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    phone: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshRequest(BaseModel):
    refresh_token: str
