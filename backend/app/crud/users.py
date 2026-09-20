from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
from app.security import hash_password, verify_password


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, payload: UserCreate) -> User:
    user = User(
        name=payload.name,
        email=payload.email,
        password=hash_password(payload.password),
        role=payload.role,
        phone=payload.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> User | None:
    user = get_by_email(db, email)
    if user is None or not verify_password(password, user.password):
        return None
    return user


def get(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def search(db: Session, q: str | None = None, role: str | None = None) -> list[User]:
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(User.name.ilike(like), User.email.ilike(like)))
    return query.order_by(User.created_at.desc()).all()


def set_active(db: Session, user: User, is_active: bool) -> User:
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user
