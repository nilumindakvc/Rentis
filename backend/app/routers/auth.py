import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import refresh_tokens as refresh_tokens_crud
from app.crud import users as users_crud
from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.user import RefreshRequest, TokenPair, UserCreate, UserLogin, UserOut
from app.security import create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["auth"])


def _issue_token_pair(db: Session, user: User) -> TokenPair:
    access_token = create_access_token(user.id, user.role.value)
    refresh_token, _ = refresh_tokens_crud.create(db, user.id)
    return TokenPair(access_token=access_token, refresh_token=refresh_token, user=UserOut.model_validate(user))


@router.post("/signup", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    if users_crud.get_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = users_crud.create_user(db, payload)
    return _issue_token_pair(db, user)


@router.post("/login", response_model=TokenPair)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = users_crud.authenticate(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended")
    return _issue_token_pair(db, user)


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    invalid = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")
    try:
        decoded = decode_token(payload.refresh_token)
    except jwt.PyJWTError:
        raise invalid

    if decoded.get("type") != "refresh":
        raise invalid

    record = refresh_tokens_crud.get_active(db, decoded.get("jti", ""))
    if record is None:
        raise invalid

    user = db.get(User, record.user_id)
    if user is None or not user.is_active:
        raise invalid

    refresh_tokens_crud.revoke(db, record.jti)
    return _issue_token_pair(db, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        decoded = decode_token(payload.refresh_token)
    except jwt.PyJWTError:
        return
    if decoded.get("type") == "refresh" and decoded.get("jti"):
        refresh_tokens_crud.revoke(db, decoded["jti"])


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
