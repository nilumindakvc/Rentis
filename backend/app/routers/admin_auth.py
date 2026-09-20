import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.admin_deps import get_current_admin
from app.crud import admin_refresh_tokens as admin_refresh_tokens_crud
from app.crud import admins as admins_crud
from app.database import get_db
from app.models.admin import Admin
from app.schemas.admin import AdminLogin, AdminOut, AdminRefreshRequest, AdminTokenPair
from app.security import create_access_token, decode_token

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])


def _issue_token_pair(db: Session, admin: Admin) -> AdminTokenPair:
    access_token = create_access_token(admin.id, admin.role.value, scope="admin")
    refresh_token, _ = admin_refresh_tokens_crud.create(db, admin.id)
    return AdminTokenPair(access_token=access_token, refresh_token=refresh_token, admin=AdminOut.model_validate(admin))


@router.post("/login", response_model=AdminTokenPair)
def login(payload: AdminLogin, db: Session = Depends(get_db)):
    admin = admins_crud.authenticate(db, payload.email, payload.password)
    if admin is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return _issue_token_pair(db, admin)


@router.post("/refresh", response_model=AdminTokenPair)
def refresh(payload: AdminRefreshRequest, db: Session = Depends(get_db)):
    invalid = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")
    try:
        decoded = decode_token(payload.refresh_token)
    except jwt.PyJWTError:
        raise invalid

    if decoded.get("type") != "refresh" or decoded.get("scope") != "admin":
        raise invalid

    record = admin_refresh_tokens_crud.get_active(db, decoded.get("jti", ""))
    if record is None:
        raise invalid

    admin = admins_crud.get(db, record.admin_id)
    if admin is None:
        raise invalid

    admin_refresh_tokens_crud.revoke(db, record.jti)
    return _issue_token_pair(db, admin)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: AdminRefreshRequest, db: Session = Depends(get_db)):
    try:
        decoded = decode_token(payload.refresh_token)
    except jwt.PyJWTError:
        return
    if decoded.get("type") == "refresh" and decoded.get("scope") == "admin" and decoded.get("jti"):
        admin_refresh_tokens_crud.revoke(db, decoded["jti"])


@router.get("/me", response_model=AdminOut)
def me(admin: Admin = Depends(get_current_admin)):
    return admin
