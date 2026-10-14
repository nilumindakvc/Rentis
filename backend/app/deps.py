import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.crud import subscriptions as subscriptions_crud
from app.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.security import decode_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if creds is None:
        return None
    try:
        payload = decode_token(creds.credentials)
    except jwt.PyJWTError:
        return None
    if payload.get("type") != "access":
        return None
    if payload.get("scope", "user") != "user":
        return None
    try:
        user_id = int(payload["sub"])
    except (KeyError, ValueError):
        return None
    user = db.get(User, user_id)
    if user is not None and not user.is_active:
        return None
    return user


def get_current_user(
    user: User | None = Depends(get_optional_user),
) -> User:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not logged in")
    return user


def get_current_owner(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner account required")
    return user


def get_current_customer(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.customer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customer account required")
    return user


def enforce_listing_quota(
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
) -> None:
    sub = subscriptions_crud.get_for_owner(db, owner.id)
    if sub and not subscriptions_crud.has_billing_access(sub):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your subscription is inactive. Please renew your plan to add listings.",
        )
    limit = sub.plan.max_active_listings if sub else None
    if limit is not None and subscriptions_crud.count_active_listings(db, owner.id) >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"You've reached your plan's limit of {limit} active listings. "
                "Upgrade your plan or archive a listing to add more."
            ),
        )


def enforce_connect_access(
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
) -> None:
    sub = subscriptions_crud.get_for_owner(db, owner.id)
    if not sub or not sub.plan.allows_connect or not subscriptions_crud.has_billing_access(sub):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Connect accounts are available on Pro and Business plans.",
        )
