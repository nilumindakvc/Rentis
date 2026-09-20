import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.admin import Admin
from app.models.enums import AdminRole
from app.security import decode_token

admin_bearer_scheme = HTTPBearer(auto_error=False)


def get_optional_admin(
    creds: HTTPAuthorizationCredentials | None = Depends(admin_bearer_scheme),
    db: Session = Depends(get_db),
) -> Admin | None:
    if creds is None:
        return None
    try:
        payload = decode_token(creds.credentials)
    except jwt.PyJWTError:
        return None
    if payload.get("type") != "access":
        return None
    if payload.get("scope") != "admin":
        return None
    try:
        admin_id = int(payload["sub"])
    except (KeyError, ValueError):
        return None
    return db.get(Admin, admin_id)


def get_current_admin(
    admin: Admin | None = Depends(get_optional_admin),
) -> Admin:
    if admin is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not logged in as admin")
    return admin


def get_current_super_admin(admin: Admin = Depends(get_current_admin)) -> Admin:
    if admin.role != AdminRole.super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin required")
    return admin
